const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Check if already seeded
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding Azoury database...');

  // Clean up existing data in reverse dependency order
  await prisma.activityLog.deleteMany();
  await prisma.spotCheck.deleteMany();
  await prisma.returnAmendment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.dispatchPhoto.deleteMany();
  await prisma.dispatchItem.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.wasteEntry.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.clientOrder.deleteMany();
  await prisma.supplierReceipt.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.priceSurvey.deleteMany();
  await prisma.supplierRating.deleteMany();
  await prisma.fleetMaintenance.deleteMany();
  await prisma.fleetVehicle.deleteMany();
  await prisma.qualityGrade.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  // ========== CLIENTS ==========
  console.log('Creating clients...');
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        businessName: 'Lebanese Bistro',
        businessType: 'RESTAURANT',
        contactPerson: 'Nadia Khoury',
        email: 'info@lebanese-bistro.com',
        phone: '+961-1-234567',
        address: '45 Rue Gouraud, Gemmayzeh, Beirut',
        isApproved: true,
      },
    }),
    prisma.client.create({
      data: {
        businessName: 'FreshMart',
        businessType: 'SUPERMARKET',
        contactPerson: 'Samir Haddad',
        email: 'purchasing@freshmart.lb',
        phone: '+961-1-345678',
        address: '120 Bliss Street, Hamra, Beirut',
        isApproved: true,
      },
    }),
    prisma.client.create({
      data: {
        businessName: 'Green Grocer',
        businessType: 'GROCERY',
        contactPerson: 'Rima Aoun',
        email: 'orders@greengrocer.lb',
        phone: '+961-1-456789',
        address: '78 Sassine Square, Achrafieh, Beirut',
        isApproved: true,
      },
    }),
  ]);

  // ========== USERS ==========
  console.log('Creating users...');
  const users = {};

  // Super Admin
  users.superAdmin = await prisma.user.create({
    data: {
      email: 'admin@azoury.com',
      password: hashedPassword,
      firstName: 'Karim',
      lastName: 'Azoury',
      role: 'SUPER_ADMIN',
      phone: '+961-3-100001',
    },
  });

  // Internal roles
  users.purchaseManager = await prisma.user.create({
    data: {
      email: 'purchasing@azoury.com',
      password: hashedPassword,
      firstName: 'Hassan',
      lastName: 'Makki',
      role: 'PURCHASE_MANAGER',
      phone: '+961-3-100002',
    },
  });

  users.opsManager = await prisma.user.create({
    data: {
      email: 'operations@azoury.com',
      password: hashedPassword,
      firstName: 'Lara',
      lastName: 'Fares',
      role: 'OPERATIONS_MANAGER',
      phone: '+961-3-100003',
    },
  });

  users.qcControl = await prisma.user.create({
    data: {
      email: 'quality@azoury.com',
      password: hashedPassword,
      firstName: 'Georges',
      lastName: 'Chamoun',
      role: 'QUALITY_COST_CONTROL',
      phone: '+961-3-100004',
    },
  });

  users.receiving = await prisma.user.create({
    data: {
      email: 'receiving@azoury.com',
      password: hashedPassword,
      firstName: 'Ahmad',
      lastName: 'Saleh',
      role: 'RECEIVING',
      phone: '+961-3-100005',
    },
  });

  users.logistics = await prisma.user.create({
    data: {
      email: 'logistics@azoury.com',
      password: hashedPassword,
      firstName: 'Tony',
      lastName: 'Nassar',
      role: 'LOGISTICS_TEAM',
      phone: '+961-3-100006',
    },
  });

  users.driver1 = await prisma.user.create({
    data: {
      email: 'driver1@azoury.com',
      password: hashedPassword,
      firstName: 'Bilal',
      lastName: 'Rahme',
      role: 'DRIVER',
      phone: '+961-3-100007',
    },
  });

  users.driver2 = await prisma.user.create({
    data: {
      email: 'driver2@azoury.com',
      password: hashedPassword,
      firstName: 'Fadi',
      lastName: 'Massaad',
      role: 'DRIVER',
      phone: '+961-3-100008',
    },
  });

  users.accountant = await prisma.user.create({
    data: {
      email: 'accounting@azoury.com',
      password: hashedPassword,
      firstName: 'Maya',
      lastName: 'Rizk',
      role: 'ACCOUNTANT',
      phone: '+961-3-100009',
    },
  });

  // Client Admin users
  users.clientAdmin1 = await prisma.user.create({
    data: {
      email: 'nadia@lebanese-bistro.com',
      password: hashedPassword,
      firstName: 'Nadia',
      lastName: 'Khoury',
      role: 'CLIENT_ADMIN',
      phone: '+961-3-200001',
      clientId: clients[0].id,
    },
  });

  users.clientAdmin2 = await prisma.user.create({
    data: {
      email: 'samir@freshmart.lb',
      password: hashedPassword,
      firstName: 'Samir',
      lastName: 'Haddad',
      role: 'CLIENT_ADMIN',
      phone: '+961-3-200002',
      clientId: clients[1].id,
    },
  });

  // Client Staff users
  users.clientStaff1 = await prisma.user.create({
    data: {
      email: 'chef@lebanese-bistro.com',
      password: hashedPassword,
      firstName: 'Pierre',
      lastName: 'Abi Nader',
      role: 'CLIENT_STAFF',
      phone: '+961-3-200003',
      clientId: clients[0].id,
    },
  });

  users.clientStaff2 = await prisma.user.create({
    data: {
      email: 'inventory@freshmart.lb',
      password: hashedPassword,
      firstName: 'Dina',
      lastName: 'Awad',
      role: 'CLIENT_STAFF',
      phone: '+961-3-200004',
      clientId: clients[1].id,
    },
  });

  users.clientStaff3 = await prisma.user.create({
    data: {
      email: 'rima@greengrocer.lb',
      password: hashedPassword,
      firstName: 'Rima',
      lastName: 'Aoun',
      role: 'CLIENT_STAFF',
      phone: '+961-3-200005',
      clientId: clients[2].id,
    },
  });

  // ========== PRODUCTS ==========
  console.log('Creating products...');
  const productDefs = [
    // FRUITS
    { name: 'Bananas', category: 'FRUITS', unit: 'kg', description: 'Fresh yellow bananas' },
    { name: 'Apples (Red Delicious)', category: 'FRUITS', unit: 'kg', description: 'Crisp red delicious apples' },
    { name: 'Oranges (Valencia)', category: 'FRUITS', unit: 'kg', description: 'Juicy Valencia oranges' },
    { name: 'Lemons', category: 'FRUITS', unit: 'kg', description: 'Fresh lemons for cooking and beverages' },
    { name: 'Strawberries', category: 'FRUITS', unit: 'kg', description: 'Fresh local strawberries' },
    // VEGETABLES
    { name: 'Tomatoes (Vine)', category: 'VEGETABLES', unit: 'kg', description: 'Vine-ripened tomatoes' },
    { name: 'Cucumbers', category: 'VEGETABLES', unit: 'kg', description: 'Fresh green cucumbers' },
    { name: 'Lettuce (Iceberg)', category: 'VEGETABLES', unit: 'head', description: 'Crisp iceberg lettuce' },
    { name: 'Onions (Yellow)', category: 'VEGETABLES', unit: 'kg', description: 'Yellow cooking onions' },
    { name: 'Potatoes', category: 'VEGETABLES', unit: 'kg', description: 'All-purpose potatoes' },
    { name: 'Parsley (Flat-Leaf)', category: 'VEGETABLES', unit: 'bunch', description: 'Fresh flat-leaf parsley for tabbouleh' },
    { name: 'Mint', category: 'VEGETABLES', unit: 'bunch', description: 'Fresh mint leaves' },
    { name: 'Bell Peppers (Mixed)', category: 'VEGETABLES', unit: 'kg', description: 'Mixed color bell peppers' },
    { name: 'Eggplant', category: 'VEGETABLES', unit: 'kg', description: 'Fresh eggplant for baba ghanoush' },
    { name: 'Zucchini', category: 'VEGETABLES', unit: 'kg', description: 'Fresh zucchini' },
    // MEATS
    { name: 'Chicken Breast', category: 'MEATS', unit: 'kg', description: 'Boneless skinless chicken breast' },
    { name: 'Ground Beef', category: 'MEATS', unit: 'kg', description: 'Fresh ground beef (80/20)' },
    { name: 'Lamb Leg', category: 'MEATS', unit: 'kg', description: 'Whole lamb leg, bone-in' },
    { name: 'Chicken Thighs', category: 'MEATS', unit: 'kg', description: 'Bone-in chicken thighs' },
    { name: 'Beef Tenderloin', category: 'MEATS', unit: 'kg', description: 'Prime beef tenderloin' },
    // DAIRY
    { name: 'Milk (Full Fat)', category: 'DAIRY', unit: 'liter', description: 'Full fat fresh milk' },
    { name: 'Labneh', category: 'DAIRY', unit: 'kg', description: 'Traditional strained yogurt' },
    { name: 'Halloumi Cheese', category: 'DAIRY', unit: 'kg', description: 'Authentic halloumi cheese' },
    { name: 'Akkawi Cheese', category: 'DAIRY', unit: 'kg', description: 'White akkawi cheese' },
    // DRY_GOODS
    { name: 'Olive Oil (Extra Virgin)', category: 'DRY_GOODS', unit: 'liter', description: 'Lebanese extra virgin olive oil' },
    { name: 'Basmati Rice', category: 'DRY_GOODS', unit: 'kg', description: 'Premium basmati rice' },
    { name: 'Bulgur Wheat', category: 'DRY_GOODS', unit: 'kg', description: 'Fine bulgur for kibbeh and tabbouleh' },
    { name: 'Chickpeas (Dried)', category: 'DRY_GOODS', unit: 'kg', description: 'Dried chickpeas for hummus' },
    { name: 'Red Lentils', category: 'DRY_GOODS', unit: 'kg', description: 'Red lentils for soups' },
    { name: 'Tahini', category: 'DRY_GOODS', unit: 'kg', description: 'Pure sesame tahini paste' },
    // BEVERAGES
    { name: 'Still Water (1.5L)', category: 'BEVERAGES', unit: 'case', description: '12-pack still water' },
    { name: 'Orange Juice (Fresh)', category: 'BEVERAGES', unit: 'liter', description: 'Freshly squeezed orange juice' },
    // FROZEN
    { name: 'Frozen Falafel', category: 'FROZEN', unit: 'kg', description: 'Pre-formed frozen falafel' },
    { name: 'Frozen Peas', category: 'FROZEN', unit: 'kg', description: 'Frozen green peas' },
    { name: 'Frozen Mixed Vegetables', category: 'FROZEN', unit: 'kg', description: 'Frozen vegetable medley' },
  ];

  const products = [];
  for (const def of productDefs) {
    const product = await prisma.product.create({ data: def });
    products.push(product);
  }

  // ========== QUALITY GRADES ==========
  console.log('Creating quality grades...');
  const gradeConfigs = [
    { grade: 'EXTRA', clientFacingGrade: 'EXTRA', priceMultiplier: 1.5 },
    { grade: 'A', clientFacingGrade: 'QUALITY_A', priceMultiplier: 1.2 },
    { grade: 'B', clientFacingGrade: 'QUALITY_A', priceMultiplier: 1.0 },
    { grade: 'C_PLUS_PLUS', clientFacingGrade: 'QUALITY_C', priceMultiplier: 0.8 },
    { grade: 'C', clientFacingGrade: 'QUALITY_C', priceMultiplier: 0.6 },
  ];

  const basePrices = {
    FRUITS: 3.5, VEGETABLES: 2.5, MEATS: 12.0, DAIRY: 5.0,
    DRY_GOODS: 4.0, BEVERAGES: 8.0, FROZEN: 6.0, OTHER: 3.0,
  };

  const qualityGrades = [];
  for (const product of products) {
    const basePrice = basePrices[product.category];
    // Assign 2-4 grades per product
    const numGrades = 2 + Math.floor(Math.random() * 3);
    const selectedGrades = gradeConfigs.slice(0, numGrades);

    for (const gc of selectedGrades) {
      const grade = await prisma.qualityGrade.create({
        data: {
          productId: product.id,
          grade: gc.grade,
          clientFacingGrade: gc.clientFacingGrade,
          price: Math.round(basePrice * gc.priceMultiplier * 100) / 100,
          currentStock: Math.round(50 + Math.random() * 200),
        },
      });
      qualityGrades.push(grade);
    }
  }

  // ========== SUPPLIERS ==========
  console.log('Creating suppliers...');
  const supplierDefs = [
    { name: 'Al-Arz Fresh Produce', contactPerson: 'Walid Sleiman', email: 'walid@alarz.lb', phone: '+961-1-550100', address: 'Bekaa Valley, Lebanon' },
    { name: 'Byblos Farms', contactPerson: 'Joelle Geagea', email: 'joelle@byblosfarms.lb', phone: '+961-1-550200', address: 'Jbeil, Mount Lebanon' },
    { name: 'Saida Seafood & Meats', contactPerson: 'Mohamad Zaatari', email: 'mzaatari@saidameats.lb', phone: '+961-1-550300', address: 'Saida Old Souks, South Lebanon' },
    { name: 'Mount Lebanon Dairy Co.', contactPerson: 'Charbel Karam', email: 'charbel@mtlebdairy.lb', phone: '+961-1-550400', address: 'Keserwan, Mount Lebanon' },
    { name: 'Tripoli Grains & Spices', contactPerson: 'Omar Karami', email: 'omar@tripoligrains.lb', phone: '+961-1-550500', address: 'Khan el-Saboun, Tripoli' },
    { name: 'Cedar Valley Organics', contactPerson: 'Tanya Maalouf', email: 'tanya@cedarvalley.lb', phone: '+961-1-550600', address: 'Batroun, North Lebanon' },
    { name: 'Baalbek Agricultural Supply', contactPerson: 'Ali Nasrallah', email: 'ali@baalbeksupply.lb', phone: '+961-1-550700', address: 'Baalbek, Bekaa Valley' },
    { name: 'Jounieh Cold Chain Co.', contactPerson: 'Michel Daou', email: 'michel@jouniehcold.lb', phone: '+961-1-550800', address: 'Jounieh, Mount Lebanon' },
  ];

  const suppliers = [];
  for (const def of supplierDefs) {
    const supplier = await prisma.supplier.create({
      data: { ...def, rating: Math.round((3 + Math.random() * 2) * 100) / 100 },
    });
    suppliers.push(supplier);
  }

  // ========== FLEET VEHICLES ==========
  console.log('Creating fleet vehicles...');
  const vehicleDefs = [
    { plateNumber: 'B-123456', model: 'Isuzu NQR', type: 'Refrigerated Truck', mileage: 45230, fuelConsumption: 18.5 },
    { plateNumber: 'B-234567', model: 'Mitsubishi Canter', type: 'Refrigerated Van', mileage: 32100, fuelConsumption: 14.2 },
    { plateNumber: 'B-345678', model: 'Toyota Dyna', type: 'Box Truck', mileage: 58700, fuelConsumption: 16.8 },
    { plateNumber: 'B-456789', model: 'Hyundai HD72', type: 'Refrigerated Truck', mileage: 21500, fuelConsumption: 17.1 },
    { plateNumber: 'B-567890', model: 'Mercedes Sprinter', type: 'Refrigerated Van', mileage: 67890, fuelConsumption: 12.5, status: 'MAINTENANCE' },
  ];

  const vehicles = [];
  for (const def of vehicleDefs) {
    const vehicle = await prisma.fleetVehicle.create({
      data: {
        ...def,
        lastMaintenanceDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        nextMaintenanceDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
    vehicles.push(vehicle);
  }

  // ========== FLEET MAINTENANCE ==========
  console.log('Creating fleet maintenance records...');
  for (const vehicle of vehicles) {
    const types = ['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Cooling System Check', 'Filter Replacement'];
    const numRecords = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numRecords; i++) {
      await prisma.fleetMaintenance.create({
        data: {
          vehicleId: vehicle.id,
          type: types[Math.floor(Math.random() * types.length)],
          description: `Routine ${types[Math.floor(Math.random() * types.length)].toLowerCase()} performed`,
          cost: Math.round((50 + Math.random() * 500) * 100) / 100,
          date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          nextDueDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // ========== PURCHASE ORDERS ==========
  console.log('Creating purchase orders...');
  const poStatuses = ['DRAFT', 'SENT', 'RECEIVED', 'VERIFIED'];
  const purchaseOrders = [];

  for (let i = 0; i < 20; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const status = poStatuses[Math.floor(Math.random() * poStatuses.length)];
    const numItems = 2 + Math.floor(Math.random() * 5);

    const poItems = [];
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = 10 + Math.floor(Math.random() * 100);
      const price = Math.round((1 + Math.random() * 15) * 100) / 100;
      poItems.push({
        productId: product.id,
        quantity: qty,
        unitPrice: price,
        receivedQuantity: status === 'RECEIVED' || status === 'VERIFIED' ? qty - Math.floor(Math.random() * 5) : null,
        receivedWeight: status === 'RECEIVED' || status === 'VERIFIED' ? qty * (0.95 + Math.random() * 0.1) : null,
      });
    }

    const totalAmount = poItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId: supplier.id,
        createdById: users.purchaseManager.id,
        status,
        totalAmount: Math.round(totalAmount * 100) / 100,
        notes: i % 3 === 0 ? 'Urgent delivery needed' : null,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        items: { create: poItems },
      },
    });
    purchaseOrders.push(po);
  }

  // ========== CLIENT ORDERS ==========
  console.log('Creating client orders...');
  const orderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
  const statusWeights = [8, 8, 6, 6, 15, 3, 2]; // weighted distribution
  const clientOrders = [];

  function weightedStatus() {
    const total = statusWeights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < orderStatuses.length; i++) {
      r -= statusWeights[i];
      if (r <= 0) return orderStatuses[i];
    }
    return 'PENDING';
  }

  const clientUsers = [users.clientAdmin1, users.clientAdmin2, users.clientStaff1, users.clientStaff2, users.clientStaff3];

  for (let i = 0; i < 50; i++) {
    const clientIdx = Math.floor(Math.random() * clients.length);
    const client = clients[clientIdx];
    const clientUsersForClient = clientUsers.filter((u) => u.clientId === client.id);
    const placedBy = clientUsersForClient.length > 0
      ? clientUsersForClient[Math.floor(Math.random() * clientUsersForClient.length)]
      : users.clientAdmin1;

    const status = weightedStatus();
    const numItems = 1 + Math.floor(Math.random() * 6);
    const daysAgo = Math.floor(Math.random() * 30);
    const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const deliveryDate = new Date(createdDate.getTime() + (1 + Math.floor(Math.random() * 3)) * 24 * 60 * 60 * 1000);

    const orderItems = [];
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const productGrades = qualityGrades.filter((g) => g.productId === product.id);
      if (productGrades.length === 0) continue;
      const grade = productGrades[Math.floor(Math.random() * productGrades.length)];
      const qty = 1 + Math.floor(Math.random() * 30);

      orderItems.push({
        productId: product.id,
        qualityGradeId: grade.id,
        quantity: qty,
        unitPrice: grade.price,
        fulfilledQuantity: status === 'DELIVERED' ? qty : 0,
      });
    }

    if (orderItems.length === 0) continue;

    const totalAmount = orderItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const instructions = [null, 'Please deliver before 9 AM', 'Leave at back entrance', 'Call upon arrival', 'Fragile items, handle with care'];

    const order = await prisma.clientOrder.create({
      data: {
        clientId: client.id,
        placedById: placedBy.id,
        status,
        totalAmount: Math.round(totalAmount * 100) / 100,
        deliveryDate,
        specialInstructions: instructions[Math.floor(Math.random() * instructions.length)],
        createdAt: createdDate,
        items: { create: orderItems },
      },
    });
    clientOrders.push(order);
  }

  // ========== DISPATCHES ==========
  console.log('Creating dispatches...');
  const dispatchableOrders = clientOrders.filter((o) =>
    ['DISPATCHED', 'DELIVERED'].includes(o.status)
  );

  const dispatches = [];
  const drivers = [users.driver1, users.driver2];
  const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE');

  for (let i = 0; i < Math.min(8, Math.ceil(dispatchableOrders.length / 3)); i++) {
    const driver = drivers[i % drivers.length];
    const truck = activeVehicles[i % activeVehicles.length];
    const batchStart = i * 3;
    const batchOrders = dispatchableOrders.slice(batchStart, batchStart + 3).filter(Boolean);

    if (batchOrders.length === 0) continue;

    const isCompleted = batchOrders.every((o) => o.status === 'DELIVERED');
    const departedAt = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000);

    const dispatch = await prisma.dispatch.create({
      data: {
        driverId: driver.id,
        truckId: truck.id,
        status: isCompleted ? 'COMPLETED' : 'IN_TRANSIT',
        routeOrder: batchOrders.map((o, idx) => ({ order: idx + 1, orderId: o.id })),
        departedAt,
        completedAt: isCompleted ? new Date(departedAt.getTime() + 3 * 60 * 60 * 1000) : null,
        items: {
          create: batchOrders.map((o) => ({
            clientOrderId: o.id,
            status: o.status === 'DELIVERED' ? 'DELIVERED' : 'LOADED',
            deliveryNotes: o.status === 'DELIVERED' ? 'Delivered successfully' : null,
          })),
        },
      },
    });
    dispatches.push(dispatch);
  }

  // ========== INVENTORY MOVEMENTS ==========
  console.log('Creating inventory movements...');
  const movementTypes = ['PURCHASE_IN', 'SALE_OUT', 'WASTE', 'ADJUSTMENT', 'RETURN'];

  for (let i = 0; i < 60; i++) {
    const grade = qualityGrades[Math.floor(Math.random() * qualityGrades.length)];
    const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
    const qty = 1 + Math.floor(Math.random() * 50);

    await prisma.inventoryMovement.create({
      data: {
        productId: grade.productId,
        qualityGradeId: grade.id,
        type,
        quantity: qty,
        reference: type === 'PURCHASE_IN' ? `PO-${Math.floor(Math.random() * 1000)}` : type === 'SALE_OUT' ? `Order-${Math.floor(Math.random() * 1000)}` : null,
        notes: type === 'WASTE' ? 'Spoiled product removed' : type === 'ADJUSTMENT' ? 'Stock correction after count' : null,
        createdById: users.receiving.id,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ========== WASTE ENTRIES ==========
  console.log('Creating waste entries...');
  const wasteReasons = [
    'Product expired on shelf',
    'Damaged during receiving',
    'Failed quality inspection',
    'Temperature abuse during transit',
    'Overripe, unsellable',
    'Packaging damaged',
    'Customer return - quality issue',
    'Pest contamination detected',
  ];

  for (let i = 0; i < 15; i++) {
    const grade = qualityGrades[Math.floor(Math.random() * qualityGrades.length)];
    const qty = 1 + Math.floor(Math.random() * 20);
    const costPerUnit = grade.price * 0.7;

    await prisma.wasteEntry.create({
      data: {
        productId: grade.productId,
        qualityGradeId: grade.id,
        quantity: qty,
        wasteType: Math.random() > 0.5 ? 'RECEIVING_WASTE' : 'AGING_WASTE',
        reason: wasteReasons[Math.floor(Math.random() * wasteReasons.length)],
        cost: Math.round(qty * costPerUnit * 100) / 100,
        authorizedById: Math.random() > 0.3 ? users.opsManager.id : null,
        createdById: users.qcControl.id,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ========== SUPPLIER RATINGS ==========
  console.log('Creating supplier ratings...');
  for (const supplier of suppliers) {
    const numRatings = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numRatings; i++) {
      await prisma.supplierRating.create({
        data: {
          supplierId: supplier.id,
          ratedById: [users.purchaseManager.id, users.qcControl.id, users.receiving.id][Math.floor(Math.random() * 3)],
          rating: 2 + Math.floor(Math.random() * 4),
          notes: ['Excellent quality', 'On time delivery', 'Some items below standard', 'Good packaging', 'Late delivery', 'Competitive pricing'][Math.floor(Math.random() * 6)],
          date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // ========== PRICE SURVEYS ==========
  console.log('Creating price surveys...');
  for (let day = 0; day < 30; day++) {
    const surveyDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
    // Survey 3-5 products per day across 2-3 suppliers
    const numProducts = 3 + Math.floor(Math.random() * 3);
    for (let p = 0; p < numProducts; p++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const numSuppliers = 2 + Math.floor(Math.random() * 2);
      for (let s = 0; s < numSuppliers; s++) {
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        const basePrice = basePrices[product.category];
        const surveyPrice = basePrice * (0.7 + Math.random() * 0.6);

        await prisma.priceSurvey.create({
          data: {
            supplierId: supplier.id,
            productId: product.id,
            price: Math.round(surveyPrice * 100) / 100,
            surveyDate,
            createdById: users.purchaseManager.id,
          },
        });
      }
    }
  }

  // ========== INVOICES ==========
  console.log('Creating invoices...');
  const deliveredOrders = clientOrders.filter((o) => o.status === 'DELIVERED');
  const invoiceStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE'];

  for (const order of deliveredOrders) {
    const invStatus = invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)];
    const dueDate = new Date(order.createdAt || Date.now());
    dueDate.setDate(dueDate.getDate() + 30);

    await prisma.invoice.create({
      data: {
        clientOrderId: order.id,
        clientId: order.clientId,
        amount: order.totalAmount,
        status: invStatus,
        dueDate,
        paidAt: invStatus === 'PAID' ? new Date(dueDate.getTime() - Math.random() * 15 * 24 * 60 * 60 * 1000) : null,
      },
    });
  }

  // ========== SPOT CHECKS ==========
  console.log('Creating spot checks...');
  for (let i = 0; i < 12; i++) {
    const grade = qualityGrades[Math.floor(Math.random() * qualityGrades.length)];
    const systemCount = grade.currentStock;
    const variance = Math.floor(Math.random() * 10) - 5;
    const physicalCount = Math.max(0, systemCount + variance);

    await prisma.spotCheck.create({
      data: {
        productId: grade.productId,
        qualityGradeId: grade.id,
        systemCount,
        physicalCount,
        discrepancy: physicalCount - systemCount,
        checkedById: users.qcControl.id,
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ========== RETURN AMENDMENTS ==========
  console.log('Creating return amendments...');
  const raReasons = [
    'Product quality did not match description',
    'Received wrong items',
    'Quantity mismatch',
    'Damaged during delivery',
    'Need to change delivery date',
    'Want to add more items to order',
  ];
  const raStatuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

  const eligibleOrders = clientOrders.filter((o) =>
    ['CONFIRMED', 'PREPARING', 'DISPATCHED', 'DELIVERED'].includes(o.status)
  );

  for (let i = 0; i < Math.min(8, eligibleOrders.length); i++) {
    const order = eligibleOrders[i];
    const raStatus = raStatuses[Math.floor(Math.random() * raStatuses.length)];
    const isReturn = Math.random() > 0.5;

    await prisma.returnAmendment.create({
      data: {
        clientOrderId: order.id,
        requestedById: users.clientAdmin1.id,
        type: isReturn ? 'RETURN' : 'AMENDMENT',
        status: raStatus,
        reason: raReasons[Math.floor(Math.random() * raReasons.length)],
        opsManagerApproval: raStatus === 'APPROVED' ? true : raStatus === 'REJECTED' ? false : null,
        qcApproval: raStatus === 'APPROVED' ? true : raStatus === 'REJECTED' ? false : null,
        opsManagerComment: raStatus !== 'PENDING' ? 'Reviewed by operations' : null,
        qcComment: raStatus === 'APPROVED' ? 'Quality check passed' : raStatus === 'REJECTED' ? 'Does not meet return criteria' : null,
      },
    });
  }

  // ========== ACTIVITY LOGS ==========
  console.log('Creating activity logs...');
  const actions = [
    { action: 'LOGIN', entityType: 'User' },
    { action: 'CREATE_ORDER', entityType: 'ClientOrder' },
    { action: 'UPDATE_ORDER_STATUS', entityType: 'ClientOrder' },
    { action: 'CREATE_PURCHASE_ORDER', entityType: 'PurchaseOrder' },
    { action: 'RECORD_WASTE', entityType: 'WasteEntry' },
    { action: 'SPOT_CHECK', entityType: 'SpotCheck' },
    { action: 'UPDATE_DISPATCH_STATUS', entityType: 'Dispatch' },
    { action: 'APPROVE_CLIENT', entityType: 'Client' },
    { action: 'CREATE_PRODUCT', entityType: 'Product' },
    { action: 'ADD_SUPPLIER_RATING', entityType: 'SupplierRating' },
  ];

  const allInternalUsers = [
    users.superAdmin, users.purchaseManager, users.opsManager,
    users.qcControl, users.receiving, users.logistics,
    users.driver1, users.accountant,
  ];

  for (let i = 0; i < 40; i++) {
    const user = allInternalUsers[Math.floor(Math.random() * allInternalUsers.length)];
    const actionDef = actions[Math.floor(Math.random() * actions.length)];

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: actionDef.action,
        entityType: actionDef.entityType,
        entityId: `seed-${i}`,
        metadata: { seeded: true },
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log('');
  console.log('=== Login Credentials ===');
  console.log('Super Admin:       admin@azoury.com / password123');
  console.log('Purchase Manager:  purchasing@azoury.com / password123');
  console.log('Ops Manager:       operations@azoury.com / password123');
  console.log('QC Control:        quality@azoury.com / password123');
  console.log('Receiving:         receiving@azoury.com / password123');
  console.log('Logistics:         logistics@azoury.com / password123');
  console.log('Driver 1:          driver1@azoury.com / password123');
  console.log('Driver 2:          driver2@azoury.com / password123');
  console.log('Accountant:        accounting@azoury.com / password123');
  console.log('Client Admin 1:    nadia@lebanese-bistro.com / password123');
  console.log('Client Admin 2:    samir@freshmart.lb / password123');
  console.log('Client Staff 1:    chef@lebanese-bistro.com / password123');
  console.log('Client Staff 2:    inventory@freshmart.lb / password123');
  console.log('Client Staff 3:    rima@greengrocer.lb / password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
