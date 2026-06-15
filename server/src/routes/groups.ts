import { Router } from 'express';
import supabase from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', req.user!.id);
    if (!memberships?.length) return res.json([]);

    const groupIds = memberships.map(m => m.group_id);
    const { data } = await supabase.from('groups').select('*, creator:profiles!groups_creator_id_fkey(username, display_name, avatar_url), members:group_members(user_id)').in('id', groupIds);
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description, memberIds = [] } = req.body;

    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, description: description || '', creator_id: req.user!.id })
      .select()
      .single();

    if (error) throw error;

    const members = [{ group_id: group.id, user_id: req.user!.id, role: 'owner' }, ...memberIds.map((id: string) => ({ group_id: group.id, user_id: id, role: 'member' }))];
    await supabase.from('group_members').insert(members);

    res.status(201).json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*, creator:profiles!groups_creator_id_fkey(username, display_name, avatar_url), members:group_members(*, user:profiles(id, username, display_name, avatar_url, is_online))')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/members', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    const { error } = await supabase.from('group_members').insert({ group_id: req.params.id, user_id: userId, role: 'member' });
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/members/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { error } = await supabase.from('group_members').delete().eq('group_id', req.params.id).eq('user_id', req.params.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { error } = await supabase.from('groups').delete().eq('id', req.params.id).eq('creator_id', req.user!.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
