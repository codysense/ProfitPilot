"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsController = void 0;
const client_1 = require("@prisma/client");
const assets_1 = require("../types/assets");
const assets_2 = require("../services/assets");
const prisma = new client_1.PrismaClient();
const assetsService = new assets_2.AssetsService();
class AssetsController {
    // Asset Categories
    async getAssetCategories(req, res) {
        try {
            const categories = await assetsService.getAssetCategories();
            res.json({ categories });
        }
        catch (error) {
            console.error('Get asset categories error:', error);
            res.status(500).json({ error: 'Failed to fetch asset categories' });
        }
    }
    async createAssetCategory(req, res) {
        try {
            const validatedData = assets_1.createAssetCategorySchema.parse(req.body);
            const category = await assetsService.createAssetCategory(validatedData);
            res.status(201).json(category);
        }
        catch (error) {
            console.error('Create asset category error:', error);
            res.status(400).json({ error: 'Failed to create asset category' });
        }
    }
    // Assets
    async getAssets(req, res) {
        try {
            const result = await assetsService.getAssets(req.query);
            res.json(result);
        }
        catch (error) {
            console.error('Get assets error:', error);
            res.status(500).json({ error: 'Failed to fetch assets' });
        }
    }
    async createAsset(req, res) {
        try {
            const validatedData = assets_1.createAssetSchema.parse(req.body);
            const asset = await assetsService.createAsset(validatedData, req.user.id);
            res.status(201).json(asset);
        }
        catch (error) {
            console.error('Create asset error:', error);
            res.status(400).json({ error: 'Failed to create asset' });
        }
    }
    async updateAsset(req, res) {
        try {
            const { id } = req.params;
            const validatedData = assets_1.updateAssetSchema.parse(req.body);
            const asset = await assetsService.updateAsset(id, validatedData);
            res.json(asset);
        }
        catch (error) {
            console.error('Update asset error:', error);
            res.status(400).json({ error: 'Failed to update asset' });
        }
    }
    async deleteAsset(req, res) {
        try {
            const { id } = req.params;
            await assetsService.deleteAsset(id);
            res.json({ message: 'Asset deleted successfully' });
        }
        catch (error) {
            console.error('Delete asset error:', error);
            res.status(400).json({ error: 'Failed to delete asset' });
        }
    }
    // Capitalization
    async capitalizeFromPurchase(req, res) {
        try {
            const validatedData = assets_1.capitalizeFromPurchaseSchema.parse(req.body);
            const assets = await assetsService.capitalizeFromPurchase(validatedData, req.user.id);
            res.status(201).json({
                message: `${assets.length} assets capitalized successfully`,
                assets
            });
        }
        catch (error) {
            console.error('Capitalize from purchase error:', error);
            res.status(400).json({ error: 'Failed to capitalize assets from purchase' });
        }
    }
    // Depreciation
    async runDepreciation(req, res) {
        try {
            const validatedData = assets_1.runDepreciationSchema.parse(req.body);
            const result = await assetsService.runDepreciation(validatedData, req.user.id);
            res.json(result);
        }
        catch (error) {
            console.error('Run depreciation error:', error);
            res.status(400).json({ error: 'Failed to run depreciation' });
        }
    }
    async getDepreciationSchedule(req, res) {
        try {
            const { id } = req.params;
            const schedule = await assetsService.getDepreciationSchedule(id);
            res.json(schedule);
        }
        catch (error) {
            console.error('Get depreciation schedule error:', error);
            res.status(500).json({ error: 'Failed to fetch depreciation schedule' });
        }
    }
    // Asset Disposal
    async disposeAsset(req, res) {
        try {
            const { id } = req.params;
            const validatedData = assets_1.disposeAssetSchema.parse(req.body);
            const disposal = await assetsService.disposeAsset(id, validatedData, req.user.id);
            res.json(disposal);
        }
        catch (error) {
            console.error('Dispose asset error:', error);
            res.status(400).json({ error: 'Failed to dispose asset' });
        }
    }
    // Reports
    async getAssetRegister(req, res) {
        try {
            const register = await assetsService.getAssetRegister(req.query);
            res.json({ register });
        }
        catch (error) {
            console.error('Get asset register error:', error);
            res.status(500).json({ error: 'Failed to fetch asset register' });
        }
    }
    async getAssetValuation(req, res) {
        try {
            const { asOfDate } = req.query;
            const valuation = await assetsService.getAssetValuation(asOfDate);
            res.json(valuation);
        }
        catch (error) {
            console.error('Get asset valuation error:', error);
            res.status(500).json({ error: 'Failed to fetch asset valuation' });
        }
    }
    // Get purchase orders for capitalization
    async getPurchaseOrdersForCapitalization(req, res) {
        try {
            const purchases = await prisma.purchase.findMany({
                where: {
                    status: { in: ['RECEIVED', 'INVOICED', 'PAID'] }
                },
                include: {
                    vendor: { select: { code: true, name: true } },
                    purchaseLines: {
                        include: {
                            item: { select: { sku: true, name: true, type: true } }
                        }
                    }
                },
                orderBy: { orderDate: 'desc' }
            });
            res.json({ purchases });
        }
        catch (error) {
            console.error('Get purchase orders for capitalization error:', error);
            res.status(500).json({ error: 'Failed to fetch purchase orders' });
        }
    }
}
exports.AssetsController = AssetsController;
