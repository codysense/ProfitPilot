"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const auditLogger = (action, entity) => {
    return async (req, res, next) => {
        const originalSend = res.json;
        let responseData;
        res.json = function (data) {
            responseData = data;
            return originalSend.call(this, data);
        };
        const originalEnd = res.end;
        res.end = async function (chunk) {
            if (req.user && res.statusCode < 400) {
                try {
                    await prisma.auditLog.create({
                        data: {
                            userId: req.user.id,
                            action,
                            entity,
                            entityId: responseData?.id || req.params.id || 'unknown',
                            beforeJson: req.body || null,
                            afterJson: responseData || null,
                            ipAddress: req.ip
                        }
                    });
                }
                catch (error) {
                    console.error('Audit logging failed:', error);
                }
            }
            originalEnd.call(this, chunk);
        };
        next();
    };
};
exports.auditLogger = auditLogger;
