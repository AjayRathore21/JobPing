import express from 'express';
import authRoutes from './Auth.js';
import uploadRoutes from './UploadCsv.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);

export default router;
