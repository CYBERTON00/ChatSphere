import { Router } from 'express';
import supabase from '../database';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware, adminMiddleware);

router.get('/users', async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '50', search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase.from('users').select('id, email, role, is_banned, last_login, created_at, profile:profiles(username, display_name, avatar_url)');
    if (search) query = query.ilike('email', `%${search}%`);

    const { data, error } = await query.range(offset, offset + Number(limit) - 1);
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ban', async (req: AuthRequest, res) => {
  try {
    const { userId, reason } = req.body;
    await supabase.from('users').update({ is_banned: true, ban_reason: reason }).eq('id', userId);
    await supabase.from('admin_logs').insert({ admin_id: req.user!.id, action: 'ban_user', target_type: 'user', target_id: userId, details: { reason } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/unban', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    await supabase.from('users').update({ is_banned: false, ban_reason: null }).eq('id', userId);
    await supabase.from('admin_logs').insert({ admin_id: req.user!.id, action: 'unban_user', target_type: 'user', target_id: userId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (_req: AuthRequest, res) => {
  try {
    const [users, messages, groups] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('groups').select('*', { count: 'exact', head: true }),
    ]);
    res.json({ totalUsers: users.count || 0, totalMessages: messages.count || 0, totalGroups: groups.count || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports', async (_req: AuthRequest, res) => {
  try {
    const { data } = await supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(username, display_name)').order('created_at', { ascending: false }).limit(50);
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/reports/:id', async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    await supabase.from('reports').update({ status, reviewed_by: req.user!.id }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', async (_req: AuthRequest, res) => {
  try {
    const { data } = await supabase.from('admin_logs').select('*, admin:profiles!admin_logs_admin_id_fkey(username, display_name)').order('created_at', { ascending: false }).limit(100);
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
