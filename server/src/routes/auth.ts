import { Router } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../database';
import { generateTokens, authMiddleware, AuthRequest } from '../middleware/auth';
import { validate, registerSchema, loginSchema } from '../middleware/validate';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, username, displayName } = req.body;

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const { data: existingUser } = await supabase.from('profiles').select('id').eq('username', username).single();
    if (existingUser) return res.status(400).json({ error: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase.from('users').insert({ email, password_hash: passwordHash }).select('id, email, role').single();
    if (error) throw error;

    await supabase.from('profiles').insert({ id: user.id, username, display_name: displayName });

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ user: { id: user.id, email: user.email, username, displayName, role: user.role }, ...tokens });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.is_banned) return res.status(403).json({ error: 'Account is banned', reason: user.ban_reason });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    const { data: profile } = await supabase.from('profiles').select('username, display_name, avatar_url, bio, status').eq('id', user.id).single();

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    res.json({ user: { id: user.id, email: user.email, role: user.role, ...profile }, ...tokens });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || '') as { id: string; email: string; role: string };

    const { data: user } = await supabase.from('users').select('id, email, role, is_banned').eq('id', decoded.id).single();
    if (!user || user.is_banned) return res.status(401).json({ error: 'Invalid token' });

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await supabase.from('sessions').delete().eq('user_id', req.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
