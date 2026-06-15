import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import supabase from '../database';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/image', authMiddleware, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const fileName = `images/${uuidv4()}-${req.file.originalname}`;

    const { error } = await supabase.storage.from('attachments').upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(fileName);
    res.json({ url: urlData.publicUrl, fileName, fileSize: req.file.size, fileType: req.file.mimetype });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/file', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const fileName = `files/${uuidv4()}-${req.file.originalname}`;

    const { error } = await supabase.storage.from('attachments').upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(fileName);
    res.json({ url: urlData.publicUrl, fileName, fileSize: req.file.size, fileType: req.file.mimetype, fileOriginalName: req.file.originalname });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
