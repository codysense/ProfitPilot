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
                        let beforeJson = null;
                        let afterJson = null;
                        if (action === 'CREATE') {
                            afterJson = responseData || null;
                        }
                        else if (action === 'UPDATE') {
                            beforeJson = req.body || null; // what was sent for update
                            afterJson = responseData || null; // updated record
                        }
                        else if (action === 'DELETE') {
                            beforeJson = responseData || null; // deleted record (usually returned before delete)
                        }
                        await prisma.auditLog.create({
                            data: {
                                userId: req.user.id,
                                action,
                                entity,
                                entityId: responseData?.id || req.params.id || 'unknown',
                                beforeJson,
                                afterJson,
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
        };
        next();
    };
};
exports.auditLogger = auditLogger;
