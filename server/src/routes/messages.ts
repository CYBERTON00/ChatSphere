import { Router } from 'express';
import supabase from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate, messageSchema } from '../middleware/validate';

const router = Router();

router.get('/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url)')
      .or(`(sender_id.eq.${req.user!.id},receiver_id.eq.${req.params.userId}),(sender_id.eq.${req.params.userId},receiver_id.eq.${req.user!.id})`)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;
    res.json((data || []).reverse());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/group/:groupId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url)')
      .eq('group_id', req.params.groupId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;
    res.json((data || []).reverse());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, validate(messageSchema), async (req: AuthRequest, res) => {
  try {
    const { content, receiverId, groupId, type, replyTo } = req.body;

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: req.user!.id,
        receiver_id: receiverId || null,
        group_id: groupId || null,
        content,
        type,
        reply_to: replyTo || null,
      })
      .select('*, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url)')
      .single();

    if (error) throw error;
    res.status(201).json(message);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    const { data, error } = await supabase
      .from('messages')
      .update({ content, is_edited: true, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('sender_id', req.user!.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true, content: null })
      .eq('id', req.params.id)
      .eq('sender_id', req.user!.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { emoji } = req.body;
    const { error } = await supabase
      .from('message_reactions')
      .upsert({ message_id: req.params.id, user_id: req.user!.id, emoji });

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/reactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { emoji } = req.body;
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', req.params.id)
      .eq('user_id', req.user!.id)
      .eq('emoji', emoji);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
