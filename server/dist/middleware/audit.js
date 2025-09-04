"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const auditLogger = (action, entity) => {
    return (req, res, next) => {
        const originalJson = res.json;
        let responseData;
        res.json = function (data) {
            responseData = data;
            return originalJson.call(this, data);
        };
        const originalEnd = res.end;
        res.end = function (chunk, ...args) {
            if (req.user && res.statusCode < 400) {
                // run asynchronously, don't block response
                (async () => {
                    try {
                        await prisma.auditLog.create({
                            data: {
                                userId: req.user.id,
                                action,
                                entity,
                                entityId: responseData?.id || req.params.id || 'unknown',
                                beforeJson: req.body || null,
                                afterJson: responseData || null,
                                ipAddress: req.ip,
                            },
                        });
                    }
                    catch (error) {
                        console.error('Audit logging failed:', error);
                    }
                })();
            }
            return originalEnd.call(this, chunk, ...args);
        }; // cast to satisfy TS
        next();
    };
};
exports.auditLogger = auditLogger;
