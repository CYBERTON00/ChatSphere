import { Router } from 'express';
import supabase from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/start', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { receiverId, groupId, type } = req.body;
    const { data, error } = await supabase
      .from('call_logs')
      .insert({ caller_id: req.user!.id, receiver_id: receiverId || null, group_id: groupId || null, type, status: 'missed' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/end', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status, duration } = req.body;
    const { data, error } = await supabase
      .from('call_logs')
      .update({ status, duration, ended_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data } = await supabase
      .from('call_logs')
      .select('*, caller:profiles!call_logs_caller_id_fkey(username, display_name, avatar_url), receiver:profiles!call_logs_receiver_id_fkey(username, display_name, avatar_url)')
      .or(`caller_id.eq.${req.user!.id},receiver_id.eq.${req.user!.id}`)
      .order('started_at', { ascending: false })
      .limit(50);

    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
