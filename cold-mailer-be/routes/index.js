import express from 'express';
import authRoutes from './Auth.js';
import uploadRoutes from './UploadCsv.js';
import sendEmail from './SendEmail.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/send-email', sendEmail);

export default router;
