import { Server, Socket } from 'socket.io';
import supabase from '../database';

const onlineUsers = new Map<string, string>();

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    socket.on('register', async (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socket.data.userId = userId;

      await supabase.from('profiles').update({ is_online: true }).eq('id', userId);
      io.emit('user:online', { userId, isOnline: true });
    });

    socket.on('message:send', async (data: any) => {
      try {
        const { content, receiverId, groupId, type = 'text', replyTo } = data;

        const { data: message, error } = await supabase
          .from('messages')
          .insert({
            sender_id: socket.data.userId,
            receiver_id: receiverId || null,
            group_id: groupId || null,
            content,
            type,
            reply_to: replyTo || null,
          })
          .select('*, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url)')
          .single();

        if (error) throw error;

        if (receiverId) {
          const receiverSocket = onlineUsers.get(receiverId);
          if (receiverSocket) io.to(receiverSocket).emit('message:new', message);
          socket.emit('message:new', message);
        } else if (groupId) {
          const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', groupId);
          members?.forEach(m => {
            if (m.user_id !== socket.data.userId) {
              const memberSocket = onlineUsers.get(m.user_id);
              if (memberSocket) io.to(memberSocket).emit('message:new', message);
            }
          });
          socket.emit('message:new', message);
        }
      } catch (err) {
        console.error('Message send error:', err);
      }
    });

    socket.on('message:edit', async (data: { messageId: string; content: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({ content: data.content, is_edited: true, updated_at: new Date().toISOString() })
        .eq('id', data.messageId)
        .eq('sender_id', socket.data.userId);

      if (!error) io.emit('message:edited', { messageId: data.messageId, content: data.content });
    });

    socket.on('message:delete', async (data: { messageId: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true, content: null })
        .eq('id', data.messageId)
        .eq('sender_id', socket.data.userId);

      if (!error) io.emit('message:deleted', { messageId: data.messageId });
    });

    socket.on('message:react', async (data: { messageId: string; emoji: string }) => {
      await supabase.from('message_reactions').upsert({
        message_id: data.messageId,
        user_id: socket.data.userId,
        emoji: data.emoji,
      });
      io.emit('message:reaction', { messageId: data.messageId, userId: socket.data.userId, emoji: data.emoji });
    });

    socket.on('typing:start', (data: { receiverId?: string; groupId?: string }) => {
      if (data.receiverId) {
        const s = onlineUsers.get(data.receiverId);
        if (s) io.to(s).emit('typing:start', { userId: socket.data.userId });
      } else if (data.groupId) {
        socket.to(`group:${data.groupId}`).emit('typing:start', { userId: socket.data.userId, groupId: data.groupId });
      }
    });

    socket.on('typing:stop', (data: { receiverId?: string; groupId?: string }) => {
      if (data.receiverId) {
        const s = onlineUsers.get(data.receiverId);
        if (s) io.to(s).emit('typing:stop', { userId: socket.data.userId });
      } else if (data.groupId) {
        socket.to(`group:${data.groupId}`).emit('typing:stop', { userId: socket.data.userId, groupId: data.groupId });
      }
    });

    socket.on('call:invite', (data: { receiverId: string; callId: string; type: string }) => {
      const s = onlineUsers.get(data.receiverId);
      if (s) io.to(s).emit('call:incoming', { callerId: socket.data.userId, callId: data.callId, type: data.type });
    });

    socket.on('call:accept', (data: { callerId: string; callId: string }) => {
      const s = onlineUsers.get(data.callId);
      if (s) io.to(s).emit('call:accepted', { receiverId: socket.data.userId, callId: data.callId });
    });

    socket.on('call:reject', (data: { callerId: string; callId: string }) => {
      const s = onlineUsers.get(data.callerId);
      if (s) io.to(s).emit('call:rejected', { receiverId: socket.data.userId, callId: data.callId });
    });

    socket.on('call:end', (data: { callId: string; targetUserId: string }) => {
      const s = onlineUsers.get(data.targetUserId);
      if (s) io.to(s).emit('call:ended', { callId: data.callId, userId: socket.data.userId });
    });

    socket.on('webrtc:signal', (data: { targetUserId: string; signal: any }) => {
      const s = onlineUsers.get(data.targetUserId);
      if (s) io.to(s).emit('webrtc:signal', { senderId: socket.data.userId, signal: data.signal });
    });

    socket.on('disconnect', async () => {
      const userId = socket.data.userId;
      if (userId) {
        onlineUsers.delete(userId);
        await supabase.from('profiles').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', userId);
        io.emit('user:offline', { userId, isOnline: false });
      }
      console.log('User disconnected:', socket.id);
    });
  });
}
