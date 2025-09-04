"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.substring(7);
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Fetch user with roles and permissions
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({ error: 'User not found or inactive' });
        }
        // Extract roles and permissions
        const roles = user.userRoles.map(ur => ur.role.name);
        const permissions = user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.name));
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            roles,
            permissions
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const authorize = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Check if user has the required permission or is a CFO/General Manager with full access
        const hasPermission = req.user.permissions.includes(requiredPermission);
        const hasFullAccess = req.user.roles.includes('CFO') || req.user.roles.includes('General Manager');
        if (!hasPermission && !hasFullAccess) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.authorize = authorize;
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!req.user.roles.includes(requiredRole) && !req.user.roles.includes('General Manager')) {
            return res.status(403).json({ error: `Role ${requiredRole} required` });
        }
        next();
    };
};
exports.requireRole = requireRole;
