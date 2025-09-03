import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh', authController.refresh);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, auditLogger('LOGOUT', 'USER'), authController.logout);

// User management routes (CFO and GM only)
router.get('/users', authenticate, authController.getUsers);
router.post('/users', authenticate, authController.createUser);
router.patch('/users/:id/status', authenticate, authController.updateUserStatus);
router.get('/roles', authenticate, authController.getRoles);

export default router;