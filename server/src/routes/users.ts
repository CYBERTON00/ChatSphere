import { Router } from 'express';
import supabase from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase.from('profiles').select('id, username, display_name, avatar_url, bio, status, is_online, last_seen');

    if (search) {
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    const { data, error } = await query.neq('id', req.user!.id).range(offset, offset + Number(limit) - 1);
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('id, username, display_name, avatar_url, cover_url, bio, status, is_online, last_seen, created_at').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { displayName, bio, status } = req.body;
    const updates: any = {};
    if (displayName) updates.display_name = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (status) updates.status = status;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.from('profiles').update(updates).eq('id', req.user!.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/avatar', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { avatarUrl } = req.body;
    const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', req.user!.id);
    if (error) throw error;
    res.json({ avatarUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/friends/list', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data: friendships } = await supabase.from('friends').select('friend_id').eq('user_id', req.user!.id);
    if (!friendships?.length) return res.json([]);

    const friendIds = friendships.map(f => f.friend_id);
    const { data } = await supabase.from('profiles').select('id, username, display_name, avatar_url, status, is_online, last_seen').in('id', friendIds);
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/friends/request', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { receiverId } = req.body;
    const { error } = await supabase.from('friend_requests').insert({ sender_id: req.user!.id, receiver_id: receiverId });
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/friends/request/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const { data: request } = await supabase.from('friend_requests').update({ status }).eq('id', req.params.id).select().single();
    if (request && status === 'accepted') {
      await supabase.from('friends').insert([
        { user_id: request.sender_id, friend_id: request.receiver_id },
        { user_id: request.receiver_id, friend_id: request.sender_id },
      ]);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/friends/requests', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data } = await supabase.from('friend_requests').select('*, sender:profiles!friend_requests_sender_id_fkey(username, display_name, avatar_url)').eq('receiver_id', req.user!.id).eq('status', 'pending');
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
