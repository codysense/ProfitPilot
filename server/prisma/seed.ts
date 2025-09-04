import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create permissions first
  const permissions = await Promise.all([
    // Inventory permissions
    prisma.permission.upsert({
      where: { name: 'inventory.item.read' },
      update: {},
      create: {
        name: 'inventory.item.read',
        resource: 'inventory',
        action: 'read',
        description: 'Read inventory items'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'inventory.item.create' },
      update: {},
      create: {
        name: 'inventory.item.create',
        resource: 'inventory',
        action: 'create',
        description: 'Create inventory items'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'inventory.bom.read' },
      update: {},
      create: {
        name: 'inventory.bom.read',
        resource: 'inventory',
        action: 'read',
        description: 'Read BOMs'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'inventory.bom.create' },
      update: {},
      create: {
        name: 'inventory.bom.create',
        resource: 'inventory',
        action: 'create',
        description: 'Create BOMs'
      }
    }),
    // Sales permissions
    prisma.permission.upsert({
      where: { name: 'sales.order.read' },
      update: {},
      create: {
        name: 'sales.order.read',
        resource: 'sales',
        action: 'read',
        description: 'Read sales orders'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'sales.order.create' },
      update: {},
      create: {
        name: 'sales.order.create',
        resource: 'sales',
        action: 'create',
        description: 'Create sales orders'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'sales.customer.read' },
      update: {},
      create: {
        name: 'sales.customer.read',
        resource: 'sales',
        action: 'read',
        description: 'Read customers'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'sales.customer.create' },
      update: {},
      create: {
        name: 'sales.customer.create',
        resource: 'sales',
        action: 'create',
        description: 'Create customers'
      }
    }),
    // Purchase permissions
    prisma.permission.upsert({
      where: { name: 'purchase.order.read' },
      update: {},
      create: {
        name: 'purchase.order.read',
        resource: 'purchase',
        action: 'read',
        description: 'Read purchase orders'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'purchase.order.create' },
      update: {},
      create: {
        name: 'purchase.order.create',
        resource: 'purchase',
        action: 'create',
        description: 'Create purchase orders'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'purchase.vendor.read' },
      update: {},
      create: {
        name: 'purchase.vendor.read',
        resource: 'purchase',
        action: 'read',
        description: 'Read vendors'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'purchase.vendor.create' },
      update: {},
      create: {
        name: 'purchase.vendor.create',
        resource: 'purchase',
        action: 'create',
        description: 'Create vendors'
      }
    }),
    // Production permissions
    prisma.permission.upsert({
      where: { name: 'production.order.read' },
      update: {},
      create: {
        name: 'production.order.read',
        resource: 'production',
        action: 'read',
        description: 'Read production orders'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'production.order.create' },
      update: {},
      create: {
        name: 'production.order.create',
        resource: 'production',
        action: 'create',
        description: 'Create production orders'
      }
    }),
    prisma.permission.upsert({
      where: { name: 'production.order.release' },
      update: {},
      create: {
        name: 'production.order.release',
        resource: 'production',
        action: 'release',
        description: 'Release production orders'
      }
    })
  ]);

  console.log('✅ Permissions created');

  // Create roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'Account Officer' },
      update: {},
      create: {
        name: 'Account Officer',
        description: 'Basic accounting operations'
      }
    }),
    prisma.role.upsert({
      where: { name: 'CFO' },
      update: {},
      create: {
        name: 'CFO',
        description: 'Chief Financial Officer with full access'
      }
    }),
    prisma.role.upsert({
      where: { name: 'General Manager' },
      update: {},
      create: {
        name: 'General Manager',
        description: 'General Manager with production control'
      }
    })
  ]);

  console.log('✅ Roles created');

  // Assign permissions to roles
  // Account Officer permissions
  const accountOfficerPermissions = [
    'sales.order.read', 'sales.order.create', 'sales.customer.read', 'sales.customer.create',
    'purchase.order.read', 'purchase.order.create', 'purchase.vendor.read', 'purchase.vendor.create',
    'inventory.item.read'
  ];

  for (const permissionName of accountOfficerPermissions) {
    const permission = permissions.find(p => p.name === permissionName);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roles[0].id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: roles[0].id,
          permissionId: permission.id
        }
      });
    }
  }

  // CFO permissions (all permissions)
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles[1].id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: roles[1].id,
        permissionId: permission.id
      }
    });
  }

  // General Manager permissions (all permissions)
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles[2].id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: roles[2].id,
        permissionId: permission.id
      }
    });
  }

  console.log('✅ Role permissions assigned');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'officer@company.com' },
      update: {},
      create: {
        name: 'Account Officer',
        email: 'officer@company.com',
        password: hashedPassword,
        status: 'ACTIVE'
      }
    }),
    prisma.user.upsert({
      where: { email: 'cfo@company.com' },
      update: {},
      create: {
        name: 'Chief Financial Officer',
        email: 'cfo@company.com',
        password: hashedPassword,
        status: 'ACTIVE'
      }
    }),
    prisma.user.upsert({
      where: { email: 'gm@company.com' },
      update: {},
      create: {
        name: 'General Manager',
        email: 'gm@company.com',
        password: hashedPassword,
        status: 'ACTIVE'
      }
    })
  ]);

  console.log('✅ Users created');

  // Assign roles to users
  await Promise.all([
    prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: users[0].id,
          roleId: roles[0].id
        }
      },
      update: {},
      create: {
        userId: users[0].id,
        roleId: roles[0].id
      }
    }),
    prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: users[1].id,
          roleId: roles[1].id
        }
      },
      update: {},
      create: {
        userId: users[1].id,
        roleId: roles[1].id
      }
    }),
    prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: users[2].id,
          roleId: roles[2].id
        }
      },
      update: {},
      create: {
        userId: users[2].id,
        roleId: roles[2].id
      }
    })
  ]);

  console.log('✅ User roles assigned');

  // Create company
  await prisma.company.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Manufacturing Corp',
      baseCurrency: 'NGN',
      timezone: 'Africa/Lagos',
      address: '123 Industrial Area, Lagos, Nigeria',
      phone: '+234-800-123-4567',
      email: 'info@manufacturingcorp.com'
    }
  });

  console.log('✅ Company created');

  // Create locations
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { code: 'LAG' },
      update: {},
      create: {
        code: 'LAG',
        name: 'Lagos Location',
        address: 'Industrial Area, Lagos',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        isActive: true
      }
    }),
    prisma.location.upsert({
      where: { code: 'ABJ' },
      update: {},
      create: {
        code: 'ABJ',
        name: 'Abuja Location',
        address: 'Industrial Zone, Abuja',
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
        isActive: true
      }
    })
  ]);

  console.log('✅ Locations created');

  // Create warehouses
  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { code: 'MAIN' },
      update: {},
      create: {
        code: 'MAIN',
        name: 'Main Warehouse',
        locationId: locations[0].id,
        address: 'Main Storage Facility, Lagos',
        isActive: true
      }
    }),
    prisma.warehouse.upsert({
      where: { code: 'PROD' },
      update: {},
      create: {
        code: 'PROD',
        name: 'Production Warehouse',
        locationId: locations[0].id,
        address: 'Production Floor, Lagos',
        isActive: true
      }
    })
  ]);

  console.log('✅ Warehouses created');

  // Create items
  const items = await Promise.all([
    // Raw Materials
    prisma.item.upsert({
      where: { sku: 'RM-STEEL-001' },
      update: {},
      create: {
        sku: 'RM-STEEL-001',
        name: 'Steel Sheet 2mm',
        description: 'High quality steel sheet for manufacturing',
        type: 'RAW_MATERIAL',
        uom: 'SQM',
        costingMethod: 'WEIGHTED_AVG',
        standardCost: 2500.00,
        isActive: true
      }
    }),
    prisma.item.upsert({
      where: { sku: 'RM-ALUM-001' },
      update: {},
      create: {
        sku: 'RM-ALUM-001',
        name: 'Aluminum Rod 10mm',
        description: 'Aluminum rod for component manufacturing',
        type: 'RAW_MATERIAL',
        uom: 'MTR',
        costingMethod: 'WEIGHTED_AVG',
        standardCost: 150.00,
        isActive: true
      }
    }),
    prisma.item.upsert({
      where: { sku: 'RM-BOLT-001' },
      update: {},
      create: {
        sku: 'RM-BOLT-001',
        name: 'Steel Bolts M8',
        description: 'M8 steel bolts for assembly',
        type: 'RAW_MATERIAL',
        uom: 'PCS',
        costingMethod: 'WEIGHTED_AVG',
        standardCost: 5.00,
        isActive: true
      }
    }),
    // Finished Goods
    prisma.item.upsert({
      where: { sku: 'FG-CAB-001' },
      update: {},
      create: {
        sku: 'FG-CAB-001',
        name: 'Metal Filing Cabinet',
        description: '4-drawer metal filing cabinet',
        type: 'FINISHED_GOODS',
        uom: 'PCS',
        costingMethod: 'WEIGHTED_AVG',
        standardCost: 15000.00,
        sellingPrice: 25000.00,
        isActive: true
      }
    }),
    prisma.item.upsert({
      where: { sku: 'FG-DESK-001' },
      update: {},
      create: {
        sku: 'FG-DESK-001',
        name: 'Office Desk Standard',
        description: 'Standard office desk with drawers',
        type: 'FINISHED_GOODS',
        uom: 'PCS',
        costingMethod: 'WEIGHTED_AVG',
        standardCost: 12000.00,
        sellingPrice: 20000.00,
        isActive: true
      }
    })
  ]);

  console.log('✅ Items created');

  // Create customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { code: 'CUST-001' },
      update: {},
      create: {
        code: 'CUST-001',
        name: 'ABC Corporation Ltd',
        address: '123 Business District, Victoria Island, Lagos',
        phone: '+234-801-234-5678',
        email: 'procurement@abc-corp.com',
        creditLimit: 500000.00,
        paymentTerms: 'Net 30',
        isActive: true
      }
    }),
    prisma.customer.upsert({
      where: { code: 'CUST-002' },
      update: {},
      create: {
        code: 'CUST-002',
        name: 'XYZ Enterprises',
        address: '456 Industrial Layout, Ikeja, Lagos',
        phone: '+234-802-345-6789',
        email: 'orders@xyz-ent.com',
        creditLimit: 300000.00,
        paymentTerms: 'Net 15',
        isActive: true
      }
    })
  ]);

  console.log('✅ Customers created');

  // Create vendors
  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { code: 'VEND-001' },
      update: {},
      create: {
        code: 'VEND-001',
        name: 'Steel Suppliers Nigeria Ltd',
        address: '789 Industrial Zone, Port Harcourt',
        phone: '+234-803-456-7890',
        email: 'sales@steelsuppliers.ng',
        paymentTerms: 'Net 30',
        isActive: true
      }
    }),
    prisma.vendor.upsert({
      where: { code: 'VEND-002' },
      update: {},
      create: {
        code: 'VEND-002',
        name: 'Aluminum Works Ltd',
        address: '321 Metal Street, Kano',
        phone: '+234-804-567-8901',
        email: 'info@aluminumworks.ng',
        paymentTerms: 'Net 45',
        isActive: true
      }
    })
  ]);

  console.log('✅ Vendors created');

  // Create Chart of Accounts
  const accounts = await Promise.all([
    // Assets
    prisma.chartOfAccount.upsert({
      where: { code: '1000' },
      update: {},
      create: {
        code: '1000',
        name: 'Current Assets',
        accountType: 'ASSET',
        isActive: true
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { code: '1100' },
      update: {},
      create: {
        code: '1100',
        name: 'Cash and Bank',
        accountType: 'ASSET',
        parentId: null, // Will be updated after creation
        isActive: true
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { code: '1200' },
      update: {},
      create: {
        code: '1200',
        name: 'Accounts Receivable',
        accountType: 'ASSET',
        isActive: true
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { code: '1300' },
      update: {},
      create: {
        code: '1300',
        name: 'Raw Materials Inventory',
        accountType: 'ASSET',
        isActive: true
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { code: '1350' },
      update: {},
      create: {
        code: '1350',
        name: 'Finished Goods Inventory',
        accountType: 'ASSET',
        isActive: true
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { code: '1400' },
      update: {},
      create: {
        code: '1400',
        name: 'Work in Progress',
        accountType: 'ASSET',
        isActive: true
      }
    }),
    // Liabilities
    prisma.chartOfAccount.upsert({
      where: { code: '2000' },
      update: {},
      create: {
        code: '2000',
        name: 'Accounts Payable',
        accountType: 'LIABILITY',
        isActive: true
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { code: '2100' },
      update: {},
      create: {
        code: '2100',
        name: 'Wages Payable',
        accountType: 'LIABILITY',
        isActive: true
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { code: '2150' },
      update: {},
      create: {
        code: '2150',
        name: 'Goods Received Not Invoiced',
        accountType: 'LIABILITY',
        isActive: true
      }
    }),
    // Revenue
    prisma.chartOfAccount.upsert({
      where: { code: '4000' },
      update: {},
      create: {
        code: '4000',
        name: 'Sales Revenue',
        accountType: 'REVENUE',
        isActive: true
      }
    }),
    // Expenses
    prisma.chartOfAccount.upsert({
      where: { code: '5000' },
      update: {},
      create: {
        code: '5000',
        name: 'Cost of Goods Sold',
        accountType: 'EXPENSE',
        isActive: true
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { code: '5150' },
      update: {},
      create: {
        code: '5150',
        name: 'Scrap Loss',
        accountType: 'EXPENSE',
        isActive: true
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { code: '5200' },
      update: {},
      create: {
        code: '5200',
        name: 'Manufacturing Overhead Absorbed',
        accountType: 'EXPENSE',
        isActive: true
      }
    }),
    prisma.chartOfAccount.upsert({
      where: { code: '8100' },
      update: {},
      create: {
        code: '8100',
        name: 'Inventory Adjustments',
        accountType: 'EXPENSE',
        isActive: true
      }
    })
  ]);

  console.log('✅ Chart of Accounts created');

  // Create a BOM for the filing cabinet
  const bom = await prisma.bom.create({
    data: {
      itemId: items[3].id, // Metal Filing Cabinet
      version: '1.0',
      isActive: true,
      bomLines: {
        create: [
          {
            componentItemId: items[0].id, // Steel Sheet
            qtyPer: 2.5,
            scrapPercent: 5.0
          },
          {
            componentItemId: items[1].id, // Aluminum Rod
            qtyPer: 1.0,
            scrapPercent: 3.0
          },
          {
            componentItemId: items[2].id, // Steel Bolts
            qtyPer: 20.0,
            scrapPercent: 2.0
          }
        ]
      }
    }
  });

  console.log('✅ Bill of Materials created');

  // Create initial inventory for raw materials
  const initialInventory = [
    {
      itemId: items[0].id, // Steel Sheet
      warehouseId: warehouses[0].id,
      qty: 100.0,
      unitCost: 2500.00
    },
    {
      itemId: items[1].id, // Aluminum Rod
      warehouseId: warehouses[0].id,
      qty: 200.0,
      unitCost: 150.00
    },
    {
      itemId: items[2].id, // Steel Bolts
      warehouseId: warehouses[0].id,
      qty: 1000.0,
      unitCost: 5.00
    }
  ];

  for (const inv of initialInventory) {
    const value = inv.qty * inv.unitCost;
    
    await prisma.inventoryLedger.create({
      data: {
        itemId: inv.itemId,
        warehouseId: inv.warehouseId,
        refType: 'OPENING_BALANCE',
        refId: 'OPENING',
        direction: 'IN',
        qty: inv.qty,
        unitCost: inv.unitCost,
        value: value,
        runningQty: inv.qty,
        runningValue: value,
        runningAvgCost: inv.unitCost
      }
    });

    // Create inventory batch for FIFO costing
    await prisma.inventoryBatch.create({
      data: {
        itemId: inv.itemId,
        warehouseId: inv.warehouseId,
        qtyOnHand: inv.qty,
        unitCost: inv.unitCost,
        receivedAt: new Date()
      }
    });
  }

  console.log('✅ Initial inventory created');

  // Set global costing policy
  await prisma.policy.upsert({
    where: { key: 'global_costing_method' },
    update: {},
    create: {
      key: 'global_costing_method',
      valueJson: 'WEIGHTED_AVG'
    }
  });

  console.log('✅ Policies created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Demo Login Credentials:');
  console.log('Account Officer: officer@company.com / password123');
  console.log('CFO: cfo@company.com / password123');
  console.log('General Manager: gm@company.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });