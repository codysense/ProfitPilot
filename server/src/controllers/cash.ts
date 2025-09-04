import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class CashController {
  // Get all cash accounts
  async getCashAccounts(req: AuthRequest, res: Response) {
    try {
      const accounts = await prisma.cashAccount.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' }
      });

      res.json({ accounts });
    } catch (error) {
      console.error('Get cash accounts error:', error);
      res.status(500).json({ error: 'Failed to fetch cash accounts' });
    }
  }

  // Create new cash account
  async createCashAccount(req: AuthRequest, res: Response) {
    try {
      const account = await prisma.cashAccount.create({
        data: req.body
      });

      res.status(201).json(account);
    } catch (error) {
      console.error('Create cash account error:', error);
      res.status(400).json({ error: 'Failed to create cash account' });
    }
  }

  // Update cash account
  async updateCashAccount(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const account = await prisma.cashAccount.update({
        where: { id },
        data: req.body
      });

      res.json(account);
    } catch (error) {
      console.error('Update cash account error:', error);
      res.status(400).json({ error: 'Failed to update cash account' });
    }
  }

  // Delete cash account
  async deleteCashAccount(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if account has transactions
      const transactionCount = await prisma.cashTransaction.count({
        where: { cashAccountId: id }
      });

      if (transactionCount > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete cash account with existing transactions' 
        });
      }

      await prisma.cashAccount.delete({
        where: { id }
      });

      res.json({ message: 'Cash account deleted successfully' });
    } catch (error) {
      console.error('Delete cash account error:', error);
      res.status(400).json({ error: 'Failed to delete cash account' });
    }
  }

  // Get cash transactions
  async getCashTransactions(req: AuthRequest, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        cashAccountId,
        transactionType,
        dateFrom,
        dateTo
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (cashAccountId) where.cashAccountId = cashAccountId;
      if (transactionType) where.transactionType = transactionType;
      if (dateFrom || dateTo) {
        where.transactionDate = {};
        if (dateFrom) where.transactionDate.gte = new Date(dateFrom as string);
        if (dateTo) where.transactionDate.lte = new Date(dateTo as string);
      }

      const [transactions, total] = await Promise.all([
        prisma.cashTransaction.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            cashAccount: true,
            glAccount: true,
            contraAccount: true,
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { transactionDate: 'desc' }
        }),
        prisma.cashTransaction.count({ where })
      ]);

      res.json({
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get cash transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch cash transactions' });
    }
  }

  // Create general cash transaction
  async createCashTransaction(req: AuthRequest, res: Response) {
    try {
      const {
        cashAccountId,
        glAccountId,
        contraAccountId,
        transactionType,
        amount,
        description,
        transactionDate,
        reference
      } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        // Generate transaction number
        const count = await tx.cashTransaction.count();
        const transactionNo = `CT${String(count + 1).padStart(6, '0')}`;

        // Create cash transaction
        const cashTransaction = await tx.cashTransaction.create({
          data: {
            transactionNo,
            cashAccountId,
            glAccountId,
            contraAccountId: contraAccountId?? null,
            transactionType,
            amount: new Decimal(amount),
            description,
            transactionDate: new Date(transactionDate),
            reference,
            refType: 'OTHER',
            refId: null,
            userId: req.user!.id
          }
        });
        

        const balanceChange = transactionType === 'RECEIPT' ? amount : -amount;
        await tx.cashAccount.update({
          where: { id: cashAccountId },
          data: {
            balance: {
              increment: balanceChange
            }
          }
        });

        // Create journal entries for double-entry bookkeeping
        const journalCount = await tx.journal.count();
        const journalNo = `J${String(journalCount + 1).padStart(6, '0')}`;

        const journal = await tx.journal.create({
          data: {
            journalNo,
            date: new Date(transactionDate),
            memo: description,
            postedBy: req.user!.id
          }
        });
        // console.log("Journal ", journal)
        // Get cash account's GL account
        const cashAccount = await tx.cashAccount.findUnique({
          where: { id: cashAccountId }
        });

        // console.log("CashAcount", cashAccount)

        if (transactionType === 'RECEIPT') {
          // Debit Cash Account, Credit GL Account
          await tx.journalLine.createMany({
            data: [
              {
                journalId: journal.id,
                accountId:  cashAccount!.glAccountId!,
                debit: new Decimal(amount),
                credit: new Decimal(0),
                refType: 'CASH_TRANSACTION',
                refId: cashTransaction.id
              },
              {
                journalId: journal.id,
                accountId: glAccountId,
                debit: new Decimal(0),
                credit: new Decimal(amount),
                refType: 'CASH_TRANSACTION',
                refId: cashTransaction.id
              }
            ]
          });
        } else {
          // Credit Cash Account, Debit GL Account
          await tx.journalLine.createMany({
            data: [
              {
                journalId: journal.id,
                accountId: glAccountId,
                debit: new Decimal(amount),
                credit: new Decimal(0),
                refType: 'CASH_TRANSACTION',
                refId: cashTransaction.id
              },
              {
                journalId: journal.id,
                accountId: cashAccount!.glAccountId!,
                debit: new Decimal(0),
                credit: new Decimal(amount),
                refType: 'CASH_TRANSACTION',
                refId: cashTransaction.id
              }
            ]
          });
        }

        return cashTransaction;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Create cash transaction error:', error);
      res.status(400).json({ error: 'Failed to create cash transaction' });
    }
  }

  // Create customer payment (Sales Receipt)
  async createCustomerPayment(req: AuthRequest, res: Response) {
    try {
      const {
        customerId,
        cashAccountId,
        amount,
        paymentDate,
        reference,
        notes,
        saleId
      } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        // Generate receipt number
        const count = await tx.salesReceipt.count();
        const receiptNo = `SR${String(count + 1).padStart(6, '0')}`;

        // Create sales receipt
        const receipt = await tx.salesReceipt.create({
          data: {
            receiptNo,
            saleId,
            customerId,
            cashAccountId,
            amountReceived: new Decimal(amount),
            receiptDate: new Date(paymentDate),
            notes,
            reference,
            userId: req.user!.id
          }
        });

        // Check if sale is fully paid and update status
        if (saleId) {
          const sale = await tx.sale.findUnique({
            where: { id: saleId },
            include: { salesReceipts: true }
          });

          if (sale) {
            const totalReceived = sale.salesReceipts.reduce((sum, r) => sum + Number(r.amountReceived), 0) + amount;
            
            if (totalReceived >= Number(sale.totalAmount)) {
              await tx.sale.update({
                where: { id: saleId },
                data: { status: 'PAID' }
              });
            }
          }
        }

        // Create corresponding cash transaction
        const cashTransactionCount = await tx.cashTransaction.count();
        const transactionNo = `CT${String(cashTransactionCount + 1).padStart(6, '0')}`;

        // Get Trade Receivables account
        const tradeReceivablesAccount = await tx.chartOfAccount.findFirst({
          where: { accountType: 'TRADE_RECEIVABLES' }
        });

        if (!tradeReceivablesAccount) {
          throw new Error('Trade Receivables account not found. Please create one first.');
        }

        await tx.cashTransaction.create({
          data: {
            transactionNo,
            cashAccountId,
            glAccountId: tradeReceivablesAccount.id,
            transactionType: 'RECEIPT',
            amount: new Decimal(amount),
            description: `Customer payment from ${await tx.customer.findUnique({ where: { id: customerId }, select: { name: true } }).then(c => c?.name)}${saleId ? ` - ${await tx.sale.findUnique({ where: { id: saleId }, select: { orderNo: true } }).then(s => s?.orderNo)}` : ''}`,
            transactionDate: new Date(paymentDate),
            reference,
            refType: 'SALES_RECEIPT',
            refId: receipt.id,
            userId: req.user!.id
          }
        });

        // Update cash account balance
        await tx.cashAccount.update({
          where: { id: cashAccountId },
          data: {
            balance: {
              increment: amount
            }
          }
        });

        // Create journal entries
        const journalCount = await tx.journal.count();
        const journalNo = `J${String(journalCount + 1).padStart(6, '0')}`;

        const journal = await tx.journal.create({
          data: {
            journalNo,
            date: new Date(paymentDate),
            memo: `Customer payment: ${reference || receiptNo}`,
            postedBy: req.user!.id
          }
        });

        // Get cash account's GL account
        const cashAccount = await tx.cashAccount.findUnique({
          where: { id: cashAccountId },
          select: { glAccountId: true }
        });

        if (!cashAccount) {
          throw new Error('Cash account not found');
        }

        if (!cashAccount.glAccountId) {
          throw new Error('Cash account does not have a linked GL account');
        }

        // Debit Cash, Credit Trade Receivables
        await tx.journalLine.createMany({
          data: [
            {
              journalId: journal.id,
              accountId: cashAccount.glAccountId,
              debit: new Decimal(amount),
              credit: new Decimal(0),
              refType: 'CUSTOMER_PAYMENT',
              refId: receipt.id
            },
            {
              journalId: journal.id,
              accountId: tradeReceivablesAccount.id,
              debit: new Decimal(0),
              credit: new Decimal(amount),
              refType: 'CUSTOMER_PAYMENT',
              refId: receipt.id
            }
          ]
        });

        return receipt;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Create customer payment error:', error);
      res.status(400).json({ error: 'Failed to create customer payment' });
    }
  }

  // Create vendor payment (Purchase Payment)
  async createVendorPayment(req: AuthRequest, res: Response) {
    try {
      const {
        vendorId,
        cashAccountId,
        amount,
        paymentDate,
        reference,
        notes,
        purchaseId
      } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        // Generate payment number
        const count = await tx.purchasePayment.count();
        const paymentNo = `PP${String(count + 1).padStart(6, '0')}`;

        // Create purchase payment
        const payment = await tx.purchasePayment.create({
          data: {
            paymentNo,
            purchaseId,
            vendorId,
            cashAccountId,
            amountPaid: new Decimal(amount),
            paymentDate: new Date(paymentDate),
            notes,
            reference,
            userId: req.user!.id
          }
        });

        // Check if purchase is fully paid and update status
        if (purchaseId) {
          const purchase = await tx.purchase.findUnique({
            where: { id: purchaseId },
            include: { purchasePayments: true }
          });

          if (purchase) {
            const totalPaid = purchase.purchasePayments.reduce((sum, p) => sum + Number(p.amountPaid), 0) + amount;
            
            if (totalPaid >= Number(purchase.totalAmount)) {
              await tx.purchase.update({
                where: { id: purchaseId },
                data: { status: 'PAID' }
              });
            }
          }
        }

        // Create corresponding cash transaction
        const cashTransactionCount = await tx.cashTransaction.count();
        const transactionNo = `CT${String(cashTransactionCount + 1).padStart(6, '0')}`;

        // Get Trade Payables account
        const tradePayablesAccount = await tx.chartOfAccount.findFirst({
          where: { 
            OR: [
              { accountType: 'TRADE_PAYABLES' },
              { code: '2000' }, // Fallback to Accounts Payable
              { name: { contains: 'Payable', mode: 'insensitive' } }
            ]
          }
        });

        if (!tradePayablesAccount) {
          throw new Error('No payables account found. Please create a Trade Payables or Accounts Payable account in Chart of Accounts first.');
        }

        await tx.cashTransaction.create({
          data: {
            transactionNo,
            cashAccountId,
            glAccountId: tradePayablesAccount.id,
            transactionType: 'PAYMENT',
            amount: new Decimal(amount),
            description: `Vendor payment to ${await tx.vendor.findUnique({ where: { id: vendorId }, select: { name: true } }).then(v => v?.name)}${purchaseId ? ` - ${await tx.purchase.findUnique({ where: { id: purchaseId }, select: { orderNo: true } }).then(p => p?.orderNo)}` : ''}`,
            transactionDate: new Date(paymentDate),
            reference,
            refType: 'PURCHASE_PAYMENT',
            refId: payment.id,
            userId: req.user!.id
          }
        });

        // Update cash account balance
        await tx.cashAccount.update({
          where: { id: cashAccountId },
          data: {
            balance: {
              decrement: amount
            }
          }
        });

        // Create journal entries
        const journalCount = await tx.journal.count();
        const journalNo = `J${String(journalCount + 1).padStart(6, '0')}`;

        const journal = await tx.journal.create({
          data: {
            journalNo,
            date: new Date(paymentDate),
            memo: `Vendor payment: ${paymentNo}`,
            postedBy: req.user!.id
          }
        });

        // Get cash account's GL account
        const cashAccount = await tx.cashAccount.findUnique({
          where: { id: cashAccountId },
          select: { glAccountId: true }
        });

        if (!cashAccount) {
          throw new Error('Cash account not found');
        }

        if (!cashAccount.glAccountId) {
          throw new Error('Cash account does not have a linked GL account');
        }

        // Debit Trade Payables, Credit Cash
        await tx.journalLine.createMany({
          data: [
            {
              journalId: journal.id,
              accountId: tradePayablesAccount.id,
              debit: new Decimal(amount),
              credit: new Decimal(0),
              refType: 'VENDOR_PAYMENT',
              refId: payment.id
            },
            {
              journalId: journal.id,
              accountId: cashAccount.glAccountId,
              debit: new Decimal(0),
              credit: new Decimal(amount),
              refType: 'VENDOR_PAYMENT',
              refId: payment.id
            }
          ]
        });

        return payment;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Create vendor payment error:', error);
      res.status(400).json({ error: 'Failed to create vendor payment' });
    }
  }

  // Get sales receipts
  async getSalesReceipts(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, customerId, cashAccountId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (customerId) where.customerId = customerId;
      if (cashAccountId) where.cashAccountId = cashAccountId;

      const [receipts, total] = await Promise.all([
        prisma.salesReceipt.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            sale: {
              select: { orderNo: true, totalAmount: true, status: true }
            },
            customer: {
              select: { code: true, name: true }
            },
            cashAccount: {
              select: { code: true, name: true, accountType: true }
            },
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.salesReceipt.count({ where })
      ]);

      res.json({
        receipts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get sales receipts error:', error);
      res.status(500).json({ error: 'Failed to fetch sales receipts' });
    }
  }

  // Get purchase payments
  async getPurchasePayments(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, vendorId, cashAccountId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (vendorId) where.vendorId = vendorId;
      if (cashAccountId) where.cashAccountId = cashAccountId;

      const [payments, total] = await Promise.all([
        prisma.purchasePayment.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            purchase: {
              select: { orderNo: true, totalAmount: true, status: true }
            },
            vendor: {
              select: { code: true, name: true }
            },
            cashAccount: {
              select: { code: true, name: true, accountType: true }
            },
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.purchasePayment.count({ where })
      ]);

      res.json({
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get purchase payments error:', error);
      res.status(500).json({ error: 'Failed to fetch purchase payments' });
    }
  }

  // Get cashbook with running balance
  async getCashbook(req: AuthRequest, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        cashAccountId,
        dateFrom,
        dateTo
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (cashAccountId) where.cashAccountId = cashAccountId;
      if (dateFrom || dateTo) {
        where.transactionDate = {};
        if (dateFrom) where.transactionDate.gte = new Date(dateFrom as string);
        if (dateTo) where.transactionDate.lte = new Date(dateTo as string);
      }

      // Get transactions for running balance calculation
      const allTransactions = await prisma.cashTransaction.findMany({
        where,
        include: {
          cashAccount: true,
          glAccount: true,
          contraAccount: true,
          user: {
            select: { name: true }
          }
        },
        orderBy: { transactionDate: 'asc' }
      });

      // Calculate running balances
      let runningBalance = 0;
      const transactionsWithBalance = allTransactions.map(transaction => {
        const amount = Number(transaction.amount);
        runningBalance += transaction.transactionType === 'RECEIPT' ? amount : -amount;
        
        return {
          ...transaction,
          runningBalance
        };
      });

      // Apply pagination to the result
      const total = transactionsWithBalance.length;
      const paginatedTransactions = transactionsWithBalance
        .reverse() // Show newest first
        .slice(skip, skip + Number(limit));

      res.json({
        transactions: paginatedTransactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get cashbook error:', error);
      res.status(500).json({ error: 'Failed to fetch cashbook' });
    }
  }

  // Bank reconciliation
  async getBankReconciliation(req: AuthRequest, res: Response) {
    try {
      const { cashAccountId, statementDate } = req.query;

      if (!cashAccountId || !statementDate) {
        return res.status(400).json({ error: 'Cash account and statement date are required' });
      }

      // Get all transactions up to statement date
      const transactions = await prisma.cashTransaction.findMany({
        where: {
          cashAccountId: cashAccountId as string,
          transactionDate: { lte: new Date(statementDate as string) }
        },
        include: {
          glAccount: true
        },
        orderBy: { transactionDate: 'asc' }
      });

      // Get unreconciled transactions
      const unreconciledTransactions = await prisma.cashTransaction.findMany({
        where: {
          cashAccountId: cashAccountId as string,
          isReconciled: false,
          transactionDate: { lte: new Date(statementDate as string) }
        },
        include: {
          glAccount: true
        },
        orderBy: { transactionDate: 'asc' }
      });

      // Calculate book balance
      const bookBalance = transactions.reduce((balance, transaction) => {
        return transaction.transactionType === 'RECEIPT' 
          ? balance + Number(transaction.amount)
          : balance - Number(transaction.amount);
      }, 0);

      res.json({
        transactions,
        unreconciledTransactions,
        bookBalance,
        statementDate
      });
    } catch (error) {
      console.error('Get bank reconciliation error:', error);
      res.status(500).json({ error: 'Failed to fetch bank reconciliation' });
    }
  }

  // Mark transactions as reconciled
  async reconcileTransactions(req: AuthRequest, res: Response) {
    try {
      const { transactionIds, statementBalance, reconciliationDate, cashAccountId } = req.body;

      await prisma.$transaction(async (tx) => {
        // Mark transactions as reconciled
        await tx.cashTransaction.updateMany({
          where: { id: { in: transactionIds } },
          data: { 
            isReconciled: true,
            reconciledAt: new Date(reconciliationDate)
          }
        });

        // Create reconciliation record
        await tx.bankReconciliation.create({
          data: {
            cashAccountId,
            statementDate: new Date(reconciliationDate),
            statementBalance: new Decimal(statementBalance),
            bookBalance: new Decimal(req.body.bookBalance),
            reconciledBy: req.user!.id
          }
        });
      });

      res.json({ message: 'Transactions reconciled successfully' });
    } catch (error) {
      console.error('Reconcile transactions error:', error);
      res.status(400).json({ error: 'Failed to reconcile transactions' });
    }
  }

  // Import bank statement from CSV
  async importBankStatement(req: AuthRequest, res: Response) {
    try {
      const { cashAccountId, csvData } = req.body;

      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ error: 'Invalid CSV data' });
      }

      const importedTransactions = [];

      await prisma.$transaction(async (tx) => {
        for (const row of csvData) {
          const {
            date,
            description,
            amount,
            type,
            reference
          } = row;

          // Skip if transaction already exists
          const existing = await tx.bankStatementLine.findFirst({
            where: {
              cashAccountId,
              statementDate: new Date(date),
              amount: new Decimal(Math.abs(amount)),
              description
            }
          });

          if (existing) continue;

          // Create bank statement line
          const statementLine = await tx.bankStatementLine.create({
            data: {
              cashAccountId,
              statementDate: new Date(date),
              description,
              amount: new Decimal(Math.abs(amount)),
              transactionType: amount > 0 ? 'RECEIPT' : 'PAYMENT',
              reference,
              isMatched: false
            }
          });

          importedTransactions.push(statementLine);
        }
      });

      res.json({
        message: `Imported ${importedTransactions.length} transactions`,
        importedCount: importedTransactions.length
      });
    } catch (error) {
      console.error('Import bank statement error:', error);
      res.status(400).json({ error: 'Failed to import bank statement' });
    }
  }

  // Export cashbook to CSV
  async exportCashbook(req: AuthRequest, res: Response) {
    try {
      const { cashAccountId, dateFrom, dateTo } = req.query;

      const where: any = {};
      if (cashAccountId) where.cashAccountId = cashAccountId;
      if (dateFrom || dateTo) {
        where.transactionDate = {};
        if (dateFrom) where.transactionDate.gte = new Date(dateFrom as string);
        if (dateTo) where.transactionDate.lte = new Date(dateTo as string);
      }

      const transactions = await prisma.cashTransaction.findMany({
        where,
        include: {
          cashAccount: true,
          glAccount: true,
          contraAccount: true,
          user: {
            select: { name: true }
          }
        },
        orderBy: { transactionDate: 'asc' }
      });

      // Generate CSV
      const headers = [
        'Date',
        'Transaction No',
        'Description',
        'Reference',
        'GL Account',
        'Contra Account',
        'Receipt',
        'Payment',
        'Running Balance',
        'User'
      ];

      let runningBalance = 0;
      const csvRows = transactions.map(transaction => {
        const amount = Number(transaction.amount);
        runningBalance += transaction.transactionType === 'RECEIPT' ? amount : -amount;
        
        return [
          new Date(transaction.transactionDate).toLocaleDateString(),
          transaction.transactionNo,
          transaction.description,
          transaction.reference || '',
          transaction.glAccount ? `${transaction.glAccount.code} - ${transaction.glAccount.name}` : '',
          transaction.contraAccount ? `${transaction.contraAccount.code} - ${transaction.contraAccount.name}` : '',
          transaction.transactionType === 'RECEIPT' ? amount.toString() : '',
          transaction.transactionType === 'PAYMENT' ? amount.toString() : '',
          runningBalance.toString(),
          transaction.user.name
        ];
      });

      const csvContent = [headers, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="cashbook-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('Export cashbook error:', error);
      res.status(500).json({ error: 'Failed to export cashbook' });
    }
  }

  // Create sales receipt (wrapper for createCustomerPayment)
  async createSalesReceipt(req: AuthRequest, res: Response) {
    try {
      const {
        saleId,
        customerId,
        cashAccountId,
        amountReceived,
        receiptDate,
        reference,
        notes
      } = req.body;

      const result = await this.createCustomerPayment({
        ...req,
        body: {
          customerId,
          cashAccountId,
          amount: amountReceived,
          paymentDate: receiptDate,
          reference,
          notes,
          saleId
        }
      }, res);

      return result;
    } catch (error) {
      console.error('Create sales receipt error:', error);
      res.status(400).json({ error: 'Failed to create sales receipt' });
    }
  }

  // Create purchase payment (wrapper for createVendorPayment)  
  async createPurchasePayment(req: AuthRequest, res: Response) {
    try {
      const {
        purchaseId,
        vendorId,
        cashAccountId,
        amountPaid,
        paymentDate,
        reference,
        notes
      } = req.body;

      const result = await this.createVendorPayment({
        ...req,
        body: {
          vendorId,
          cashAccountId,
          amount: amountPaid,
          paymentDate,
          reference,
          notes,
          purchaseId
        }
      }, res);

      return result;
    } catch (error) {
      console.error('Create purchase payment error:', error);
      res.status(400).json({ error: 'Failed to create purchase payment' });
    }
  }
}