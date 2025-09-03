import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

export const auditLogger = (action: string, entity: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.json;
    let responseData: any;

    res.json = function(data: any) {
      responseData = data;
      return originalSend.call(this, data);
    };

    const originalEnd = res.end;
    res.end = async function(chunk?: any) {
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
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      }
      
      originalEnd.call(this, chunk);
    };

    next();
  };
};