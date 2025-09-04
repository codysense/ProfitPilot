
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('@prisma/client/runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  password: 'password',
  status: 'status',
  lastLoginAt: 'lastLoginAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  resource: 'resource',
  action: 'action',
  description: 'description'
};

exports.Prisma.UserRoleScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  roleId: 'roleId'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  id: 'id',
  roleId: 'roleId',
  permissionId: 'permissionId'
};

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  baseCurrency: 'baseCurrency',
  timezone: 'timezone',
  address: 'address',
  phone: 'phone',
  email: 'email',
  createdAt: 'createdAt'
};

exports.Prisma.LocationScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.WarehouseScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  locationId: 'locationId',
  address: 'address',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.BinScalarFieldEnum = {
  id: 'id',
  warehouseId: 'warehouseId',
  code: 'code',
  name: 'name'
};

exports.Prisma.ItemScalarFieldEnum = {
  id: 'id',
  sku: 'sku',
  name: 'name',
  description: 'description',
  type: 'type',
  uom: 'uom',
  costingMethod: 'costingMethod',
  standardCost: 'standardCost',
  sellingPriceOrdinary: 'sellingPriceOrdinary',
  sellingPriceBulk: 'sellingPriceBulk',
  sellingPriceWIC: 'sellingPriceWIC',
  taxCode: 'taxCode',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BomScalarFieldEnum = {
  id: 'id',
  itemId: 'itemId',
  version: 'version',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BomLineScalarFieldEnum = {
  id: 'id',
  bomId: 'bomId',
  componentItemId: 'componentItemId',
  qtyPer: 'qtyPer',
  scrapPercent: 'scrapPercent'
};

exports.Prisma.InventoryBatchScalarFieldEnum = {
  id: 'id',
  itemId: 'itemId',
  warehouseId: 'warehouseId',
  binId: 'binId',
  qtyOnHand: 'qtyOnHand',
  unitCost: 'unitCost',
  receivedAt: 'receivedAt'
};

exports.Prisma.InventoryLedgerScalarFieldEnum = {
  id: 'id',
  itemId: 'itemId',
  warehouseId: 'warehouseId',
  refType: 'refType',
  refId: 'refId',
  direction: 'direction',
  qty: 'qty',
  unitCost: 'unitCost',
  value: 'value',
  runningQty: 'runningQty',
  runningValue: 'runningValue',
  runningAvgCost: 'runningAvgCost',
  batchId: 'batchId',
  userId: 'userId',
  postedAt: 'postedAt'
};

exports.Prisma.ProductionOrderScalarFieldEnum = {
  id: 'id',
  orderNo: 'orderNo',
  itemId: 'itemId',
  qtyTarget: 'qtyTarget',
  qtyProduced: 'qtyProduced',
  status: 'status',
  warehouseId: 'warehouseId',
  bomId: 'bomId',
  approvalStatus: 'approvalStatus',
  approvalRequestId: 'approvalRequestId',
  approvedBy: 'approvedBy',
  approvedAt: 'approvedAt',
  startedAt: 'startedAt',
  finishedAt: 'finishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WipLedgerScalarFieldEnum = {
  id: 'id',
  productionOrderId: 'productionOrderId',
  type: 'type',
  amount: 'amount',
  note: 'note',
  postedAt: 'postedAt'
};

exports.Prisma.LaborTimeScalarFieldEnum = {
  id: 'id',
  productionOrderId: 'productionOrderId',
  hours: 'hours',
  rate: 'rate',
  amount: 'amount',
  employeeName: 'employeeName'
};

exports.Prisma.VendorScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  address: 'address',
  phone: 'phone',
  email: 'email',
  paymentTerms: 'paymentTerms',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.CustomerScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  address: 'address',
  phone: 'phone',
  email: 'email',
  creditLimit: 'creditLimit',
  CustomerGroup: 'CustomerGroup',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.PurchaseScalarFieldEnum = {
  id: 'id',
  orderNo: 'orderNo',
  vendorId: 'vendorId',
  orderDate: 'orderDate',
  status: 'status',
  totalAmount: 'totalAmount',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchaseLineScalarFieldEnum = {
  id: 'id',
  purchaseId: 'purchaseId',
  itemId: 'itemId',
  qty: 'qty',
  unitPrice: 'unitPrice',
  lineTotal: 'lineTotal'
};

exports.Prisma.SaleScalarFieldEnum = {
  id: 'id',
  orderNo: 'orderNo',
  customerId: 'customerId',
  orderDate: 'orderDate',
  status: 'status',
  totalAmount: 'totalAmount',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SaleLineScalarFieldEnum = {
  id: 'id',
  saleId: 'saleId',
  itemId: 'itemId',
  qty: 'qty',
  unitPrice: 'unitPrice',
  lineTotal: 'lineTotal'
};

exports.Prisma.ChartOfAccountScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  description: 'description',
  accountType: 'accountType',
  parentId: 'parentId',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.JournalScalarFieldEnum = {
  id: 'id',
  journalNo: 'journalNo',
  date: 'date',
  memo: 'memo',
  postedBy: 'postedBy',
  postedAt: 'postedAt'
};

exports.Prisma.JournalLineScalarFieldEnum = {
  id: 'id',
  journalId: 'journalId',
  accountId: 'accountId',
  debit: 'debit',
  credit: 'credit',
  refType: 'refType',
  refId: 'refId'
};

exports.Prisma.PolicyScalarFieldEnum = {
  id: 'id',
  key: 'key',
  valueJson: 'valueJson',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  beforeJson: 'beforeJson',
  afterJson: 'afterJson',
  ipAddress: 'ipAddress',
  createdAt: 'createdAt'
};

exports.Prisma.CashAccountScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  accountType: 'accountType',
  accountNumber: 'accountNumber',
  glAccountId: 'glAccountId',
  bankName: 'bankName',
  balance: 'balance',
  isActive: 'isActive',
  createdAt: 'createdAt',
  chartOfAccountId: 'chartOfAccountId'
};

exports.Prisma.CashTransactionScalarFieldEnum = {
  id: 'id',
  transactionNo: 'transactionNo',
  cashAccountId: 'cashAccountId',
  glAccountId: 'glAccountId',
  contraAccountId: 'contraAccountId',
  transactionType: 'transactionType',
  amount: 'amount',
  description: 'description',
  refType: 'refType',
  refId: 'refId',
  transactionDate: 'transactionDate',
  isReconciled: 'isReconciled',
  reconciledAt: 'reconciledAt',
  userId: 'userId',
  createdAt: 'createdAt',
  reference: 'reference'
};

exports.Prisma.SalesReceiptScalarFieldEnum = {
  id: 'id',
  receiptNo: 'receiptNo',
  saleId: 'saleId',
  customerId: 'customerId',
  cashAccountId: 'cashAccountId',
  amountReceived: 'amountReceived',
  receiptDate: 'receiptDate',
  reference: 'reference',
  notes: 'notes',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.PurchasePaymentScalarFieldEnum = {
  id: 'id',
  paymentNo: 'paymentNo',
  purchaseId: 'purchaseId',
  vendorId: 'vendorId',
  cashAccountId: 'cashAccountId',
  amountPaid: 'amountPaid',
  paymentDate: 'paymentDate',
  reference: 'reference',
  notes: 'notes',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.SystemSettingScalarFieldEnum = {
  id: 'id',
  category: 'category',
  key: 'key',
  value: 'value',
  dataType: 'dataType',
  description: 'description',
  updatedBy: 'updatedBy',
  updatedAt: 'updatedAt',
  createdAt: 'createdAt'
};

exports.Prisma.FiscalYearScalarFieldEnum = {
  id: 'id',
  year: 'year',
  startDate: 'startDate',
  endDate: 'endDate',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FiscalPeriodScalarFieldEnum = {
  id: 'id',
  fiscalYearId: 'fiscalYearId',
  periodNumber: 'periodNumber',
  name: 'name',
  startDate: 'startDate',
  endDate: 'endDate',
  isActive: 'isActive',
  isClosed: 'isClosed',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApprovalWorkflowScalarFieldEnum = {
  id: 'id',
  name: 'name',
  entity: 'entity',
  minAmount: 'minAmount',
  maxAmount: 'maxAmount',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApprovalStepScalarFieldEnum = {
  id: 'id',
  workflowId: 'workflowId',
  stepOrder: 'stepOrder',
  name: 'name',
  roleId: 'roleId',
  isRequired: 'isRequired',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApprovalRequestScalarFieldEnum = {
  id: 'id',
  workflowId: 'workflowId',
  entityType: 'entityType',
  entityId: 'entityId',
  requestedBy: 'requestedBy',
  currentStepId: 'currentStepId',
  status: 'status',
  requestedAt: 'requestedAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApprovalActionScalarFieldEnum = {
  id: 'id',
  requestId: 'requestId',
  stepId: 'stepId',
  userId: 'userId',
  action: 'action',
  comments: 'comments',
  actionDate: 'actionDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssetCategoryScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  description: 'description',
  depreciationMethod: 'depreciationMethod',
  usefulLife: 'usefulLife',
  residualValue: 'residualValue',
  glAssetAccountId: 'glAssetAccountId',
  glDepreciationAccountId: 'glDepreciationAccountId',
  glAccumulatedDepreciationAccountId: 'glAccumulatedDepreciationAccountId',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.AssetScalarFieldEnum = {
  id: 'id',
  assetNo: 'assetNo',
  name: 'name',
  description: 'description',
  categoryId: 'categoryId',
  acquisitionDate: 'acquisitionDate',
  acquisitionCost: 'acquisitionCost',
  residualValue: 'residualValue',
  usefulLife: 'usefulLife',
  depreciationMethod: 'depreciationMethod',
  locationId: 'locationId',
  serialNumber: 'serialNumber',
  supplier: 'supplier',
  purchaseOrderId: 'purchaseOrderId',
  status: 'status',
  disposalDate: 'disposalDate',
  disposalAmount: 'disposalAmount',
  disposalMethod: 'disposalMethod',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  vendorId: 'vendorId'
};

exports.Prisma.AssetDepreciationScalarFieldEnum = {
  id: 'id',
  assetId: 'assetId',
  periodYear: 'periodYear',
  periodMonth: 'periodMonth',
  depreciationAmount: 'depreciationAmount',
  accumulatedDepreciation: 'accumulatedDepreciation',
  netBookValue: 'netBookValue',
  isPosted: 'isPosted',
  postedAt: 'postedAt',
  journalId: 'journalId',
  createdAt: 'createdAt'
};

exports.Prisma.AssetDisposalScalarFieldEnum = {
  id: 'id',
  assetId: 'assetId',
  disposalDate: 'disposalDate',
  disposalAmount: 'disposalAmount',
  disposalMethod: 'disposalMethod',
  buyerDetails: 'buyerDetails',
  gainLoss: 'gainLoss',
  notes: 'notes',
  journalId: 'journalId',
  disposedBy: 'disposedBy',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.ItemType = exports.$Enums.ItemType = {
  RAW_MATERIAL: 'RAW_MATERIAL',
  WORK_IN_PROGRESS: 'WORK_IN_PROGRESS',
  FINISHED_GOODS: 'FINISHED_GOODS',
  CONSUMABLE: 'CONSUMABLE'
};

exports.CostingMethod = exports.$Enums.CostingMethod = {
  GLOBAL: 'GLOBAL',
  FIFO: 'FIFO',
  WEIGHTED_AVG: 'WEIGHTED_AVG'
};

exports.LedgerDirection = exports.$Enums.LedgerDirection = {
  IN: 'IN',
  OUT: 'OUT'
};

exports.ProductionOrderStatus = exports.$Enums.ProductionOrderStatus = {
  PLANNED: 'PLANNED',
  RELEASED: 'RELEASED',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  CLOSED: 'CLOSED'
};

exports.WipLedgerType = exports.$Enums.WipLedgerType = {
  ISSUE: 'ISSUE',
  LABOR: 'LABOR',
  OVERHEAD: 'OVERHEAD',
  RECEIPT: 'RECEIPT'
};

exports.PurchaseStatus = exports.$Enums.PurchaseStatus = {
  DRAFT: 'DRAFT',
  ORDERED: 'ORDERED',
  RECEIVED: 'RECEIVED',
  INVOICED: 'INVOICED',
  PAID: 'PAID'
};

exports.SaleStatus = exports.$Enums.SaleStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  DELIVERED: 'DELIVERED',
  INVOICED: 'INVOICED',
  PAID: 'PAID'
};

exports.Prisma.ModelName = {
  User: 'User',
  Role: 'Role',
  Permission: 'Permission',
  UserRole: 'UserRole',
  RolePermission: 'RolePermission',
  Company: 'Company',
  Location: 'Location',
  Warehouse: 'Warehouse',
  Bin: 'Bin',
  Item: 'Item',
  Bom: 'Bom',
  BomLine: 'BomLine',
  InventoryBatch: 'InventoryBatch',
  InventoryLedger: 'InventoryLedger',
  ProductionOrder: 'ProductionOrder',
  WipLedger: 'WipLedger',
  LaborTime: 'LaborTime',
  Vendor: 'Vendor',
  Customer: 'Customer',
  Purchase: 'Purchase',
  PurchaseLine: 'PurchaseLine',
  Sale: 'Sale',
  SaleLine: 'SaleLine',
  ChartOfAccount: 'ChartOfAccount',
  Journal: 'Journal',
  JournalLine: 'JournalLine',
  Policy: 'Policy',
  AuditLog: 'AuditLog',
  CashAccount: 'CashAccount',
  CashTransaction: 'CashTransaction',
  SalesReceipt: 'SalesReceipt',
  PurchasePayment: 'PurchasePayment',
  SystemSetting: 'SystemSetting',
  FiscalYear: 'FiscalYear',
  FiscalPeriod: 'FiscalPeriod',
  ApprovalWorkflow: 'ApprovalWorkflow',
  ApprovalStep: 'ApprovalStep',
  ApprovalRequest: 'ApprovalRequest',
  ApprovalAction: 'ApprovalAction',
  AssetCategory: 'AssetCategory',
  Asset: 'Asset',
  AssetDepreciation: 'AssetDepreciation',
  AssetDisposal: 'AssetDisposal'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
