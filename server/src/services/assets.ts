import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { GeneralLedgerService } from "./gl";
import { lte } from "zod";

const prisma = new PrismaClient();
const glService = new GeneralLedgerService();

export class AssetsService {
  // Asset Categories
  async getAssetCategories() {
    return await prisma.assetCategory.findMany({
      include: {
        glAssetAccount: { select: { code: true, name: true } },
        glDepreciationAccount: { select: { code: true, name: true } },
        glAccumulatedDepreciationAccount: {
          select: { code: true, name: true },
        },
        _count: { select: { assets: true } },
      },
      orderBy: { code: "asc" },
    });
  }

  async createAssetCategory(data: any) {
    return await prisma.assetCategory.create({
      data,
      include: {
        glAssetAccount: { select: { code: true, name: true } },
        glDepreciationAccount: { select: { code: true, name: true } },
        glAccumulatedDepreciationAccount: {
          select: { code: true, name: true },
        },
      },
    });
  }

  async updateAssetCategory(categoryId: string, data: any) {
    // 1. Check if any asset exists in this category
    const assetCount = await prisma.asset.count({
      where: { categoryId },
    });

    // if (assetCount > 0) {
    //   throw new Error(
    //     "Cannot update asset category. Assets already exist under this category.",
    //   );
    // }

    // 2. Update category
    return await prisma.assetCategory.update({
      where: { id: categoryId },
      data,
      include: {
        glAssetAccount: { select: { code: true, name: true } },
        glDepreciationAccount: { select: { code: true, name: true } },
        glAccumulatedDepreciationAccount: {
          select: { code: true, name: true },
        },
      },
    });
  }

  async deleteAssetCategory(categoryId: string) {
    // 1. Check if any asset exists in this category
    const assetCount = await prisma.asset.count({
      where: { categoryId },
    });

    if (assetCount > 0) {
      throw new Error(
        "Cannot delete asset category. Assets already exist under this category.",
      );
    }

    // 2. Delete category
    return await prisma.assetCategory.delete({
      where: { id: categoryId },
    });
  }

  // Assets
  async getAssets(filters: any = {}) {
    let { page = 1, limit = 10, categoryId, status, locationId } = filters;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    // const tests = {
    //   categoryOnly: await prisma.asset.count({
    //     where: { categoryId },
    //   }),
    //   statusOnly: await prisma.asset.count({
    //     where: { status },
    //   }),
    //   locationOnly: await prisma.asset.count({
    //     where: { locationId },
    //   }),
    //   categoryAndStatus: await prisma.asset.count({
    //     where: { categoryId, status },
    //   }),
    //   allThree: await prisma.asset.count({
    //     where: { categoryId, status, locationId },
    //   }),
    // };

    // console.log("FILTER TEST RESULTS:", tests);

    const where: any = {};

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (status && status !== "ALL") {
      where.status = status.toUpperCase();
    }

    if (locationId && locationId !== "ALL") {
      where.locationId = locationId;
    }

    // console.log("Final WHERE:", where);

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { code: true, name: true, usefulLife: true } },
          location: { select: { code: true, name: true } },
          createdByUser: { select: { name: true } },
          purchaseOrder: { select: { orderNo: true } },
          _count: { select: { depreciationEntries: true } },
        },
      }),
      prisma.asset.count({ where }),
    ]);
    console.log("Assets fetched:", assets);
    return {
      assets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // async getAssets(filters: any = {}) {
  //   let { page = 1, limit = 10, categoryId, status, locationId } = filters;

  //   console.log("Filters received in service:", filters);

  //   // ensure page & limit are numbers
  //   page = parseInt(page, 10) || 1;
  //   limit = parseInt(limit, 10) || 10;

  //   const skip = (page - 1) * limit;

  //   const where: any = {};
  //   if (categoryId) where.categoryId = categoryId;
  //   if (status) where.status = status;
  //   if (locationId) where.locationId = locationId;

  //   const [assets, total] = await Promise.all([
  //     prisma.asset.findMany({
  //       where,
  //       skip,
  //       take: limit,
  //       include: {
  //         category: {
  //           select: { code: true, name: true, depreciationMethod: true },
  //         },
  //         location: { select: { code: true, name: true } },
  //         createdByUser: { select: { name: true } },
  //         purchaseOrder: { select: { orderNo: true } },
  //         _count: { select: { depreciationEntries: true } },
  //       },
  //       orderBy: { createdAt: "desc" },
  //     }),
  //     prisma.asset.count({ where }),
  //   ]);

  //   return {
  //     assets,
  //     pagination: {
  //       page,
  //       limit,
  //       total,
  //       pages: Math.ceil(total / limit),
  //     },
  //   };
  // }

  async createAsset(data: any, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // Generate asset number
      // const count = await tx.asset.count();

      const lastAsset = await tx.asset.findFirst({
        orderBy: { createdAt: "desc" },
      });

      let nextNumber = 1;
      if (lastAsset) {
        // Extract the numeric part of the orderNo
        const lastNumber = parseInt(lastAsset.assetNo.replace(/^AST/, ""), 10);
        nextNumber = lastNumber + 1;
      }
      const assetNo = `AST${String(nextNumber + 1).padStart(6, "0")}`;

      const category = await tx.assetCategory.findUnique({
        where: { id: data.categoryId },
        include: { glAssetAccount: true },
      });

      if (!category) {
        throw new Error("Asset category not found");
      }

      const asset = await tx.asset.create({
        data: {
          assetNo,
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          acquisitionDate: new Date(data.acquisitionDate),
          acquisitionCost: new Decimal(data.acquisitionCost),
          residualValue: new Decimal(
            data.residualValue ??
              (Number(data.acquisitionCost) * Number(category.residualValue)) /
                100,
          ),
          usefulLife: data.usefulLife || category.usefulLife,
          depreciationMethod:
            data.depreciationMethod || category.depreciationMethod,
          locationId: data.locationId,
          serialNumber: data.serialNumber,
          supplier: data.supplier,
          purchaseOrderId: data.purchaseOrderId,
          createdBy: userId,
        },
      });
      //Get category GL accounts from glAccountid from data
      const glAssetAccount = data.glAssetAccountId
        ? await tx.chartOfAccount.findUnique({
            where: { id: data.glAssetAccountId },
          })
        : category.glAssetAccount;

      // Post capitalization to GL
      await glService.postJournal(
        tx,
        [
          {
            accountCode: category.glAssetAccount.code,
            debit: data.acquisitionCost,
            credit: 0,
            refType: "ASSET_CAPITALIZATION",
            refId: asset.id,
          },
          {
            accountCode: "3000",
            debit: 0,
            credit: data.acquisitionCost,
            refType: "ASSET_CAPITALIZATION",
            refId: asset.id,
          },
        ],
        `Asset capitalization: ${asset.name}`,
        userId,
      );

      return asset;
    });
  }

  async updateAsset(assetId: string, data: any) {
    return await prisma.asset.update({
      where: { id: assetId },
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        locationId: data.locationId,
        acquisitionDate: new Date(data.acquisitionDate),
        usefulLife: data.usefulLife,
        serialNumber: data.serialNumber,
        supplier: data.supplier,
      },
      include: {
        category: { select: { code: true, name: true } },
        location: { select: { code: true, name: true } },
      },
    });
  }

  // async deleteAsset(assetId: string) {
  //   // Check if asset has depreciation entries
  //   const depreciationCount = await prisma.assetDepreciation.count({
  //     where: { assetId },
  //   });

  //   if (depreciationCount > 0) {
  //     throw new Error("Cannot delete asset with depreciation entries");
  //   }

  //   return await prisma.asset.delete({
  //     where: { id: assetId },
  //   });
  // }

  // Capitalization from Purchase Orders

  async deleteAsset(assetId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id: assetId },
        include: {
          category: {
            include: {
              glAssetAccount: true,
              glDepreciationAccount: true,
              glAccumulatedDepreciationAccount: true,
            },
          },
          depreciationEntries: {
            orderBy: [{ periodYear: "asc" }, { periodMonth: "asc" }],
          },
          recapitalizations: true,
          disposals: true,
        },
      });

      if (!asset) {
        throw new Error("Asset not found");
      }

      // 1. Reverse all posted Depreciation Entries in GL
      const glDepreciationAccount = asset.category?.glDepreciationAccount?.code;
      const glAccumulatedDepreciationAccount =
        asset.category?.glAccumulatedDepreciationAccount?.code;

      for (const entry of asset.depreciationEntries) {
        const depreciationAmount = Number(entry.depreciationAmount);
        if (
          depreciationAmount > 0 &&
          glDepreciationAccount &&
          glAccumulatedDepreciationAccount
        ) {
          const periodStartDate = new Date(
            entry.periodYear,
            entry.periodMonth - 1,
            1,
          );
          await glService.postJournal(
            tx,
            [
              {
                accountCode: glDepreciationAccount,
                debit: 0,
                credit: depreciationAmount, // Credit expense to reduce it
                refType: "REVERSED_DEPRECIATION",
                refId: asset.id,
              },
              {
                accountCode: glAccumulatedDepreciationAccount,
                debit: depreciationAmount, // Debit accumulated depreciation to reduce it
                credit: 0,
                refType: "REVERSED_DEPRECIATION",
                refId: asset.id,
              },
            ],
            `Reverse Depreciation on asset deletion: ${asset.assetNo} - ${asset.name} (${entry.periodYear}-${String(entry.periodMonth).padStart(2, "0")})`,
            userId,
            periodStartDate,
          );
        }
      }

      // Delete AssetDepreciation records
      await tx.assetDepreciation.deleteMany({
        where: { assetId: asset.id },
      });

      // 2. Reverse Recapitalizations (if any)
      for (const recap of asset.recapitalizations) {
        const recapAmount = Number(recap.amount);
        if (recapAmount > 0) {
          const assetAccountCode = asset.category?.glAssetAccount?.code;
          let creditAccountCode = "3000";
          if (recap.sourceAccountId) {
            const srcAcc = await tx.chartOfAccount.findUnique({
              where: { id: recap.sourceAccountId },
            });
            if (srcAcc) creditAccountCode = srcAcc.code;

            // If source account was a cash account, refund/increment balance
            const cashAccount = await tx.cashAccount.findFirst({
              where: { glAccountId: recap.sourceAccountId },
            });
            if (cashAccount) {
              await tx.cashAccount.update({
                where: { id: cashAccount.id },
                data: {
                  balance: {
                    increment: recap.amount,
                  },
                },
              });
            }
          }

          if (assetAccountCode) {
            await glService.postJournal(
              tx,
              [
                {
                  accountCode: assetAccountCode,
                  debit: 0,
                  credit: recapAmount,
                  refType: "ASSET_RECAPITALIZATION_REVERSAL",
                  refId: asset.id,
                },
                {
                  accountCode: creditAccountCode,
                  debit: recapAmount,
                  credit: 0,
                  refType: "ASSET_RECAPITALIZATION_REVERSAL",
                  refId: asset.id,
                },
              ],
              `Asset recapitalization reversal on deletion: ${asset.assetNo} - ${asset.name}`,
              userId,
            );
          }
        }
      }

      // Delete AssetRecapitalization records
      await tx.assetRecapitalization.deleteMany({
        where: { assetId: asset.id },
      });

      // 3. Reverse Capitalization Entries in GL
      const originalLines = await tx.journalLine.findMany({
        where: {
          refType: "ASSET_CAPITALIZATION",
          refId: asset.id,
        },
        include: { account: true },
      });

      if (originalLines.length > 0) {
        const reversalLines = originalLines.map((line) => ({
          accountCode: line.account.code,
          debit: Number(line.credit),
          credit: Number(line.debit),
          refType: "ASSET_CAPITALIZATION_REVERSAL",
          refId: asset.id,
        }));

        await glService.postJournal(
          tx,
          reversalLines,
          `Asset capitalization reversal: ${asset.assetNo} - ${asset.name}`,
          userId,
        );
      }

      // 4. Reverse / Clean up Disposals (if any)
      if (asset.disposals && asset.disposals.length > 0) {
        await tx.assetDisposal.deleteMany({
          where: { assetId: asset.id },
        });
      }

      // 5. If capitalized from Purchase Order, check if other assets exist; if not, revert PO status to ORDERED
      if (asset.purchaseOrderId) {
        const otherAssetsCount = await tx.asset.count({
          where: {
            purchaseOrderId: asset.purchaseOrderId,
            id: { not: asset.id },
          },
        });

        if (otherAssetsCount === 0) {
          await tx.purchase.update({
            where: { id: asset.purchaseOrderId },
            data: { status: "ORDERED" },
          });
        }
      }

      // 6. Delete the asset record completely
      return await tx.asset.delete({
        where: { id: assetId },
      });
    });
  }

  async capitalizeFromPurchase(data: any, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: data.purchaseOrderId },
        include: { vendor: true },
      });

      if (!purchase) {
        throw new Error("Purchase order not found");
      }

      const createdAssets = [];

      for (const assetData of data.assets) {
        const lastAsset = await tx.asset.findFirst({
          orderBy: { createdAt: "desc" },
        });

        let nextNumber = 1;
        if (lastAsset) {
          // Extract the numeric part of the orderNo
          const lastNumber = parseInt(
            lastAsset.assetNo.replace(/^AST/, ""),
            10,
          );
          nextNumber = lastNumber + 1;
        }
        const assetNo = `AST${String(nextNumber + 1).padStart(6, "0")}`;

        const category = await tx.assetCategory.findUnique({
          where: { id: assetData.categoryId },
          include: { glAssetAccount: true },
        });

        if (!category) {
          throw new Error(
            `Asset category not found for asset: ${assetData.name}`,
          );
        }

        const asset = await tx.asset.create({
          data: {
            assetNo,
            name: assetData.name,
            categoryId: assetData.categoryId,
            acquisitionDate: purchase.orderDate,
            acquisitionCost: new Decimal(assetData.acquisitionCost),
            residualValue: new Decimal(
              (Number(assetData.acquisitionCost) *
                Number(category.residualValue)) /
                100,
            ),
            usefulLife: category.usefulLife,
            depreciationMethod: category.depreciationMethod,
            locationId: assetData.locationId,
            serialNumber: assetData.serialNumber,
            supplier: purchase.vendor.name,
            purchaseOrderId: data.purchaseOrderId,
            createdBy: userId,
          },
        });

        createdAssets.push(asset);

        // Post capitalization to GL
        await glService.postJournal(
          tx,
          [
            {
              accountCode: "1510", //Asset Clearing Account
              debit: assetData.acquisitionCost,
              credit: 0,
              refType: "ASSET_CAPITALIZATION",
              refId: asset.id,
            },
            {
              accountCode: "2000", // Accounts Payable
              debit: 0,
              credit: assetData.acquisitionCost,
              refType: "ASSET_CAPITALIZATION",
              refId: asset.id,
            },
            {
              accountCode: category.glAssetAccount.code,
              debit: assetData.acquisitionCost,
              credit: 0,
              refType: "ASSET_CAPITALIZATION",
              refId: asset.id,
            },
            {
              accountCode: "1510", // Asset Clearing Account
              debit: 0,
              credit: assetData.acquisitionCost,
              refType: "ASSET_CAPITALIZATION",
              refId: asset.id,
            },
          ],
          `Asset capitalization from PO ${purchase.orderNo}: ${asset.name}`,
          userId,
        );
      }

      await tx.purchase.update({
        where: { id: data.purchaseOrderId },
        data: { status: "INVOICED" },
      });

      return createdAssets;
    });
  }

  // Depreciation Calculations
  async calculateDepreciation(
    assetId: string,
    periodYear: number,
    periodMonth: number,
  ) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        depreciationEntries: {
          orderBy: [
            { periodYear: "desc" },
            { periodMonth: "desc" },
            { createdAt: "desc" },
          ],
          take: 1,
        },
      },
    });

    if (!asset || asset.status !== "ACTIVE") {
      throw new Error("Asset not found or not active");
    }

    const acquisitionDate = new Date(asset.acquisitionDate);
    // End of the depreciation period month (e.g. Aug 31, 23:59:59.999)
    const periodEndDate = new Date(
      periodYear,
      periodMonth,
      0,
      23,
      59,
      59,
      999,
    );

    // Check if asset was acquired before or during the depreciation period
    if (acquisitionDate > periodEndDate) {
      return {
        depreciationAmount: 0,
        accumulatedDepreciation: 0,
        netBookValue: Number(asset.acquisitionCost),
      };
    }

    const acquisitionCost = Number(asset.acquisitionCost);
    const residualValue = Number(asset.residualValue);
    const depreciableAmount = acquisitionCost - residualValue;

    let depreciationAmount = 0;
    let accumulatedDepreciation = 0;

    // Get previous accumulated depreciation
    if (asset.depreciationEntries.length > 0) {
      accumulatedDepreciation = Number(
        asset.depreciationEntries[0].accumulatedDepreciation,
      );
    }

    if (asset.depreciationMethod === "STRAIGHT_LINE") {
      // Straight-line: (Cost - Residual) / Useful Life
      const usefulLife = asset.usefulLife > 0 ? asset.usefulLife : 60;
      const monthlyDepreciation = depreciableAmount / usefulLife;
      depreciationAmount = monthlyDepreciation;
    } else {
      // Reducing balance
      const usefulLife = asset.usefulLife > 0 ? asset.usefulLife : 60;
      const effectiveResidual =
        residualValue > 0 ? residualValue : acquisitionCost * 0.01;
      const rate =
        (1 -
          Math.pow(effectiveResidual / acquisitionCost, 1 / usefulLife)) *
        100;
      const currentBookValue = acquisitionCost - accumulatedDepreciation;
      depreciationAmount = (currentBookValue * rate) / 100;
    }

    // Ensure we don't depreciate below residual value
    const newAccumulatedDepreciation =
      accumulatedDepreciation + depreciationAmount;
    if (newAccumulatedDepreciation > depreciableAmount) {
      depreciationAmount = depreciableAmount - accumulatedDepreciation;
    }

    const finalAccumulatedDepreciation =
      accumulatedDepreciation + depreciationAmount;
    const netBookValue = acquisitionCost - finalAccumulatedDepreciation;

    return {
      depreciationAmount: Math.max(0, depreciationAmount),
      accumulatedDepreciation: finalAccumulatedDepreciation,
      netBookValue: Math.max(residualValue, netBookValue),
    };
  }

  async runDepreciation(data: any, userId: string) {
    const { periodYear, periodMonth, assetIds } = data;

    // create transaction date from period year and month - last day of the month
    const transactionDate = new Date(periodYear, periodMonth, 0); // last day of the month

    return await prisma.$transaction(
      async (tx) => {
        // Get assets to depreciate
        const where: any = { status: "ACTIVE" };
        if (assetIds && assetIds.length > 0) {
          where.id = { in: assetIds };
        }

        const assets = await tx.asset.findMany({
          where,
          include: {
            category: {
              include: {
                glDepreciationAccount: true,
                glAccumulatedDepreciationAccount: true,
              },
            },
          },
        });

        const depreciationEntries = [];
        let totalDepreciation = 0;

        for (const asset of assets) {
          // Check if depreciation already exists for this period
          const existingEntry = await tx.assetDepreciation.findUnique({
            where: {
              assetId_periodYear_periodMonth: {
                assetId: asset.id,
                periodYear,
                periodMonth,
              },
            },
          });

          // Get Gl account codes for this asset's category
          const glDepreciationAccount =
            asset.category?.glDepreciationAccount?.code;
          const glAccumulatedDepreciationAccount =
            asset.category?.glAccumulatedDepreciationAccount?.code;

          if (existingEntry) {
            continue; // Skip if already calculated
          }

          const calculation = await this.calculateDepreciation(
            asset.id,
            periodYear,
            periodMonth,
          );

          if (calculation.depreciationAmount > 0) {
            const journalId = await glService.postJournal(
              tx,
              [
                {
                  accountCode: glDepreciationAccount, // Depreciation Expense
                  debit: calculation.depreciationAmount,
                  credit: 0,
                  refType: "DEPRECIATION",
                  refId: asset.id,
                },
                {
                  accountCode: glAccumulatedDepreciationAccount, // Accumulated Depreciation
                  debit: 0,
                  credit: calculation.depreciationAmount,
                  refType: "DEPRECIATION",
                  refId: asset.id,
                },
              ],
              `Depreciation for ${periodYear}-${String(periodMonth).padStart(2, "0")}: ${asset.assetNo} - ${asset.name}`,
              userId,
              transactionDate,
            );

            const entry = await tx.assetDepreciation.create({
              data: {
                assetId: asset.id,
                periodYear,
                periodMonth,
                depreciationAmount: new Decimal(calculation.depreciationAmount),
                accumulatedDepreciation: new Decimal(
                  calculation.accumulatedDepreciation,
                ),
                netBookValue: new Decimal(calculation.netBookValue),
                journalId,
                isPosted: true,
                postedAt: new Date(transactionDate),
              },
            });

            depreciationEntries.push(entry);
            totalDepreciation += calculation.depreciationAmount;
          }
        }

        return {
          processedAssets: depreciationEntries.length,
          totalDepreciation,
          entries: depreciationEntries,
        };
      },
      {
        maxWait: 5000, // 5s wait for connection
        timeout: 20000, // 20s max runtime
      },
    );
  }

  async reverseDepreciation(data: any, userId: string) {
    const { periodYear, periodMonth, assetIds } = data;

    //derived first day of the month from the period year and month

    const periodStartDate = new Date(periodYear, periodMonth - 1, 1);
    console.log(`periodStartDate: ${periodStartDate}`);

    return await prisma.$transaction(
      async (tx) => {
        // 1. Get assets that were included in the depreciation run
        const whereAsset: any = { status: "ACTIVE" };
        if (assetIds && assetIds.length > 0) {
          whereAsset.id = { in: assetIds };
        }

        const assets = await tx.asset.findMany({
          where: whereAsset,
          include: {
            category: {
              include: {
                glDepreciationAccount: true,
                glAccumulatedDepreciationAccount: true,
              },
            },
          },
        });

        const assetIdsToReverse = assets.map((a) => a.id);

        // 2. Find existing depreciation entries for the period
        const existingEntries = await tx.assetDepreciation.findMany({
          where: {
            assetId: { in: assetIdsToReverse },
            periodYear,
            periodMonth,
          },
        });

        if (existingEntries.length === 0) {
          console.log(
            `No depreciation entries found for period ${periodYear}-${periodMonth} to reverse.`,
          );
          return {
            reversedAssets: 0,
            totalReversedAmount: 0,
            message: "No depreciation entries found for this period to reverse",
          };
        }

        let totalReversedAmount = 0;
        const entryIdsToDelete = [];

        for (const entry of existingEntries) {
          const asset = assets.find((a) => a.id === entry.assetId);
          if (!asset) continue;

          const depreciationAmount = Number(entry.depreciationAmount);
          if (depreciationAmount > 0) {
            const glDepreciationAccount =
              asset.category?.glDepreciationAccount?.code;
            const glAccumulatedDepreciationAccount =
              asset.category?.glAccumulatedDepreciationAccount?.code;
            // console.log(
            //   `Depreciation accounts ${glDepreciationAccount} and ${glAccumulatedDepreciationAccount} for asset ${asset.assetNo} - ${asset.name}`,
            // );
            // console.log(
            //   `Reversing depreciation for asset ${asset.assetNo} - ${asset.name} for period ${periodYear}-${periodMonth}`,
            // );
            // 3. Post a reversing GL journal entry (swapping debit and credit)
            await glService.postJournal(
              tx,
              [
                {
                  accountCode: glDepreciationAccount,
                  debit: 0,
                  credit: depreciationAmount, // Swap: credit the expense account to reduce it
                  refType: "REVERSED_DEPRECIATION",
                  refId: `${periodYear}-${periodMonth}`,
                },
                {
                  accountCode: glAccumulatedDepreciationAccount,
                  debit: depreciationAmount, // Swap: debit the accumulated depreciation account to reduce it
                  credit: 0,
                  refType: "REVERSED_DEPRECIATION",
                  refId: `${periodYear}-${periodMonth}`,
                },
              ],
              `Reverse Depreciation for ${periodYear}-${String(periodMonth).padStart(2, "0")}`,
              userId,
              periodStartDate, // Use the first day of the month for the reversing entry date
            );

            totalReversedAmount += depreciationAmount;
          }

          entryIdsToDelete.push(entry.id);
        }
        console.log(`Total reversed amount so far: ${totalReversedAmount}`);

        // 4. Delete the AssetDepreciation records to allow recalculation in the future
        if (entryIdsToDelete.length > 0) {
          // console.log(
          //   `Deleting AssetDepreciation records: ${entryIdsToDelete.join(", ")}`,
          // );
          await tx.assetDepreciation.deleteMany({
            where: {
              id: { in: entryIdsToDelete },
            },
          });
        }

        return {
          reversedAssets: entryIdsToDelete.length,
          totalReversedAmount,
          message: "Depreciation successfully reversed",
        };
      },
      {
        maxWait: 5000,
        timeout: 20000,
      },
    );
  }

  // Asset Disposal
  async disposeAsset(assetId: string, data: any, userId: string) {
    return await prisma.$transaction(
      async (tx) => {
        const asset = await tx.asset.findUnique({
          where: { id: assetId },
          include: {
            category: {
              include: {
                glAssetAccount: true,
                glAccumulatedDepreciationAccount: true,
              },
            },
            depreciationEntries: {
              orderBy: [
                { periodYear: "desc" },
                { periodMonth: "desc" },
                { createdAt: "desc" },
              ],
              take: 1,
            },
          },
        });

        if (!asset) {
          throw new Error("Asset not found");
        }

        if (asset.status !== "ACTIVE") {
          throw new Error("Asset is not active");
        }

        // Calculate current book value
        const acquisitionCost = Number(asset.acquisitionCost);
        const accumulatedDepreciation =
          asset.depreciationEntries.length > 0
            ? Number(asset.depreciationEntries[0].accumulatedDepreciation)
            : 0;
        const netBookValue = acquisitionCost - accumulatedDepreciation;
        const disposalAmount = Number(data.disposalAmount);
        const gainLoss = disposalAmount - netBookValue;

        // Create disposal record
        const disposal = await tx.assetDisposal.create({
          data: {
            assetId,
            disposalDate: new Date(data.disposalDate),
            disposalAmount: new Decimal(disposalAmount),
            disposalMethod: data.disposalMethod,
            buyerDetails: data.buyerDetails,
            gainLoss: new Decimal(gainLoss),
            notes: data.notes,
            disposedBy: userId,
          },
        });

        // Update asset status
        await tx.asset.update({
          where: { id: assetId },
          data: {
            status: data.disposalMethod === "SALE" ? "SOLD" : "DISPOSED",
            disposalDate: new Date(data.disposalDate),
            disposalAmount: new Decimal(disposalAmount),
            disposalMethod: data.disposalMethod,
          },
        });

        // Post disposal to GL
        const journalEntries = [
          // Debit Cash/Bank for disposal proceeds
          {
            accountCode: "1100",
            debit: disposalAmount,
            credit: 0,
            refType: "ASSET_DISPOSAL",
            refId: disposal.id,
          },
          // Debit Accumulated Depreciation
          {
            accountCode: asset.category.glAccumulatedDepreciationAccount.code,
            debit: accumulatedDepreciation,
            credit: 0,
            refType: "ASSET_DISPOSAL",
            refId: disposal.id,
          },
          // Credit Asset Account
          {
            accountCode: asset.category.glAssetAccount.code,
            debit: 0,
            credit: acquisitionCost,
            refType: "ASSET_DISPOSAL",
            refId: disposal.id,
          },
        ];

        // Add gain/loss entry
        if (gainLoss !== 0) {
          if (gainLoss > 0) {
            // Gain on disposal
            journalEntries.push({
              accountCode: "4700",
              debit: 0,
              credit: Math.abs(gainLoss),
              refType: "ASSET_DISPOSAL",
              refId: disposal.id,
            });
          } else {
            // Loss on disposal
            journalEntries.push({
              accountCode: "6400",
              debit: Math.abs(gainLoss),
              credit: 0,
              refType: "ASSET_DISPOSAL",
              refId: disposal.id,
            });
          }
        }

        const journalId = await glService.postJournal(
          tx,
          journalEntries,
          `Asset disposal: ${asset.name} - ${data.disposalMethod}`,
          userId,
        );

        // Update disposal with journal reference
        await tx.assetDisposal.update({
          where: { id: disposal.id },
          data: { journalId },
        });

        return disposal;
      },
      {
        maxWait: 5000, // 5s wait for connection
        timeout: 20000, // 20s max runtime
      },
    );
  }

  async recapitalizeAsset(data: any, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id: data.assetId },
        include: { category: { include: { glAssetAccount: true } } },
      });

      if (!asset) {
        throw new Error("Asset not found");
      }
      if (asset.status !== "ACTIVE") {
        throw new Error("Only active assets can be recapitalized");
      }

      // const amount = Number(data.amount);
      // if (amount.lte(0)) {
      //   throw new Error("Amount must be positive");
      // }

      const previousAcquisitionCost = asset.acquisitionCost;
      const newAcquisitionCost = previousAcquisitionCost.add(data.amount);

      const previousUsefulLife = asset.usefulLife;
      const usefulLifeExtension = data.usefulLifeExtension
        ? Number(data.usefulLifeExtension)
        : 0;
      const newUsefulLife = previousUsefulLife + usefulLifeExtension;

      // Update the asset — increases the depreciable base and (optionally) useful life
      const updatedAsset = await tx.asset.update({
        where: { id: asset.id },
        data: {
          acquisitionCost: newAcquisitionCost,
          usefulLife: newUsefulLife,
        },
      });

      const assetAccountCode = asset.category.glAssetAccount.code;
      let creditAccountCode: string;
      let sourceAccountId: string | null = null;

      if (!data.sourceAccountId) {
        throw new Error("sourceAccountId is required ");
      }
      const sourceAccount = await tx.chartOfAccount.findUnique({
        where: { id: data.sourceAccountId },
      });
      if (!sourceAccount) {
        throw new Error("Source expense account not found");
      }
      creditAccountCode = sourceAccount.code;
      sourceAccountId = sourceAccount.id;

      const cashAccount = await tx.cashAccount.findFirst({
        where: {
          glAccountId: sourceAccountId,
        },
      });

      if (cashAccount) {
        if (data.amount > 0) {
          await tx.cashAccount.update({
            where: { id: cashAccount.id },
            data: {
              balance: {
                decrement: data.amount,
              },
            },
          });
        }
      }

      const journalId = await glService.postJournal(
        tx,
        [
          {
            accountCode: assetAccountCode,
            debit: data.amount,
            credit: 0,
            refType: "ASSET_RECAPITALIZATION",
            refId: asset.id,
          },
          {
            accountCode: creditAccountCode,
            debit: 0,
            credit: data.amount,
            refType: "ASSET_RECAPITALIZATION",
            refId: asset.id,
          },
        ],
        `Asset recapitalization: ${data.description}`,
        userId,
      );

      const recap = await tx.assetRecapitalization.create({
        data: {
          assetId: asset.id,
          transactionDate: new Date(data.transactionDate),
          description: data.description,
          amount: data.amount,
          transactionType: data.transactionType,
          usefulLifeExtension,
          previousAcquisitionCost,
          newAcquisitionCost,
          previousUsefulLife,
          newUsefulLife,
          sourceAccountId,
          journalId,
          createdBy: userId,
        },
      });

      return { asset: updatedAsset, recapitalization: recap };
    });
  }

  // Asset Register Report
  async getAssetRegister(filters: any = {}) {
    let {
      page = 1,
      limit = 10,
      categoryId,
      status,
      locationId,
      asOfDate,
    } = filters;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Match getAssets filtering behavior
    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (status && status !== "ALL") {
      where.status = status.toUpperCase();
    }

    if (locationId && locationId !== "ALL") {
      where.locationId = locationId;
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              code: true,
              name: true,
              depreciationMethod: true,
            },
          },
          location: {
            select: {
              code: true,
              name: true,
            },
          },
          depreciationEntries: {
            where: asOfDate
              ? {
                  OR: [
                    {
                      periodYear: {
                        lt: new Date(asOfDate).getFullYear(),
                      },
                    },
                    {
                      AND: [
                        {
                          periodYear: new Date(asOfDate).getFullYear(),
                        },
                        {
                          periodMonth: {
                            lte: new Date(asOfDate).getMonth() + 1,
                          },
                        },
                      ],
                    },
                  ],
                }
              : undefined,
            orderBy: [
              {
                periodYear: "desc",
              },
              {
                periodMonth: "desc",
              },
              {
                createdAt: "desc",
              },
            ],
            take: 1,
          },
        },
        orderBy: [
          {
            category: {
              code: "asc",
            },
          },
          {
            assetNo: "asc",
          },
        ],
      }),

      prisma.asset.count({
        where,
      }),
    ]);

    const transformedAssets = assets.map((asset) => {
      const accumulatedDepreciation =
        asset.depreciationEntries.length > 0
          ? Number(asset.depreciationEntries[0].accumulatedDepreciation)
          : 0;

      return {
        ...asset,
        accumulatedDepreciation,
        netBookValue: Number(asset.acquisitionCost) - accumulatedDepreciation,
      };
    });

    //console.log(`transformedAssets ${transformedAssets}`);

    return {
      assets: transformedAssets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Depreciation Schedule
  async getDepreciationSchedule(assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        depreciationEntries: {
          orderBy: [{ periodYear: "asc" }, { periodMonth: "asc" }],
        },
      },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    return {
      asset,
      schedule: asset.depreciationEntries,
    };
  }

  // Asset Valuation Summary
  async getAssetValuation(asOfDate?: string) {
    const cutoffDate = asOfDate ? new Date(asOfDate) : new Date();
    const cutoffYear = cutoffDate.getFullYear();
    const cutoffMonth = cutoffDate.getMonth() + 1;

    const assets = await prisma.asset.findMany({
      where: {
        status: "ACTIVE",
        acquisitionDate: { lte: cutoffDate },
      },
      include: {
        category: { select: { code: true, name: true } },
        depreciationEntries: {
          where: {
            OR: [
              { periodYear: { lt: cutoffYear } },
              {
                AND: [
                  { periodYear: cutoffYear },
                  { periodMonth: { lte: cutoffMonth } },
                ],
              },
            ],
          },
          orderBy: [
            { periodYear: "desc" },
            { periodMonth: "desc" },
            { createdAt: "desc" },
          ],
          take: 1,
        },
      },
    });

    let totalCost = 0;
    let totalAccumulatedDepreciation = 0;
    let totalNetBookValue = 0;

    const valuation = assets.map((asset) => {
      const cost = Number(asset.acquisitionCost);
      const accumulated =
        asset.depreciationEntries.length > 0
          ? Number(asset.depreciationEntries[0].accumulatedDepreciation)
          : 0;
      const netBook = cost - accumulated;

      totalCost += cost;
      totalAccumulatedDepreciation += accumulated;
      totalNetBookValue += netBook;

      return {
        assetNo: asset.assetNo,
        name: asset.name,
        category: asset.category,
        acquisitionCost: cost,
        accumulatedDepreciation: accumulated,
        netBookValue: netBook,
      };
    });

    return {
      valuation,
      summary: {
        totalCost,
        totalAccumulatedDepreciation,
        totalNetBookValue,
        assetCount: assets.length,
      },
      asOfDate: cutoffDate,
    };
  }
}
