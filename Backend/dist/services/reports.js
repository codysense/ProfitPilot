"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const prisma = new client_1.PrismaClient();
class ReportsService {
    // Financial Reports
    async getBalanceSheet(asOfDate) {
        // Get chart of accounts
        const chartAccounts = await prisma.chartOfAccount.findMany({
            where: {
                isActive: true,
                accountType: { in: ['CURRENT_ASSETS', 'NON_CURRENT_ASSETS', 'TRADE_RECEIVABLES', 'CURRENT_LIABILITY', 'NON_CURRENT_LIABILITY', 'TRADE_PAYABLES', 'EQUITY'] }
            },
            include: {
                journalLines: {
                    where: {
                        journal: {
                            date: { lte: asOfDate }
                        }
                    }
                }
            },
            orderBy: [{ accountType: 'asc' }, { code: 'asc' }]
        });
        // Get cash accounts separately
        const cashAccounts = await prisma.cashAccount.findMany({
            where: { isActive: true }
        });
        const assets = [];
        const liabilities = [];
        const equity = [];
        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;
        // Process chart of accounts
        chartAccounts.forEach(account => {
            const totalDebits = account.journalLines.reduce((sum, line) => sum.plus(line.debit), new library_1.Decimal(0));
            const totalCredits = account.journalLines.reduce((sum, line) => sum.plus(line.credit), new library_1.Decimal(0));
            const balance = ['CURRENT_ASSETS', 'NON_CURRENT_ASSETS', 'TRADE_RECEIVABLES'].includes(account.accountType)
                ? totalDebits.minus(totalCredits).toNumber()
                : totalCredits.minus(totalDebits).toNumber();
            const accountData = {
                accountCode: account.code,
                accountName: account.name,
                balance: Math.abs(balance)
            };
            if (['CURRENT_ASSETS', 'NON_CURRENT_ASSETS', 'TRADE_RECEIVABLES'].includes(account.accountType)) {
                assets.push(accountData);
                totalAssets += balance;
            }
            else if (['CURRENT_LIABILITY', 'NON_CURRENT_LIABILITY', 'TRADE_PAYABLES'].includes(account.accountType)) {
                liabilities.push(accountData);
                totalLiabilities += balance;
            }
            else if (account.accountType === 'EQUITY') {
                equity.push(accountData);
                totalEquity += balance;
            }
        });
        // Add cash accounts to assets
        let totalCashBalance = 0;
        cashAccounts.forEach(cashAccount => {
            const balance = Number(cashAccount.balance);
            assets.push({
                accountCode: cashAccount.code,
                accountName: `${cashAccount.name} (${cashAccount.accountType})`,
                balance: Math.abs(balance)
            });
            totalAssets += balance;
            totalCashBalance += balance;
        });
        return {
            asOfDate,
            assets,
            liabilities,
            equity,
            totalAssets,
            totalLiabilities,
            totalEquity,
            totalCashBalance
        };
    }
    /**
     * Generates a Profit and Loss report for a specified date range.
     *
     * Retrieves active chart of accounts of types 'INCOME', 'EXPENSES', 'OTHER_INCOME', and 'COST_OF_SALES',
     * along with their journal lines within the given date range. Calculates total revenues, expenses,
     * and net income based on account balances.
     *
     * @param fromDate - The start date of the reporting period.
     * @param toDate - The end date of the reporting period.
     * @returns An object containing:
     *   - fromDate: The start date of the report.
     *   - toDate: The end date of the report.
     *   - revenues: Array of revenue account details and amounts.
     *   - expenses: Array of expense account details and amounts.
     *   - totalRevenue: The total revenue amount.
     *   - totalExpense: The total expense amount.
     *   - netIncome: The calculated net income (totalRevenue - totalExpense).
     *
     * @throws Will propagate any errors from the database query.
     */
    async getProfitAndLoss(fromDate, toDate) {
        const accounts = await prisma.chartOfAccount.findMany({
            where: {
                isActive: true,
                accountType: { in: ['INCOME', 'EXPENSES', 'OTHER_INCOME', 'COST_OF_SALES'] }
            },
            include: {
                journalLines: {
                    where: {
                        journal: {
                            date: {
                                gte: fromDate,
                                lte: toDate
                            }
                        }
                    }
                }
            },
            orderBy: [{ accountType: 'asc' }, { code: 'asc' }]
        });
        const revenues = [];
        const expenses = [];
        const otherIncomes = [];
        const costOfSales = [];
        let totalRevenue = 0;
        let totalExpense = 0;
        let totalOtherIncome = 0;
        let totalCostOfSales = 0;
        accounts.forEach(account => {
            const totalDebits = account.journalLines.reduce((sum, line) => sum.plus(line.debit), new library_1.Decimal(0));
            const totalCredits = account.journalLines.reduce((sum, line) => sum.plus(line.credit), new library_1.Decimal(0));
            const netAmount = (account.accountType === 'INCOME' || account.accountType === 'OTHER_INCOME')
                ? totalCredits.minus(totalDebits).toNumber()
                : totalDebits.minus(totalCredits).toNumber();
            const accountData = {
                accountCode: account.code,
                accountName: account.name,
                amount: Math.abs(netAmount)
            };
            if (account.accountType === 'INCOME') {
                revenues.push(accountData);
                totalRevenue += netAmount;
            }
            else if (account.accountType === 'OTHER_INCOME') {
                otherIncomes.push(accountData);
                totalOtherIncome += netAmount;
            }
            else if (account.accountType === 'COST_OF_SALES') {
                costOfSales.push(accountData);
                totalCostOfSales += netAmount;
            }
            else if (account.accountType === 'EXPENSES') {
                expenses.push(accountData);
                totalExpense += netAmount;
            }
        });
        const grossProfit = totalRevenue - totalCostOfSales;
        const netIncome = grossProfit + totalOtherIncome - totalExpense;
        // console.log(otherIncomes)
        return {
            fromDate,
            toDate,
            revenues,
            totalRevenue,
            costOfSales,
            totalCostOfSales,
            grossProfit,
            otherIncomes,
            totalOtherIncome,
            expenses,
            totalExpense,
            netIncome
        };
    }
    //Vendor balances
    async getTrialBalance(asOfDate) {
        // Get chart of accounts
        const chartAccounts = await prisma.chartOfAccount.findMany({
            where: { isActive: true },
            include: {
                journalLines: {
                    where: {
                        journal: {
                            date: { lte: asOfDate }
                        }
                    }
                }
            },
            orderBy: { code: 'asc' }
        });
        // Get cash accounts
        const cashAccounts = await prisma.cashAccount.findMany({
            where: { isActive: true }
        });
        const trialBalanceData = [];
        // Process chart of accounts
        chartAccounts.forEach(account => {
            const totalDebits = account.journalLines.reduce((sum, line) => sum.plus(line.debit), new library_1.Decimal(0));
            const totalCredits = account.journalLines.reduce((sum, line) => sum.plus(line.credit), new library_1.Decimal(0));
            const balance = totalDebits.minus(totalCredits);
            trialBalanceData.push({
                accountCode: account.code,
                accountName: account.name,
                accountType: account.accountType,
                debits: totalDebits.toNumber(),
                credits: totalCredits.toNumber(),
                balance: balance.toNumber()
            });
        });
        // Add cash accounts to trial balance
        cashAccounts.forEach(cashAccount => {
            const balance = Number(cashAccount.balance);
            trialBalanceData.push({
                accountCode: cashAccount.code,
                accountName: `${cashAccount.name} (${cashAccount.accountType})`,
                accountType: 'CURRENT_ASSETS',
                debits: balance >= 0 ? balance : 0,
                credits: balance < 0 ? Math.abs(balance) : 0,
                balance: balance
            });
        });
        return trialBalanceData.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    }
    async getGeneralLedger(fromDate, toDate, accountId) {
        const where = {
            journal: {
                date: {
                    gte: fromDate,
                    lte: toDate
                }
            }
        };
        if (accountId) {
            where.accountId = accountId;
        }
        const journalLines = await prisma.journalLine.findMany({
            where,
            include: {
                journal: {
                    select: { journalNo: true, date: true, memo: true }
                },
                account: {
                    select: { code: true, name: true, accountType: true }
                }
            },
            orderBy: [{ journal: { date: 'asc' } }, { journal: { journalNo: 'asc' } }]
        });
        return journalLines.map(line => ({
            date: line.journal.date,
            journalNo: line.journal.journalNo,
            accountCode: line.account.code,
            accountName: line.account.name,
            accountType: line.account.accountType,
            memo: line.journal.memo,
            debit: line.debit.toNumber(),
            credit: line.credit.toNumber(),
            refType: line.refType,
            refId: line.refId
        }));
    }
    async getCustomerBalances(asOfDate) {
        const result = await prisma.$queryRawUnsafe(`
    SELECT 
        c.id AS customer_id,
        c.code AS customer_code,
        c.name AS customer_name,
        COALESCE(SUM(s."totalAmount"), 0) AS total_sales,
        COALESCE(SUM(sr."amountReceived"), 0) AS total_receipts,
        COALESCE(SUM(s."totalAmount"), 0) - COALESCE(SUM(sr."amountReceived"), 0) AS outstanding_balance
    FROM customers c
    LEFT JOIN sales s 
        ON s."customerId" = c.id 
       AND s."orderDate" <= $1
       AND s.status IN ('INVOICED','PAID')
    LEFT JOIN sales_receipts sr 
        ON sr."customerId" = c.id 
       AND date(sr."receiptDate") <= $1
    GROUP BY c.id, c.code, c.name
    ORDER BY c.name;
  `, asOfDate);
        return result;
    }
    async getCustomerLedger(fromDate, toDate, customerId) {
        //  Opening Balance before period
        const opening = await prisma.$queryRawUnsafe(`
    SELECT COALESCE(SUM(x.balance), 0) as balance
    FROM (
      SELECT s."totalAmount" as balance
      FROM sales s
      WHERE s."customerId" = $1
        AND s."orderDate" <= $2
        AND s."status" != 'DRAFT'

      UNION ALL

      SELECT -sr."amountReceived" as balance
      FROM sales_receipts sr
      WHERE sr."customerId" = $1
        AND sr."receiptDate" <= $2
    ) x
    `, customerId, fromDate);
        const openingBalance = Number(opening[0].balance || 0);
        // 🔹 Ledger entries in period
        const entries = await prisma.$queryRawUnsafe(`
    SELECT 
      'CUSTOMER' as type,
      c."code" as account_code,
      c."name" as account_name,
      'SALE' as transaction_type,
      s."orderNo" as reference,
      s."orderDate" as date,
      s."totalAmount" as debit,
      0 as credit,
      s."totalAmount" as balance,
      'Sales Invoice' as description
    FROM "sales" s
    INNER JOIN "customers" c ON s."customerId" = c."id"
    WHERE c."id" = $1
      AND s."orderDate" BETWEEN $2 AND $3
      AND s."status" != 'DRAFT'

    UNION ALL

    SELECT 
      'CUSTOMER' as type,
      c."code" as account_code,
      c."name" as account_name,
      'RECEIPT' as transaction_type,
      sr."receiptNo" as reference,
      sr."receiptDate" as date,
      0 as debit,
      sr."amountReceived" as credit,
      sr."amountReceived" as balance,
      CONCAT('Payment received  ', COALESCE(sr."reference", '')) as description 
    FROM sales_receipts sr
    INNER JOIN "customers" c ON sr."customerId" = c."id"
    WHERE c."id" =$1
      AND sr."receiptDate" BETWEEN $2 AND $3

    ORDER BY date, reference
    `, customerId, fromDate, toDate);
        // 🔹 Totals
        const totalSales = entries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
        const totalPayments = entries.reduce((sum, e) => sum + Number(e.credit || 0), 0);
        const closingBalance = openingBalance + totalSales - totalPayments;
        return {
            openingBalance,
            entries,
            totals: {
                totalSales,
                totalPayments,
                closingBalance,
            },
        };
    }
    async getVendorLedger(fromDate, toDate, vendorId) {
        // 🔹 Opening Balance before period
        const opening = await prisma.$queryRawUnsafe(`
    SELECT COALESCE(SUM(x.balance), 0) as balance
    FROM (
      SELECT p."totalAmount" as balance
      FROM purchases p
      WHERE p."vendorId" = $1
        AND p."orderDate" < $2
        AND p."status" != 'DRAFT'

      UNION ALL

      SELECT -pp."amountPaid" as balance
      FROM purchase_payments pp
      WHERE pp."vendorId" = $1
        AND pp."paymentDate" < $2
    ) x
    `, vendorId, fromDate);
        const openingBalance = Number(opening[0]?.balance || 0);
        // 🔹 Ledger entries in period
        const entries = await prisma.$queryRawUnsafe(`
    SELECT 
      'VENDOR' as type,
      v."code" as account_code,
      v."name" as account_name,
      'PURCHASE' as transaction_type,
      p."orderNo" as reference,
      p."orderDate" as date,
      0 as debit,
      p."totalAmount" as credit,
      p."totalAmount" as balance,
      'Purchase Invoice' as description
    FROM purchases p
    INNER JOIN "vendors" v ON p."vendorId" = v."id"
    WHERE v."id" = $1
      AND p."orderDate" between $2 AND $3
      AND p."status" != 'DRAFT'

    UNION ALL

    SELECT 
      'VENDOR' as type,
      v."code" as account_code,
      v."name" as account_name,
      'PAYMENT' as transaction_type,
      pp."paymentNo" as reference,
      pp."paymentDate" as date,
      pp."amountPaid" as debit,
      0 as credit,
      -pp."amountPaid" as balance,
      CONCAT('Payment made  ', COALESCE(pp."reference", '')) as description
    FROM purchase_payments pp
    INNER JOIN "vendors" v ON pp."vendorId" = v."id"
    WHERE v."id" = $1
      AND pp."paymentDate" BETWEEN $2 AND $3

    ORDER BY date, reference
    `, vendorId, fromDate, toDate);
        // 🔹 Totals
        const totalPurchases = entries.reduce((sum, e) => sum + Number(e.credit || 0), 0);
        const totalPayments = entries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
        const closingBalance = openingBalance + totalPurchases - totalPayments;
        return {
            openingBalance,
            entries,
            totals: {
                totalPurchases,
                totalPayments,
                closingBalance,
            },
        };
    }
    async getVendorBalances(asOfDate) {
        const result = await prisma.$queryRawUnsafe(`
    SELECT 
        v.id AS vendor_id,
        v.code AS vendor_code,
        v.name AS vendor_name,
        COALESCE(SUM(p."totalAmount"), 0) AS total_purchases,
        COALESCE(SUM(pp."amountPaid"), 0) AS total_payments,
        COALESCE(SUM(p."totalAmount"), 0) - COALESCE(SUM(pp."amountPaid"), 0) AS outstanding_balance
    FROM vendors v
    LEFT JOIN purchases p 
        ON p."vendorId" = v.id 
       AND p."orderDate" <= $1
       AND p.status IN ('INVOICED','PAID')
    LEFT JOIN purchase_payments pp 
        ON pp."vendorId" = v.id 
       AND date(pp."paymentDate") <= $1
    GROUP BY v.id, v.code, v.name
    ORDER BY v.name;
  `, asOfDate);
        return result;
    }
    async getCashFlow(fromDate, toDate) {
        // Get cash account transactions
        const cashTransactions = await prisma.cashTransaction.findMany({
            where: {
                transactionDate: {
                    gte: fromDate,
                    lte: toDate
                }
            },
            include: {
                cashAccount: {
                    select: { name: true, accountType: true }
                }
            },
            orderBy: { transactionDate: 'asc' }
        });
        // Categorize cash flows
        const operatingActivities = [];
        const investingActivities = [];
        const financingActivities = [];
        let operatingCashFlow = 0;
        let investingCashFlow = 0;
        let financingCashFlow = 0;
        cashTransactions.forEach(transaction => {
            const amount = transaction.transactionType === 'RECEIPT'
                ? transaction.amount.toNumber()
                : -transaction.amount.toNumber();
            // Categorize based on description or reference type
            if (transaction.refType === 'SALES_RECEIPT' || transaction.description.toLowerCase().includes('sales')) {
                operatingActivities.push({
                    description: transaction.description,
                    amount,
                    date: transaction.transactionDate
                });
                operatingCashFlow += amount;
            }
            else if (transaction.refType === 'PURCHASE_PAYMENT' || transaction.description.toLowerCase().includes('purchase')) {
                operatingActivities.push({
                    description: transaction.description,
                    amount,
                    date: transaction.transactionDate
                });
                operatingCashFlow += amount;
            }
            else {
                // Default to operating for now
                operatingActivities.push({
                    description: transaction.description,
                    amount,
                    date: transaction.transactionDate
                });
                operatingCashFlow += amount;
            }
        });
        const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
        return {
            fromDate,
            toDate,
            operatingActivities,
            investingActivities,
            financingActivities,
            operatingCashFlow,
            investingCashFlow,
            financingCashFlow,
            netCashFlow
        };
    }
    // Operational Reports
    async getProductionSummary(fromDate, toDate) {
        const result = await prisma.productionOrder.groupBy({
            by: ['itemId'],
            where: {
                status: 'FINISHED',
                finishedAt: {
                    gte: fromDate,
                    lte: toDate
                }
            },
            _sum: {
                qtyProduced: true
            }
        });
        // Then join with items to get names
        const resultWithNames = await Promise.all(result.map(async (group, index) => {
            const item = await prisma.item.findUnique({
                where: { id: group.itemId },
                select: { name: true }
            });
            return {
                no: index + 1,
                name: item?.name,
                CumProduction: group._sum.qtyProduced
            };
        }));
        return resultWithNames;
    }
    // Production Report
    async getProductionReport(fromDate, toDate) {
        const orders = await prisma.productionOrder.findMany({
            where: {
                status: 'FINISHED',
                finishedAt: {
                    gte: fromDate,
                    lte: toDate
                }
            },
            include: {
                item: {
                    select: { name: true }
                }
            },
            orderBy: [
                { finishedAt: 'asc' },
                { item: { name: 'asc' } }
            ]
        });
        return orders.map((order, index) => ({
            no: index + 1,
            ProductionDate: order.finishedAt ? order.finishedAt.toISOString().split('T')[0] : '',
            name: order.item?.name ?? '',
            qtyProduced: order.qtyProduced
        }));
    }
    async getMaterialUsage(fromDate, toDate) {
        const results = await prisma.inventoryLedger.findMany({
            where: {
                direction: "OUT",
                refType: "PRODUCTION",
                postedAt: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            include: {
                item: {
                    select: { name: true },
                },
            },
            orderBy: [
                { postedAt: "asc" },
                { item: { name: "asc" } },
            ],
            take: 100,
        });
        // format output to match your SQL result
        return results.map((r, ind) => ({
            no: ind + 1,
            PostedDate: r.postedAt.toISOString().split("T")[0], // like SQL DATE()
            name: r.item.name,
            refType: r.refType,
            qty: r.qty,
        }));
    }
    async getInventoryAging(asOfDate, warehouseId) {
        const where = {
            postedAt: { lte: asOfDate }
        };
        if (warehouseId)
            where.warehouseId = warehouseId;
        const ledgerEntries = await prisma.inventoryLedger.findMany({
            where,
            include: {
                item: {
                    select: { sku: true, name: true, type: true }
                },
                warehouse: {
                    select: { code: true, name: true }
                }
            },
            orderBy: { postedAt: 'asc' }
        });
        // Group by item and calculate aging
        const agingMap = new Map();
        const currentDate = new Date(asOfDate);
        ledgerEntries.forEach(entry => {
            const key = `${entry.itemId}-${entry.warehouseId}`;
            if (!agingMap.has(key)) {
                agingMap.set(key, {
                    item: entry.item,
                    warehouse: entry.warehouse,
                    qty: 0,
                    value: 0,
                    avgAge: 0,
                    batches: []
                });
            }
            const aging = agingMap.get(key);
            if (entry.direction === 'IN') {
                const daysSinceReceived = Math.floor((currentDate.getTime() - entry.postedAt.getTime()) / (1000 * 60 * 60 * 24));
                aging.batches.push({
                    qty: entry.qty.toNumber(),
                    value: entry.value.toNumber(),
                    age: daysSinceReceived,
                    receivedDate: entry.postedAt
                });
            }
        });
        // Calculate aging buckets
        const agingReport = Array.from(agingMap.values()).map(item => {
            const totalQty = item.batches.reduce((sum, batch) => sum + batch.qty, 0);
            const totalValue = item.batches.reduce((sum, batch) => sum + batch.value, 0);
            const aging0to30 = item.batches.filter((b) => b.age <= 30).reduce((sum, b) => sum + b.value, 0);
            const aging31to60 = item.batches.filter((b) => b.age > 30 && b.age <= 60).reduce((sum, b) => sum + b.value, 0);
            const aging61to90 = item.batches.filter((b) => b.age > 60 && b.age <= 90).reduce((sum, b) => sum + b.value, 0);
            const agingOver90 = item.batches.filter((b) => b.age > 90).reduce((sum, b) => sum + b.value, 0);
            return {
                item: item.item,
                warehouse: item.warehouse,
                totalQty,
                totalValue,
                aging0to30,
                aging31to60,
                aging61to90,
                agingOver90
            };
        });
        return agingReport;
    }
    async getStockCard(itemId, warehouseId, fromDate, toDate) {
        const where = { itemId };
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (fromDate || toDate) {
            where.postedAt = {};
            if (fromDate)
                where.postedAt.gte = fromDate;
            if (toDate)
                where.postedAt.lte = toDate;
        }
        const entries = await prisma.inventoryLedger.findMany({
            where,
            include: {
                item: {
                    select: { sku: true, name: true, uom: true }
                },
                warehouse: {
                    select: { code: true, name: true }
                },
                user: {
                    select: { name: true }
                }
            },
            orderBy: { postedAt: 'asc' }
        });
        return entries.map(entry => ({
            date: entry.postedAt,
            refType: entry.refType,
            refId: entry.refId,
            direction: entry.direction,
            qty: entry.qty.toNumber(),
            unitCost: entry.unitCost.toNumber(),
            value: entry.value.toNumber(),
            runningQty: entry.runningQty.toNumber(),
            runningValue: entry.runningValue.toNumber(),
            runningAvgCost: entry.runningAvgCost.toNumber(),
            user: entry.user?.name || 'System'
        }));
    }
    async getProductionVariance(fromDate, toDate) {
        const productionOrders = await prisma.productionOrder.findMany({
            where: {
                createdAt: {
                    gte: fromDate,
                    lte: toDate
                },
                status: { in: ['FINISHED', 'CLOSED'] }
            },
            include: {
                item: {
                    select: { sku: true, name: true, standardCost: true }
                },
                bom: {
                    include: {
                        bomLines: {
                            include: {
                                componentItem: {
                                    select: { sku: true, name: true, standardCost: true }
                                }
                            }
                        }
                    }
                },
                wipLedger: true
            }
        });
        const varianceReport = productionOrders.map(order => {
            // Calculate standard cost
            let standardMaterialCost = 0;
            if (order.bom) {
                standardMaterialCost = order.bom.bomLines.reduce((sum, line) => {
                    const componentCost = line.componentItem.standardCost?.toNumber() || 0;
                    return sum + (line.qtyPer.toNumber() * componentCost * order.qtyProduced.toNumber());
                }, 0);
            }
            // Calculate actual costs
            const actualMaterialCost = order.wipLedger
                .filter(w => w.type === 'ISSUE')
                .reduce((sum, w) => sum + w.amount.toNumber(), 0);
            const actualLaborCost = order.wipLedger
                .filter(w => w.type === 'LABOR')
                .reduce((sum, w) => sum + w.amount.toNumber(), 0);
            const actualOverheadCost = order.wipLedger
                .filter(w => w.type === 'OVERHEAD')
                .reduce((sum, w) => sum + w.amount.toNumber(), 0);
            const totalActualCost = actualMaterialCost + actualLaborCost + actualOverheadCost;
            const totalStandardCost = standardMaterialCost; // Add standard labor and overhead if available
            return {
                orderNo: order.orderNo,
                item: order.item,
                qtyProduced: order.qtyProduced.toNumber(),
                standardMaterialCost,
                actualMaterialCost,
                materialVariance: actualMaterialCost - standardMaterialCost,
                actualLaborCost,
                actualOverheadCost,
                totalActualCost,
                totalStandardCost,
                totalVariance: totalActualCost - totalStandardCost
            };
        });
        return varianceReport;
    }
    async getSalesByItem(fromDate, toDate) {
        const sales = await prisma.sale.findMany({
            where: {
                orderDate: {
                    gte: fromDate,
                    lte: toDate
                },
                status: { in: ['DELIVERED', 'INVOICED', 'PAID'] }
            },
            include: {
                saleLines: {
                    include: {
                        item: {
                            select: { sku: true, name: true, type: true }
                        }
                    }
                }
            }
        });
        const itemSalesMap = new Map();
        sales.forEach(sale => {
            sale.saleLines.forEach(line => {
                const key = line.itemId;
                if (!itemSalesMap.has(key)) {
                    itemSalesMap.set(key, {
                        item: line.item,
                        totalQty: 0,
                        totalValue: 0,
                        orderCount: 0
                    });
                }
                const itemSales = itemSalesMap.get(key);
                itemSales.totalQty += line.qty.toNumber();
                itemSales.totalValue += line.lineTotal.toNumber();
                itemSales.orderCount += 1;
            });
        });
        return Array.from(itemSalesMap.values()).sort((a, b) => b.totalValue - a.totalValue);
    }
    async getSalesByCustomer(fromDate, toDate) {
        const sales = await prisma.sale.findMany({
            where: {
                orderDate: {
                    gte: fromDate,
                    lte: toDate
                },
                status: { in: ['DELIVERED', 'INVOICED', 'PAID'] }
            },
            include: {
                customer: {
                    select: { code: true, name: true }
                }
            }
        });
        const customerSalesMap = new Map();
        sales.forEach(sale => {
            const key = sale.customerId;
            if (!customerSalesMap.has(key)) {
                customerSalesMap.set(key, {
                    customer: sale.customer,
                    totalValue: 0,
                    orderCount: 0,
                    avgOrderValue: 0
                });
            }
            const customerSales = customerSalesMap.get(key);
            customerSales.totalValue += sale.totalAmount.toNumber();
            customerSales.orderCount += 1;
            customerSales.avgOrderValue = customerSales.totalValue / customerSales.orderCount;
        });
        return Array.from(customerSalesMap.values()).sort((a, b) => b.totalValue - a.totalValue);
    }
    async getPurchasesByVendor(fromDate, toDate) {
        const purchases = await prisma.purchase.findMany({
            where: {
                orderDate: {
                    gte: fromDate,
                    lte: toDate
                },
                status: { in: ['RECEIVED', 'INVOICED', 'PAID'] }
            },
            include: {
                vendor: {
                    select: { code: true, name: true }
                }
            }
        });
        const vendorPurchasesMap = new Map();
        purchases.forEach(purchase => {
            const key = purchase.vendorId;
            if (!vendorPurchasesMap.has(key)) {
                vendorPurchasesMap.set(key, {
                    vendor: purchase.vendor,
                    totalValue: 0,
                    orderCount: 0,
                    avgOrderValue: 0
                });
            }
            const vendorPurchases = vendorPurchasesMap.get(key);
            vendorPurchases.totalValue += purchase.totalAmount.toNumber();
            vendorPurchases.orderCount += 1;
            vendorPurchases.avgOrderValue = vendorPurchases.totalValue / vendorPurchases.orderCount;
        });
        return Array.from(vendorPurchasesMap.values()).sort((a, b) => b.totalValue - a.totalValue);
    }
    async getArApAging(asOfDate, type) {
        if (type === 'AR') {
            // Accounts Receivable Aging
            const invoicedSales = await prisma.sale.findMany({
                where: {
                    status: { in: ['INVOICED'] },
                    orderDate: { lte: asOfDate }
                },
                include: {
                    customer: {
                        select: { code: true, name: true }
                    },
                    salesReceipts: {
                        select: { amountReceived: true }
                    }
                }
            });
            return invoicedSales.map(sale => {
                const totalReceived = sale.salesReceipts.reduce((sum, receipt) => sum + receipt.amountReceived.toNumber(), 0);
                const outstandingAmount = sale.totalAmount.toNumber() - totalReceived;
                const daysPastDue = Math.floor((asOfDate.getTime() - sale.orderDate.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    customer: sale.customer,
                    orderNo: sale.orderNo,
                    orderDate: sale.orderDate,
                    totalAmount: sale.totalAmount.toNumber(),
                    amountReceived: totalReceived,
                    outstandingAmount,
                    daysPastDue,
                    agingBucket: daysPastDue <= 30 ? 'Current' :
                        daysPastDue <= 60 ? '31-60 Days' :
                            daysPastDue <= 90 ? '61-90 Days' : 'Over 90 Days'
                };
            }).filter(item => item.outstandingAmount > 0);
        }
        else {
            // Accounts Payable Aging
            const invoicedPurchases = await prisma.purchase.findMany({
                where: {
                    status: { in: ['INVOICED'] },
                    orderDate: { lte: asOfDate }
                },
                include: {
                    vendor: {
                        select: { code: true, name: true, paymentTerms: true }
                    },
                    purchasePayments: {
                        select: { amountPaid: true }
                    }
                }
            });
            return invoicedPurchases.map(purchase => {
                const totalPaid = purchase.purchasePayments.reduce((sum, payment) => sum + payment.amountPaid.toNumber(), 0);
                const outstandingAmount = purchase.totalAmount.toNumber() - totalPaid;
                const daysPastDue = Math.floor((asOfDate.getTime() - purchase.orderDate.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    vendor: purchase.vendor,
                    orderNo: purchase.orderNo,
                    orderDate: purchase.orderDate,
                    totalAmount: purchase.totalAmount.toNumber(),
                    amountPaid: totalPaid,
                    outstandingAmount,
                    daysPastDue,
                    agingBucket: daysPastDue <= 30 ? 'Current' :
                        daysPastDue <= 60 ? '31-60 Days' :
                            daysPastDue <= 90 ? '61-90 Days' : 'Over 90 Days'
                };
            }).filter(item => item.outstandingAmount > 0);
        }
    }
}
exports.ReportsService = ReportsService;
