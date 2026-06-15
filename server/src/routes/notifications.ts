import { Router } from 'express';
import supabase from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unread', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user!.id)
      .eq('is_read', false);

    res.json({ count: count || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/read-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user!.id).eq('is_read', false);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
