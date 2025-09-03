"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("./routes/auth"));
const sales_1 = __importDefault(require("./routes/sales"));
const purchase_1 = __importDefault(require("./routes/purchase"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const production_1 = __importDefault(require("./routes/production"));
const cash_1 = __importDefault(require("./routes/cash"));
const reports_1 = __importDefault(require("./routes/reports"));
const management_1 = __importDefault(require("./routes/management"));
const assets_1 = __importDefault(require("./routes/assets"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Test database connection
async function testConnection() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/sales', sales_1.default);
app.use('/api/v1/purchase', purchase_1.default);
app.use('/api/v1/inventory', inventory_1.default);
app.use('/api/v1/production', production_1.default);
app.use('/api/v1/cash', cash_1.default);
app.use('/api/v1/reports', reports_1.default);
app.use('/api/v1/management', management_1.default);
app.use('/api/v1/assets', assets_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.listen(PORT, async () => {
    await testConnection();
    console.log(`Server running on port ${PORT}`);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
