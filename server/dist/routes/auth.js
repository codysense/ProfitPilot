"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const authController = new auth_1.AuthController();
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh', authController.refresh);
router.get('/me', auth_2.authenticate, authController.me);
router.post('/logout', auth_2.authenticate, (0, audit_1.auditLogger)('LOGOUT', 'USER'), authController.logout);
// User management routes (CFO and GM only)
router.get('/users', auth_2.authenticate, authController.getUsers);
router.post('/users', auth_2.authenticate, authController.createUser);
router.patch('/users/:id/status', auth_2.authenticate, authController.updateUserStatus);
router.get('/roles', auth_2.authenticate, authController.getRoles);
exports.default = router;
