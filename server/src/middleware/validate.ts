import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  displayName: z.string().min(1).max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const messageSchema = z.object({
  content: z.string().max(5000).optional(),
  receiverId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  type: z.enum(['text', 'image', 'video', 'audio', 'file']).default('text'),
  replyTo: z.string().uuid().optional(),
}).refine(data => data.receiverId || data.groupId, {
  message: 'Either receiverId or groupId is required',
});

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }
    req.body = result.data;
    next();
  };
}
