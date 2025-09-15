import express from 'express';
import memosController from '../controllers/memos';
const router = express.Router();
router.use('/', memosController as any);
export default router;
