import { Request, Response } from 'express';
import {  PrismaClient,Prisma,MemoModule, MemoType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';
// import { Prisma } from '../../prisma/generated/client';

const prisma = new PrismaClient();
console.log('Prisma export member',Object.keys(Prisma).includes('MemoType')? Object.keys(Prisma):'Not found');
export class MemoController {


      
  // GET /api/v1/memos
  async listMemos(req: AuthRequest, res: Response) {
    try {
      const { customerId, vendorId, type, from, to } = req.query;

      const memos = await prisma.memo.findMany({
        where: {
          customerId: customerId ? String(customerId) : undefined,
          vendorId: vendorId ? String(vendorId) : undefined,
          memoType: type ? (type as MemoType) : undefined,
          createdAt: {
            gte: from ? new Date(String(from)) : undefined,
            lte: to ? new Date(String(to)) : undefined,
          },
        },
        include: {
          account: true,
          customer: true,
          vendor: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(memos);
    } catch (error) {
      console.error('List memos error:', error);
      res.status(400).json({ error: 'Failed to list memos' });
    }
  }

  // GET /api/v1/memos/:id
  async getMemos(req: AuthRequest, res: Response) {


    try {
      const { id } = req.params;

      const memo = await prisma.memo.findUnique({
        where: { id },
        include: {
          account: true,
          customer: true,
          vendor: true,
        },
      });

      if (!memo) {
        return res.status(404).json({ error: 'Memo not found' });
      }

      res.json(memo);
    } catch (error) {
      console.error('Get memo error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // PATCH /api/v1/memos/:id
  async updateMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { description, amount, accountId } = req.body;

      const memo = await prisma.memo.update({
        where: { id },
        data: {
          description,
          amount: amount ? new Decimal(amount) : undefined,
          accountId,
        },
      });

      res.json(memo);
    } catch (error) {
      console.error('Update memo error:', error);
      res.status(400).json({ error: 'Failed to update memo' });
    }
  }

  // POST /api/v1/memos/:id/post
  async postMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const memo = await prisma.memo.findUnique({ where: { id } });
      if (!memo) {
        return res.status(404).json({ error: 'Memo not found' });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Generate journal
        const journalCount = await tx.journal.count();
        const journalNo = `J${String(journalCount + 1).padStart(6, '0')}`;

        const journal = await tx.journal.create({
          data: {
            journalNo,
            date: new Date(),
            memo: memo.description ?? `Memo ${memo.id}`,
            postedBy: req.user!.id,
          },
        });

        // Debit/Credit logic same as before
        let debitAccountId: string;
        let creditAccountId: string;

        if (memo.memoType === 'CREDIT') {
          creditAccountId = memo.accountId;
          debitAccountId = memo.module === 'SALES'
            ? (await tx.chartOfAccount.findFirst({ where: { code: '1200' } }))!.id
            : (await tx.chartOfAccount.findFirst({ where: { code: '2000' } }))!.id;
        } else {
          debitAccountId = memo.accountId;
          creditAccountId = memo.module === 'SALES'
            ? (await tx.chartOfAccount.findFirst({ where: { code: '1200' } }))!.id
            : (await tx.chartOfAccount.findFirst({ where: { code: '2000' } }))!.id;
        }

        await tx.journalLine.createMany({
          data: [
            {
              journalId: journal.id,
              accountId: debitAccountId,
              debit: memo.amount,
              credit: new Decimal(0),
              refType: 'MEMO',
              refId: memo.id,
            },
            {
              journalId: journal.id,
              accountId: creditAccountId,
              debit: new Decimal(0),
              credit: memo.amount,
              refType: 'MEMO',
              refId: memo.id,
            },
          ],
        });

        return tx.memo.update({
          where: { id: memo.id },
          data: { /* could add status: 'POSTED' later */ },
        });
      }
      ,
    {
  maxWait: 5000,  // 5s wait for connection
  timeout: 20000  // 20s max runtime
}
    );

      res.json(result);
    } catch (error) {
      console.error('Post memo error:', error);
      res.status(400).json({ error: 'Failed to post memo' });
    }
  }

  // DELETE /api/v1/memos/:id
  async deleteMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Add business rules check here before delete
      await prisma.memo.delete({ where: { id } });

      res.status(204).send();
    } catch (error) {
      console.error('Delete memo error:', error);
      res.status(400).json({ error: 'Failed to delete memo' });
    }
  }

 async createMemo(req: AuthRequest, res: Response) {
    try {
      const {
        module,      // "SALES" | "PURCHASES"
        memoType,    // "CREDIT" | "DEBIT"
        amount,
        description,
        accountId,   // chosen GL account
        customerId,
        vendorId,

      } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        // Generate memo number
        const count = await tx.memo.count();
        const memoNo = `M${String(count + 1).padStart(6, '0')}`;

        // Create Memo record
        // const memo = await tx.memo.create({
        //   data: {
        //     module,
        //     memoType,
        //     amount: new Decimal(amount),
        //     description,
        //     accountId,
        //     customerId: customerId ?? null,
        //     vendorId: vendorId ?? null,
        //     createdBy: req.user!.id
        //   }
        // });

        const memo = await tx.memo.create({
          data: {
            module: module as MemoModule,      // cast to enum
            memoType: memoType as MemoType, 
            amount: new Decimal(amount),
            description,
            //customerId: customerId || null,
            // vendorId: vendorId || null,
            createdBy: req.user!.id,
            account: {
              connect: { id: accountId }
              },
            ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
            ...(vendorId ? { vendor: { connect: { id: vendorId } } } : {}),
          }
        });


        // Create Journal
        const journalCount = await tx.journal.count();
        const journalNo = `J${String(journalCount + 1).padStart(6, '0')}`;


        const journal = await tx.journal.create({
          data: {
            journalNo,
            date: new Date(),
            memo: description ?? `Memo ${memoNo}`,
            postedBy: req.user!.id
          }
        });

        // Auto-generate JournalLines
        // CREDIT MEMO: Credit chosen account, Debit "Accounts Receivable" (if sales) or "Accounts Payable" (if purchase)
        // DEBIT MEMO: Reverse
        let debitAccountId: string;
        let creditAccountId: string;

        if (memoType === 'CREDIT') {
          // Credit chosen GL, Debit customer/vendor control account
          creditAccountId = accountId;
          if (module === 'SALES') {
            debitAccountId = (await tx.chartOfAccount.findFirst({ where: { code: '1200' } }))!.id;
          } else {
            debitAccountId = (await tx.chartOfAccount.findFirst({ where: { code: '2000' } }))!.id;
          }
        } else {
          // Debit chosen GL, Credit customer/vendor control account
          debitAccountId = accountId;
          if (module === 'SALES') {
            creditAccountId = (await tx.chartOfAccount.findFirst({ where: { code: '1200' } }))!.id;
          } else {
            creditAccountId = (await tx.chartOfAccount.findFirst({ where: { code: '2000' } }))!.id;
          }
        }
        console.log('Debit Account',debitAccountId, 'Credit Account', creditAccountId)

        await tx.journalLine.createMany({
          data: [
            {
              journalId: journal.id,
              accountId: debitAccountId,
              debit: new Decimal(amount),
              credit: new Decimal(0),
              refType: 'MEMO',
              refId: memo.id
            },
            {
              journalId: journal.id,
              accountId: creditAccountId,
              debit: new Decimal(0),
              credit: new Decimal(amount),
              refType: 'MEMO',
              refId: memo.id
            }
          ]
        });

        return memo;
      }
      ,
    {
  maxWait: 5000,  // 5s wait for connection
  timeout: 20000  // 20s max runtime
}
    );

      res.status(201).json(result);
    } catch (error: any) {
  console.error('Create memo error details:', error.message, error.stack);
  res.status(400).json({ error: error.message });
}
  }

}
