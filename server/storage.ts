import { db } from "./db";
import { eq, desc, sql, sum, count, and, inArray, or, ilike, gte, lte, asc } from "drizzle-orm";
import { 
  products, categories, clients, sales, saleItems, salePayments,
  deliveryNotes, deliveryNoteItems, preInvoices, preInvoiceDeliveryNotes,
  roles, modules, roleModulePermissions, users,
  clientAuthorizedContacts, clientAccountMovements,
  suppliers, supplierAccountMovements, supplierProductDiscounts,
  paymentMethods, cardConfigurations, cardInstallmentPlans, bankAccounts,
  cashRegisters, cashRegisterSessions, cashMovements, checksWallet,
  stockLocations, stockMovements, brands, warehouses, productWarehouseStock,
  supplierImportTemplates, priceUpdateLogs, companySettings, printSettings,
  ecommerceSettings, ecommerceOrders, ecommerceOrderItems, shoppingCarts,
  purchaseOrders, purchaseOrderItems, quotes, quoteItems,
  customerOrders, customerOrderItems, priceLists, priceListItems,
  loyaltyProgram, clientLoyaltyPoints, loyaltyTransactions,
  type Product, type InsertProduct,
  type Category,
  type Client, type InsertClient,
  type Sale, type SaleItem, type CreateSaleRequest,
  type DashboardStats, type SaleWithDetails,
  type DeliveryNote, type DeliveryNoteWithDetails, type CreateDeliveryNoteRequest,
  type PreInvoice, type PreInvoiceWithDetails, type CreatePreInvoiceRequest,
  type ClientWithPendingNotes,
  type Role, type InsertRole, type Module, type InsertModule,
  type RoleModulePermission, type User, type UserWithRole, type RoleWithPermissions,
  type ClientAuthorizedContact, type InsertAuthorizedContact,
  type ClientAccountMovement, type InsertAccountMovement,
  type ClientWithDetails, type ClientAccountSummary, type CreateAccountMovementRequest,
  type Supplier, type InsertSupplier, type SupplierAccountMovement, type SupplierProductDiscount,
  type SupplierWithDetails, type SupplierAccountSummary, type CreateSupplierMovementRequest,
  type InsertSupplierMovement, type InsertSupplierDiscount,
  type PaymentMethod, type InsertPaymentMethod,
  type CardConfiguration, type InsertCardConfig, type CardWithPlans,
  type CardInstallmentPlan, type InsertCardInstallment,
  type BankAccount, type InsertBankAccount,
  type CashRegister, type InsertCashRegister,
  type CashRegisterSession, type InsertCashSession, type CashSessionWithDetails,
  type CashMovement, type InsertCashMovement,
  type Check, type InsertCheck, type CheckWithAlert,
  type StockLocation, type InsertStockLocation,
  type StockMovement, type InsertStockMovement, type StockMovementWithDetails, type StockAlert,
  type Brand, type InsertBrand,
  type Warehouse, type InsertWarehouse,
  type ProductWarehouseStock, type InsertProductWarehouseStock,
  type SupplierImportTemplate, type InsertSupplierImportTemplate,
  type PriceUpdateLog, type InsertPriceUpdateLog,
  type CompanySettings, type InsertCompanySettings,
  type PrintSettings, type InsertPrintSettings,
  type EcommerceSettings, type InsertEcommerceSettings,
  type EcommerceOrder, type InsertEcommerceOrder,
  type EcommerceOrderItem, type InsertEcommerceOrderItem,
  type EcommerceOrderWithItems,
  type PurchaseOrder, type InsertPurchaseOrder,
  type PurchaseOrderItem, type InsertPurchaseOrderItem,
  type Quote, type InsertQuote, type QuoteItem, type InsertQuoteItem,
  type CustomerOrder, type InsertCustomerOrder,
  type CustomerOrderItem, type InsertCustomerOrderItem,
  type PriceList, type InsertPriceList,
  type LoyaltyProgram, type InsertLoyaltyProgram,
  type ClientLoyaltyPoints,
  employees, payrollPayments, employeeAdvances,
  type Employee, type InsertEmployee,
  type PayrollPayment, type InsertPayrollPayment,
  type EmployeeAdvance, type InsertEmployeeAdvance
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // Products
  getProducts(search?: string, categoryId?: string): Promise<(Product & { category: Category | null })[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(name: string, description?: string): Promise<Category>;

  // Clients
  getClients(search?: string): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientWithDetails(id: number): Promise<ClientWithDetails | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;
  searchClients(query: string): Promise<Client[]>;

  // Authorized Contacts
  getAuthorizedContacts(clientId: number): Promise<ClientAuthorizedContact[]>;
  createAuthorizedContact(contact: InsertAuthorizedContact): Promise<ClientAuthorizedContact>;
  updateAuthorizedContact(id: number, updates: Partial<InsertAuthorizedContact>): Promise<ClientAuthorizedContact>;
  deleteAuthorizedContact(id: number): Promise<void>;

  // Client Account (Cuenta Corriente)
  getClientAccountSummary(clientId: number): Promise<ClientAccountSummary>;
  createAccountMovement(userId: string, request: CreateAccountMovementRequest): Promise<ClientAccountMovement>;
  getClientMovements(clientId: number): Promise<ClientAccountMovement[]>;

  // Sales
  createSale(userId: string, request: CreateSaleRequest): Promise<Sale>;
  getSales(): Promise<SaleWithDetails[]>;
  getSale(id: number): Promise<SaleWithDetails | undefined>;
  convertSaleToRemito(saleId: number, userId: string): Promise<DeliveryNote | undefined>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;

  // Delivery Notes (Remitos)
  createDeliveryNote(userId: string, request: CreateDeliveryNoteRequest): Promise<DeliveryNote>;
  getDeliveryNotes(clientId?: number): Promise<DeliveryNoteWithDetails[]>;
  getDeliveryNote(id: number): Promise<DeliveryNoteWithDetails | undefined>;
  getPendingDeliveryNotesByClient(): Promise<ClientWithPendingNotes[]>;
  updateDeliveryNoteStatus(id: number, status: string): Promise<DeliveryNote>;

  // Pre-Invoices (Pre-Facturas)
  createPreInvoice(userId: string, request: CreatePreInvoiceRequest): Promise<PreInvoice>;
  getPreInvoices(): Promise<PreInvoiceWithDetails[]>;
  getPreInvoice(id: number): Promise<PreInvoiceWithDetails | undefined>;
  updatePreInvoiceStatus(id: number, status: string, adminNotes?: string, reviewedBy?: string): Promise<PreInvoice>;

  // Roles
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<RoleWithPermissions | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, updates: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;

  // Modules
  getModules(): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModuleStatus(id: number, isActive: boolean): Promise<Module>;

  // Role Permissions
  setRolePermissions(roleId: number, permissions: { moduleId: number; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }[]): Promise<void>;

  // Users
  getUsers(): Promise<UserWithRole[]>;
  getUser(id: string): Promise<UserWithRole | undefined>;
  updateUserRole(userId: string, roleId: number): Promise<User>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User>;

  // Initial Setup
  seedDefaultRolesAndModules(): Promise<void>;

  // Suppliers
  getSuppliers(search?: string): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSupplierWithDetails(id: number): Promise<SupplierWithDetails | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;
  searchSuppliers(query: string): Promise<Supplier[]>;

  // Supplier Account (Cuenta Corriente)
  getSupplierAccountSummary(supplierId: number): Promise<SupplierAccountSummary>;
  createSupplierMovement(userId: string, request: CreateSupplierMovementRequest): Promise<SupplierAccountMovement>;
  getSupplierMovements(supplierId: number): Promise<SupplierAccountMovement[]>;

  // Supplier Product Discounts
  getSupplierDiscounts(supplierId: number): Promise<SupplierProductDiscount[]>;
  createSupplierDiscount(discount: InsertSupplierDiscount): Promise<SupplierProductDiscount>;
  updateSupplierDiscount(id: number, updates: Partial<InsertSupplierDiscount>): Promise<SupplierProductDiscount>;
  deleteSupplierDiscount(id: number): Promise<void>;

  // Payment Methods
  getPaymentMethods(): Promise<PaymentMethod[]>;
  getActivePaymentMethods(): Promise<PaymentMethod[]>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, updates: Partial<InsertPaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: number): Promise<void>;
  seedDefaultPaymentMethods(): Promise<void>;

  // Card Configurations
  getCardConfigurations(): Promise<CardConfiguration[]>;
  getActiveCards(): Promise<CardConfiguration[]>;
  getCardWithPlans(cardId: number): Promise<CardWithPlans | undefined>;
  getAllCardsWithPlans(): Promise<CardWithPlans[]>;
  createCardConfiguration(config: InsertCardConfig): Promise<CardConfiguration>;
  updateCardConfiguration(id: number, updates: Partial<InsertCardConfig>): Promise<CardConfiguration>;
  deleteCardConfiguration(id: number): Promise<void>;
  seedDefaultCardConfigs(): Promise<void>;

  // Installment Plans
  getCardInstallmentPlans(cardConfigId: number): Promise<CardInstallmentPlan[]>;
  createInstallmentPlan(plan: InsertCardInstallment): Promise<CardInstallmentPlan>;
  updateInstallmentPlan(id: number, updates: Partial<InsertCardInstallment>): Promise<CardInstallmentPlan>;
  deleteInstallmentPlan(id: number): Promise<void>;

  // Bank Accounts
  getBankAccounts(): Promise<BankAccount[]>;
  getActiveBankAccounts(): Promise<BankAccount[]>;
  getBankAccount(id: number): Promise<BankAccount | undefined>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: number, updates: Partial<InsertBankAccount>): Promise<BankAccount>;
  deleteBankAccount(id: number): Promise<void>;

  // Cash Registers
  getCashRegisters(): Promise<CashRegister[]>;
  getActiveCashRegisters(): Promise<CashRegister[]>;
  getCashRegister(id: number): Promise<CashRegister | undefined>;
  createCashRegister(register: InsertCashRegister): Promise<CashRegister>;
  updateCashRegister(id: number, updates: Partial<InsertCashRegister>): Promise<CashRegister>;
  deleteCashRegister(id: number): Promise<void>;
  seedDefaultCashRegister(): Promise<void>;

  // Cash Register Sessions
  getOpenSessions(): Promise<CashRegisterSession[]>;
  getSessionsByRegister(cashRegisterId: number): Promise<CashRegisterSession[]>;
  getSessionWithDetails(sessionId: number): Promise<CashSessionWithDetails | undefined>;
  openSession(userId: string, cashRegisterId: number, openingBalance: string): Promise<CashRegisterSession>;
  closeSession(userId: string, sessionId: number, closingBalance: string, notes?: string): Promise<CashRegisterSession>;
  getCurrentSession(cashRegisterId: number): Promise<CashRegisterSession | undefined>;

  // Cash Movements
  getMovementsBySession(sessionId: number): Promise<CashMovement[]>;
  createCashMovement(movement: InsertCashMovement): Promise<CashMovement>;
  getCashRegisterSummary(cashRegisterId: number): Promise<{ totalIncome: string; totalExpense: string; currentBalance: string }>;

  // Checks Wallet
  getChecks(status?: string): Promise<Check[]>;
  getChecksByClient(clientId: number): Promise<Check[]>;
  getCheck(id: number): Promise<Check | undefined>;
  createCheck(check: InsertCheck): Promise<Check>;
  updateCheck(id: number, updates: Partial<InsertCheck>): Promise<Check>;
  getChecksWithAlerts(): Promise<CheckWithAlert[]>;
  depositCheck(id: number, depositAccountId: number): Promise<Check>;
  endorseCheck(id: number, endorsedTo: string): Promise<Check>;
  rejectCheck(id: number, reason: string): Promise<Check>;

  // Stock Locations
  getStockLocations(): Promise<StockLocation[]>;
  getStockLocation(id: number): Promise<StockLocation | undefined>;
  createStockLocation(location: InsertStockLocation): Promise<StockLocation>;
  updateStockLocation(id: number, updates: Partial<InsertStockLocation>): Promise<StockLocation>;
  deleteStockLocation(id: number): Promise<void>;
  seedDefaultStockLocations(): Promise<void>;

  // Stock Movements
  getStockMovements(productId?: number): Promise<StockMovementWithDetails[]>;
  createStockMovement(userId: string, movement: Omit<InsertStockMovement, 'userId' | 'previousStock' | 'newStock'>): Promise<StockMovement>;
  adjustStock(userId: string, productId: number, quantity: number, type: 'add' | 'subtract', notes?: string): Promise<StockMovement>;
  getStockAlerts(): Promise<StockAlert[]>;

  // Brands
  getBrands(): Promise<Brand[]>;
  getBrand(id: number): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: number, updates: Partial<InsertBrand>): Promise<Brand>;
  deleteBrand(id: number): Promise<void>;
  seedDefaultBrands(): Promise<void>;

  // Warehouses
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: number, updates: Partial<InsertWarehouse>): Promise<Warehouse>;
  deleteWarehouse(id: number): Promise<void>;
  seedDefaultWarehouses(): Promise<void>;

  // Product Warehouse Stock
  getProductWarehouseStock(productId: number): Promise<ProductWarehouseStock[]>;
  updateProductWarehouseStock(productId: number, warehouseId: number, stock: Partial<InsertProductWarehouseStock>): Promise<ProductWarehouseStock>;
  setProductWarehouseStock(data: InsertProductWarehouseStock): Promise<ProductWarehouseStock>;
}

export class DatabaseStorage implements IStorage {
  // === Products ===
  async getProducts(search?: string, categoryId?: string): Promise<(Product & { category: Category | null })[]> {
    let query = db.select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      description: products.description,
      categoryId: products.categoryId,
      price: products.price,
      costPrice: products.costPrice,
      stockQuantity: products.stockQuantity,
      minStockLevel: products.minStockLevel,
      imageUrl: products.imageUrl,
      isActive: products.isActive,
      category: categories
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id));

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      query.where(sql`LOWER(${products.name}) LIKE ${searchLower} OR LOWER(${products.sku}) LIKE ${searchLower}`);
    }

    if (categoryId) {
      query.where(eq(products.categoryId, parseInt(categoryId)));
    }

    return await query;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    // Soft delete usually better, but for now hard delete or set inactive
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  // === Categories ===
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }

  async createCategory(input: { name: string; description?: string }): Promise<Category> {
    const [category] = await db.insert(categories).values(input).returning();
    return category;
  }

  async updateCategory(id: number, updates: { name?: string; description?: string }): Promise<Category> {
    const [updated] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // === Clients ===
  async getClients(search?: string): Promise<Client[]> {
    let query = db.select().from(clients);
    
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      query.where(sql`LOWER(${clients.name}) LIKE ${searchLower} OR LOWER(${clients.email}) LIKE ${searchLower} OR ${clients.phone} LIKE ${searchLower}`);
    }

    return await query;
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db.update(clients).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(clients.id, id)).returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<void> {
    await db.update(clients).set({ isActive: false, updatedAt: new Date() }).where(eq(clients.id, id));
  }

  async searchClients(query: string): Promise<Client[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    return await db.select().from(clients)
      .where(
        and(
          eq(clients.isActive, true),
          or(
            sql`LOWER(${clients.name}) LIKE ${searchPattern}`,
            sql`LOWER(${clients.businessName}) LIKE ${searchPattern}`,
            sql`${clients.taxId} LIKE ${searchPattern}`,
            sql`${clients.phone} LIKE ${searchPattern}`,
            sql`${clients.whatsapp} LIKE ${searchPattern}`,
            sql`LOWER(${clients.email}) LIKE ${searchPattern}`
          )
        )
      );
  }

  async getClientWithDetails(id: number): Promise<ClientWithDetails | undefined> {
    const client = await this.getClient(id);
    if (!client) return undefined;

    const contacts = await this.getAuthorizedContacts(id);
    const summary = await this.getClientAccountSummary(id);

    return {
      ...client,
      authorizedContacts: contacts,
      currentBalance: summary.currentBalance
    };
  }

  // === Authorized Contacts ===
  async getAuthorizedContacts(clientId: number): Promise<ClientAuthorizedContact[]> {
    return await db.select().from(clientAuthorizedContacts)
      .where(and(
        eq(clientAuthorizedContacts.clientId, clientId),
        eq(clientAuthorizedContacts.isActive, true)
      ));
  }

  async createAuthorizedContact(contact: InsertAuthorizedContact): Promise<ClientAuthorizedContact> {
    const [newContact] = await db.insert(clientAuthorizedContacts).values(contact).returning();
    return newContact;
  }

  async updateAuthorizedContact(id: number, updates: Partial<InsertAuthorizedContact>): Promise<ClientAuthorizedContact> {
    const [updated] = await db.update(clientAuthorizedContacts)
      .set(updates)
      .where(eq(clientAuthorizedContacts.id, id))
      .returning();
    return updated;
  }

  async deleteAuthorizedContact(id: number): Promise<void> {
    await db.update(clientAuthorizedContacts)
      .set({ isActive: false })
      .where(eq(clientAuthorizedContacts.id, id));
  }

  // === Client Account (Cuenta Corriente) ===
  async getClientMovements(clientId: number): Promise<ClientAccountMovement[]> {
    return await db.select().from(clientAccountMovements)
      .where(eq(clientAccountMovements.clientId, clientId))
      .orderBy(desc(clientAccountMovements.createdAt));
  }

  async getClientAccountSummary(clientId: number): Promise<ClientAccountSummary> {
    const client = await this.getClient(clientId);
    const movements = await this.getClientMovements(clientId);

    let totalDebit = 0;
    let totalCredit = 0;

    for (const mov of movements) {
      if (mov.type === 'debit') {
        totalDebit += Number(mov.amount);
      } else {
        totalCredit += Number(mov.amount);
      }
    }

    return {
      clientId,
      clientName: client?.name || '',
      totalDebit,
      totalCredit,
      currentBalance: totalDebit - totalCredit,
      movements
    };
  }

  async createAccountMovement(userId: string, request: CreateAccountMovementRequest): Promise<ClientAccountMovement> {
    // Get current balance
    const summary = await this.getClientAccountSummary(request.clientId);
    const newBalance = request.type === 'debit' 
      ? summary.currentBalance + request.amount 
      : summary.currentBalance - request.amount;

    const [movement] = await db.insert(clientAccountMovements).values({
      clientId: request.clientId,
      type: request.type,
      amount: request.amount.toString(),
      balance: newBalance.toString(),
      concept: request.concept,
      referenceType: request.referenceType,
      referenceId: request.referenceId,
      documentNumber: request.documentNumber,
      notes: request.notes,
      userId
    }).returning();

    return movement;
  }

  // === Sales ===
  async createSale(userId: string, request: CreateSaleRequest): Promise<Sale> {
    // Calculate subtotal
    let subtotal = 0;
    for (const item of request.items) {
      subtotal += item.quantity * item.unitPrice;
    }

    // Apply discount
    const discountPercent = request.discountPercent || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const totalAmount = subtotal - discountAmount;

    // Determine document prefix based on type
    const docType = request.documentType || "ingreso";
    const prefixes: Record<string, string> = {
      factura_a: "FA",
      factura_b: "FB", 
      factura_c: "FC",
      ingreso: "ING",
      presupuesto: "PRES"
    };
    const prefix = prefixes[docType] || "REC";
    const receiptNumber = `${prefix}-${nanoid(8).toUpperCase()}`;

    // Determine fiscal status
    const fiscalStatus = docType.startsWith("factura_") ? "pending" : "not_applicable";

    // Create Sale Header
    const [sale] = await db.insert(sales).values({
      receiptNumber,
      documentType: docType,
      clientId: request.clientId,
      userId,
      subtotal: subtotal.toString(),
      discountPercent: discountPercent.toString(),
      discountAmount: discountAmount.toString(),
      totalAmount: totalAmount.toString(),
      paymentMethod: request.paymentMethod,
      fiscalStatus,
      status: docType === "presupuesto" ? "pending" : "completed",
      notes: request.notes
    }).returning();

    // Create Sale Items and Update Stock
    for (const item of request.items) {
      const itemSubtotal = item.quantity * item.unitPrice;
      
      await db.insert(saleItems).values({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: itemSubtotal.toString()
      });

      // Update Stock only for non-presupuesto
      if (docType !== "presupuesto") {
        const product = await this.getProduct(item.productId);
        if (product) {
          await this.updateProduct(item.productId, {
            stockQuantity: product.stockQuantity - item.quantity
          });
        }
      }
    }

    // Create payment records for mixed payments
    if (request.payments && request.payments.length > 0) {
      for (const payment of request.payments) {
        await db.insert(salePayments).values({
          saleId: sale.id,
          paymentMethod: payment.paymentMethod,
          amount: payment.amount.toString(),
          cardType: payment.cardType,
          cardLastDigits: payment.cardLastDigits,
          installments: payment.installments || 1,
          surchargePercent: (payment.surchargePercent || 0).toString(),
          referenceNumber: payment.referenceNumber,
          notes: payment.notes
        });
      }
    } else {
      // Single payment - create one payment record
      await db.insert(salePayments).values({
        saleId: sale.id,
        paymentMethod: request.paymentMethod,
        amount: totalAmount.toString()
      });
    }

    // Create remito if requested
    if (request.createRemito && docType !== "presupuesto" && request.clientId) {
      await this.convertSaleToRemito(sale.id, userId);
    }

    return sale;
  }

  async getSales(): Promise<SaleWithDetails[]> {
    const allSales = await db.query.sales.findMany({
      with: {
        client: true,
        items: {
          with: {
            product: true
          }
        },
        payments: true
      },
      orderBy: [desc(sales.createdAt)]
    });
    return allSales;
  }

  async getSale(id: number): Promise<SaleWithDetails | undefined> {
    const sale = await db.query.sales.findFirst({
      where: eq(sales.id, id),
      with: {
        client: true,
        items: {
          with: {
            product: true
          }
        },
        payments: true
      }
    });
    return sale;
  }

  async convertSaleToRemito(saleId: number, userId: string): Promise<DeliveryNote | undefined> {
    const sale = await this.getSale(saleId);
    if (!sale) return undefined;
    
    const items = sale.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice)
    }));
    
    const remito = await this.createDeliveryNote(userId, {
      clientId: sale.clientId!,
      items,
      notes: `Convertido desde venta ${sale.receiptNumber}`
    });
    
    // Mark original sale as converted
    await db.update(sales)
      .set({ status: "converted", notes: `Convertido a remito ${remito.noteNumber}` })
      .where(eq(sales.id, saleId));
    
    return remito;
  }

  // === Stats ===
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sales Today
    const salesToday = await db.select({
      count: count(),
      revenue: sum(sales.totalAmount)
    })
    .from(sales)
    .where(sql`${sales.createdAt} >= ${today.toISOString()}`);

    // Low Stock
    const lowStock = await db.select({ count: count() })
      .from(products)
      .where(sql`${products.stockQuantity} <= ${products.minStockLevel}`);

    // Total Products
    const totalProds = await db.select({ count: count() }).from(products);

    // Recent Sales
    const recent = await this.getSales(); // Already ordered desc, take 5
    
    return {
      totalSalesToday: salesToday[0]?.count || 0,
      revenueToday: Number(salesToday[0]?.revenue) || 0,
      lowStockCount: lowStock[0]?.count || 0,
      totalProducts: totalProds[0]?.count || 0,
      recentSales: recent.slice(0, 5)
    };
  }

  // === Delivery Notes (Remitos) ===
  async createDeliveryNote(userId: string, request: CreateDeliveryNoteRequest): Promise<DeliveryNote> {
    // Calculate total
    let totalAmount = 0;
    for (const item of request.items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    // Generate note number
    const lastNote = await db.select({ noteNumber: deliveryNotes.noteNumber })
      .from(deliveryNotes)
      .orderBy(desc(deliveryNotes.id))
      .limit(1);
    
    let nextNumber = 1;
    if (lastNote.length > 0 && lastNote[0].noteNumber) {
      const match = lastNote[0].noteNumber.match(/R-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const noteNumber = `R-${nextNumber.toString().padStart(4, '0')}`;

    // Create Delivery Note
    const [note] = await db.insert(deliveryNotes).values({
      noteNumber,
      clientId: request.clientId,
      userId,
      notes: request.notes,
      deliveryDate: request.deliveryDate ? new Date(request.deliveryDate) : new Date(),
      status: "pending"
    }).returning();

    // Create Items
    for (const item of request.items) {
      const subtotal = item.quantity * item.unitPrice;
      
      await db.insert(deliveryNoteItems).values({
        deliveryNoteId: note.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: subtotal.toString()
      });
    }

    return note;
  }

  async getDeliveryNotes(clientId?: number): Promise<DeliveryNoteWithDetails[]> {
    let whereCondition = clientId ? eq(deliveryNotes.clientId, clientId) : undefined;
    
    const notes = await db.query.deliveryNotes.findMany({
      where: whereCondition,
      with: {
        client: true,
        items: {
          with: {
            product: true
          }
        }
      },
      orderBy: [desc(deliveryNotes.createdAt)]
    });
    
    return notes as DeliveryNoteWithDetails[];
  }

  async getDeliveryNote(id: number): Promise<DeliveryNoteWithDetails | undefined> {
    const note = await db.query.deliveryNotes.findFirst({
      where: eq(deliveryNotes.id, id),
      with: {
        client: true,
        items: {
          with: {
            product: true
          }
        }
      }
    });
    return note as DeliveryNoteWithDetails | undefined;
  }

  async getPendingDeliveryNotesByClient(): Promise<ClientWithPendingNotes[]> {
    // Get all clients that have pending delivery notes
    const allClients = await db.select().from(clients);
    const result: ClientWithPendingNotes[] = [];

    for (const client of allClients) {
      const pendingNotes = await this.getDeliveryNotes(client.id);
      const pending = pendingNotes.filter(n => n.status === 'pending');
      
      if (pending.length > 0) {
        let totalAmount = 0;
        for (const note of pending) {
          for (const item of note.items) {
            totalAmount += Number(item.subtotal);
          }
        }
        
        result.push({
          ...client,
          pendingDeliveryNotes: pending,
          totalPendingAmount: totalAmount
        });
      }
    }

    return result;
  }

  async updateDeliveryNoteStatus(id: number, status: string): Promise<DeliveryNote> {
    const [updated] = await db.update(deliveryNotes)
      .set({ status })
      .where(eq(deliveryNotes.id, id))
      .returning();
    return updated;
  }

  // === Pre-Invoices (Pre-Facturas) ===
  async createPreInvoice(userId: string, request: CreatePreInvoiceRequest): Promise<PreInvoice> {
    // Get all delivery notes to calculate total
    let totalAmount = 0;
    for (const noteId of request.deliveryNoteIds) {
      const note = await this.getDeliveryNote(noteId);
      if (note) {
        for (const item of note.items) {
          totalAmount += Number(item.subtotal);
        }
      }
    }

    // Generate pre-invoice number
    const lastPreInvoice = await db.select({ preInvoiceNumber: preInvoices.preInvoiceNumber })
      .from(preInvoices)
      .orderBy(desc(preInvoices.id))
      .limit(1);
    
    let nextNumber = 1;
    if (lastPreInvoice.length > 0 && lastPreInvoice[0].preInvoiceNumber) {
      const match = lastPreInvoice[0].preInvoiceNumber.match(/PF-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const preInvoiceNumber = `PF-${nextNumber.toString().padStart(4, '0')}`;

    // Create Pre-Invoice
    const [preInvoice] = await db.insert(preInvoices).values({
      preInvoiceNumber,
      clientId: request.clientId,
      userId,
      totalAmount: totalAmount.toString(),
      status: "pending_review"
    }).returning();

    // Link delivery notes to pre-invoice and mark them as invoiced
    for (const noteId of request.deliveryNoteIds) {
      await db.insert(preInvoiceDeliveryNotes).values({
        preInvoiceId: preInvoice.id,
        deliveryNoteId: noteId
      });
      
      // Mark delivery note as invoiced
      await this.updateDeliveryNoteStatus(noteId, 'invoiced');
    }

    return preInvoice;
  }

  async getPreInvoices(): Promise<PreInvoiceWithDetails[]> {
    const allPreInvoices = await db.query.preInvoices.findMany({
      with: {
        client: true,
        deliveryNotes: true
      },
      orderBy: [desc(preInvoices.createdAt)]
    });

    // Fetch full delivery note details for each pre-invoice
    const result: PreInvoiceWithDetails[] = [];
    for (const pi of allPreInvoices) {
      const noteIds = pi.deliveryNotes.map(dn => dn.deliveryNoteId);
      const fullNotes: DeliveryNoteWithDetails[] = [];
      
      for (const noteId of noteIds) {
        const note = await this.getDeliveryNote(noteId);
        if (note) fullNotes.push(note);
      }

      result.push({
        ...pi,
        deliveryNotes: fullNotes
      } as PreInvoiceWithDetails);
    }

    return result;
  }

  async getPreInvoice(id: number): Promise<PreInvoiceWithDetails | undefined> {
    const pi = await db.query.preInvoices.findFirst({
      where: eq(preInvoices.id, id),
      with: {
        client: true,
        deliveryNotes: true
      }
    });

    if (!pi) return undefined;

    const noteIds = pi.deliveryNotes.map(dn => dn.deliveryNoteId);
    const fullNotes: DeliveryNoteWithDetails[] = [];
    
    for (const noteId of noteIds) {
      const note = await this.getDeliveryNote(noteId);
      if (note) fullNotes.push(note);
    }

    return {
      ...pi,
      deliveryNotes: fullNotes
    } as PreInvoiceWithDetails;
  }

  async updatePreInvoiceStatus(id: number, status: string, adminNotes?: string, reviewedBy?: string): Promise<PreInvoice> {
    const [updated] = await db.update(preInvoices)
      .set({ 
        status, 
        adminNotes: adminNotes || undefined,
        reviewedAt: new Date(),
        reviewedBy: reviewedBy || undefined
      })
      .where(eq(preInvoices.id, id))
      .returning();
    return updated;
  }

  // === Roles ===
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async getRole(id: number): Promise<RoleWithPermissions | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    if (!role) return undefined;

    const perms = await db.select({
      id: roleModulePermissions.id,
      roleId: roleModulePermissions.roleId,
      moduleId: roleModulePermissions.moduleId,
      canView: roleModulePermissions.canView,
      canCreate: roleModulePermissions.canCreate,
      canEdit: roleModulePermissions.canEdit,
      canDelete: roleModulePermissions.canDelete,
      module: modules
    })
    .from(roleModulePermissions)
    .leftJoin(modules, eq(roleModulePermissions.moduleId, modules.id))
    .where(eq(roleModulePermissions.roleId, id));

    return {
      ...role,
      permissions: perms.map(p => ({
        ...p,
        module: p.module!
      }))
    };
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, updates: Partial<InsertRole>): Promise<Role> {
    const [updated] = await db.update(roles).set(updates).where(eq(roles.id, id)).returning();
    return updated;
  }

  async deleteRole(id: number): Promise<void> {
    await db.delete(roleModulePermissions).where(eq(roleModulePermissions.roleId, id));
    await db.delete(roles).where(eq(roles.id, id));
  }

  // === Modules ===
  async getModules(): Promise<Module[]> {
    return await db.select().from(modules).orderBy(modules.sortOrder);
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  async updateModuleStatus(id: number, isActive: boolean): Promise<Module> {
    const [updated] = await db.update(modules).set({ isActive }).where(eq(modules.id, id)).returning();
    return updated;
  }

  // === Role Permissions ===
  async setRolePermissions(roleId: number, permissions: { moduleId: number; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }[]): Promise<void> {
    await db.delete(roleModulePermissions).where(eq(roleModulePermissions.roleId, roleId));
    
    if (permissions.length > 0) {
      await db.insert(roleModulePermissions).values(
        permissions.map(p => ({
          roleId,
          moduleId: p.moduleId,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete
        }))
      );
    }
  }

  // === Users ===
  async getUsers(): Promise<UserWithRole[]> {
    const result = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      roleId: users.roleId,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      role: roles
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id));

    return result.map(r => ({
      id: r.id,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      profileImageUrl: r.profileImageUrl,
      roleId: r.roleId,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      role: r.role
    }));
  }

  async getUser(id: string): Promise<UserWithRole | undefined> {
    const [result] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      roleId: users.roleId,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      role: roles
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id));

    if (!result) return undefined;

    return {
      id: result.id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      profileImageUrl: result.profileImageUrl,
      roleId: result.roleId,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      role: result.role
    };
  }

  async updateUserRole(userId: string, roleId: number): Promise<User> {
    const [updated] = await db.update(users)
      .set({ roleId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    const [updated] = await db.update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const [updated] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // === Initial Setup ===
  async seedDefaultRolesAndModules(): Promise<void> {
    const existingRoles = await db.select().from(roles);
    if (existingRoles.length > 0) return;

    const defaultRoles: InsertRole[] = [
      { name: "Administrador", description: "Acceso total al sistema", isSystem: true },
      { name: "Vendedor", description: "Acceso a ventas y clientes", isSystem: true },
      { name: "Cajero", description: "Acceso a caja y cobros", isSystem: true },
      { name: "Almacén", description: "Acceso a stock y compras", isSystem: true },
    ];

    const createdRoles = await db.insert(roles).values(defaultRoles).returning();

    const defaultModules: InsertModule[] = [
      { code: "dashboard", name: "Dashboard", description: "Panel principal", icon: "LayoutDashboard", route: "/", isActive: true },
      { code: "pos", name: "Punto de Venta", description: "Ventas mostrador", icon: "ShoppingCart", route: "/pos", isActive: true },
      { code: "ventas", name: "Ventas", description: "Gestión de ventas", icon: "Receipt", route: "/sales", isActive: true },
      { code: "productos", name: "Productos", description: "Gestión de productos", icon: "Package", route: "/products", isActive: true },
      { code: "clientes", name: "Clientes", description: "Gestión de clientes", icon: "Users", route: "/clients", isActive: true },
      { code: "remitos", name: "Remitos", description: "Notas de entrega", icon: "FileText", route: "/remitos", isActive: true },
      { code: "proveedores", name: "Proveedores", description: "Gestión de proveedores", icon: "Truck", route: "/suppliers", isActive: false },
      { code: "compras", name: "Compras", description: "Órdenes de compra", icon: "ShoppingBag", route: "/purchases", isActive: false },
      { code: "cajas", name: "Cajas", description: "Control de caja", icon: "Wallet", route: "/cashboxes", isActive: false },
      { code: "informes", name: "Informes", description: "Reportes y estadísticas", icon: "BarChart3", route: "/reports", isActive: false },
      { code: "usuarios", name: "Usuarios", description: "Gestión de usuarios y roles", icon: "UserCog", route: "/users", isActive: true },
      { code: "configuracion", name: "Configuración", description: "Configuración del sistema", icon: "Settings", route: "/settings", isActive: true },
    ];

    const createdModules = await db.insert(modules).values(defaultModules).returning();

    const adminRole = createdRoles.find(r => r.name === "Administrador")!;
    const adminPermissions = createdModules.map(m => ({
      roleId: adminRole.id,
      moduleId: m.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }));
    await db.insert(roleModulePermissions).values(adminPermissions);

    const vendedorRole = createdRoles.find(r => r.name === "Vendedor")!;
    const vendedorModules = ["dashboard", "pos", "ventas", "productos", "clientes", "remitos"];
    const vendedorPermissions = createdModules
      .filter(m => vendedorModules.includes(m.code))
      .map(m => ({
        roleId: vendedorRole.id,
        moduleId: m.id,
        canView: true,
        canCreate: m.code !== "productos",
        canEdit: false,
        canDelete: false
      }));
    await db.insert(roleModulePermissions).values(vendedorPermissions);

    const cajeroRole = createdRoles.find(r => r.name === "Cajero")!;
    const cajeroModules = ["dashboard", "pos", "cajas"];
    const cajeroPermissions = createdModules
      .filter(m => cajeroModules.includes(m.code))
      .map(m => ({
        roleId: cajeroRole.id,
        moduleId: m.id,
        canView: true,
        canCreate: m.code === "pos",
        canEdit: false,
        canDelete: false
      }));
    await db.insert(roleModulePermissions).values(cajeroPermissions);
  }

  // === Suppliers ===
  async getSuppliers(search?: string): Promise<Supplier[]> {
    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      return await db.select().from(suppliers)
        .where(
          and(
            eq(suppliers.isActive, true),
            or(
              sql`LOWER(${suppliers.name}) LIKE ${searchPattern}`,
              sql`LOWER(${suppliers.businessName}) LIKE ${searchPattern}`,
              sql`${suppliers.taxId} LIKE ${searchPattern}`,
              sql`${suppliers.phone} LIKE ${searchPattern}`
            )
          )
        );
    }
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true));
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async getSupplierWithDetails(id: number): Promise<SupplierWithDetails | undefined> {
    const supplier = await this.getSupplier(id);
    if (!supplier) return undefined;

    const discounts = await this.getSupplierDiscounts(id);
    const summary = await this.getSupplierAccountSummary(id);

    return {
      ...supplier,
      productDiscounts: discounts,
      currentBalance: summary.currentBalance
    };
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async getSupplierByName(name: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.name, name));
    return supplier;
  }

  async updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier> {
    const [updated] = await db.update(suppliers).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.update(suppliers).set({ isActive: false, updatedAt: new Date() }).where(eq(suppliers.id, id));
  }

  async searchSuppliers(query: string): Promise<Supplier[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    return await db.select().from(suppliers)
      .where(
        and(
          eq(suppliers.isActive, true),
          or(
            sql`LOWER(${suppliers.name}) LIKE ${searchPattern}`,
            sql`LOWER(${suppliers.businessName}) LIKE ${searchPattern}`,
            sql`${suppliers.taxId} LIKE ${searchPattern}`,
            sql`${suppliers.phone} LIKE ${searchPattern}`,
            sql`${suppliers.whatsapp} LIKE ${searchPattern}`,
            sql`LOWER(${suppliers.email}) LIKE ${searchPattern}`
          )
        )
      );
  }

  // === Supplier Account (Cuenta Corriente) ===
  async getSupplierMovements(supplierId: number): Promise<SupplierAccountMovement[]> {
    return await db.select().from(supplierAccountMovements)
      .where(eq(supplierAccountMovements.supplierId, supplierId))
      .orderBy(desc(supplierAccountMovements.createdAt));
  }

  async getSupplierAccountSummary(supplierId: number): Promise<SupplierAccountSummary> {
    const supplier = await this.getSupplier(supplierId);
    const movements = await this.getSupplierMovements(supplierId);

    let totalDebit = 0;
    let totalCredit = 0;

    for (const mov of movements) {
      if (mov.type === 'debit') {
        totalDebit += Number(mov.amount);
      } else {
        totalCredit += Number(mov.amount);
      }
    }

    return {
      supplierId,
      supplierName: supplier?.name || '',
      totalDebit,
      totalCredit,
      currentBalance: totalDebit - totalCredit,
      movements
    };
  }

  async createSupplierMovement(userId: string, request: CreateSupplierMovementRequest): Promise<SupplierAccountMovement> {
    const summary = await this.getSupplierAccountSummary(request.supplierId);
    const newBalance = request.type === 'debit' 
      ? summary.currentBalance + request.amount 
      : summary.currentBalance - request.amount;

    const [movement] = await db.insert(supplierAccountMovements).values({
      supplierId: request.supplierId,
      type: request.type,
      amount: String(request.amount),
      balance: String(newBalance),
      concept: request.concept,
      referenceType: request.referenceType,
      referenceId: request.referenceId,
      documentNumber: request.documentNumber,
      dueDate: request.dueDate ? new Date(request.dueDate) : null,
      notes: request.notes,
      userId
    }).returning();

    return movement;
  }

  // === Supplier Product Discounts ===
  async getSupplierDiscounts(supplierId: number): Promise<SupplierProductDiscount[]> {
    return await db.select().from(supplierProductDiscounts)
      .where(and(
        eq(supplierProductDiscounts.supplierId, supplierId),
        eq(supplierProductDiscounts.isActive, true)
      ));
  }

  async createSupplierDiscount(discount: InsertSupplierDiscount): Promise<SupplierProductDiscount> {
    const [newDiscount] = await db.insert(supplierProductDiscounts).values(discount).returning();
    return newDiscount;
  }

  async updateSupplierDiscount(id: number, updates: Partial<InsertSupplierDiscount>): Promise<SupplierProductDiscount> {
    const [updated] = await db.update(supplierProductDiscounts)
      .set(updates)
      .where(eq(supplierProductDiscounts.id, id))
      .returning();
    return updated;
  }

  async deleteSupplierDiscount(id: number): Promise<void> {
    await db.update(supplierProductDiscounts)
      .set({ isActive: false })
      .where(eq(supplierProductDiscounts.id, id));
  }

  // === PAYMENT METHODS ===
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).orderBy(paymentMethods.sortOrder);
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods)
      .where(eq(paymentMethods.isActive, true))
      .orderBy(paymentMethods.sortOrder);
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const [newMethod] = await db.insert(paymentMethods).values(method).returning();
    return newMethod;
  }

  async updatePaymentMethod(id: number, updates: Partial<InsertPaymentMethod>): Promise<PaymentMethod> {
    const [updated] = await db.update(paymentMethods)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id))
      .returning();
    return updated;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await db.update(paymentMethods)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id));
  }

  async seedDefaultPaymentMethods(): Promise<void> {
    const existing = await db.select().from(paymentMethods);
    if (existing.length === 0) {
      const defaults: InsertPaymentMethod[] = [
        { code: "cash", name: "Efectivo", sortOrder: 1 },
        { code: "card", name: "Tarjeta", allowsInstallments: true, sortOrder: 2 },
        { code: "transfer", name: "Transferencia", requiresReference: true, sortOrder: 3 },
        { code: "check", name: "Cheque", requiresReference: true, sortOrder: 4 },
        { code: "credit_account", name: "Cuenta Corriente", sortOrder: 5 },
        { code: "echeq", name: "E-Cheq", requiresReference: true, sortOrder: 6 },
      ];
      await db.insert(paymentMethods).values(defaults);
    }
  }

  // === CARD CONFIGURATIONS ===
  async getCardConfigurations(): Promise<CardConfiguration[]> {
    return await db.select().from(cardConfigurations);
  }

  async getActiveCards(): Promise<CardConfiguration[]> {
    return await db.select().from(cardConfigurations)
      .where(eq(cardConfigurations.isActive, true));
  }

  async getCardWithPlans(cardId: number): Promise<CardWithPlans | undefined> {
    const [card] = await db.select().from(cardConfigurations)
      .where(eq(cardConfigurations.id, cardId));
    if (!card) return undefined;
    
    const plans = await db.select().from(cardInstallmentPlans)
      .where(and(
        eq(cardInstallmentPlans.cardConfigId, cardId),
        eq(cardInstallmentPlans.isActive, true)
      ))
      .orderBy(cardInstallmentPlans.installments);
    
    return { ...card, installmentPlans: plans };
  }

  async getAllCardsWithPlans(): Promise<CardWithPlans[]> {
    const cards = await db.select().from(cardConfigurations);
    const result: CardWithPlans[] = [];
    
    for (const card of cards) {
      const plans = await db.select().from(cardInstallmentPlans)
        .where(and(
          eq(cardInstallmentPlans.cardConfigId, card.id),
          eq(cardInstallmentPlans.isActive, true)
        ))
        .orderBy(cardInstallmentPlans.installments);
      result.push({ ...card, installmentPlans: plans });
    }
    
    return result;
  }

  async createCardConfiguration(config: InsertCardConfig): Promise<CardConfiguration> {
    const [newCard] = await db.insert(cardConfigurations).values(config).returning();
    return newCard;
  }

  async updateCardConfiguration(id: number, updates: Partial<InsertCardConfig>): Promise<CardConfiguration> {
    const [updated] = await db.update(cardConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cardConfigurations.id, id))
      .returning();
    return updated;
  }

  async deleteCardConfiguration(id: number): Promise<void> {
    await db.update(cardConfigurations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(cardConfigurations.id, id));
  }

  // === INSTALLMENT PLANS ===
  async getCardInstallmentPlans(cardConfigId: number): Promise<CardInstallmentPlan[]> {
    return await db.select().from(cardInstallmentPlans)
      .where(eq(cardInstallmentPlans.cardConfigId, cardConfigId))
      .orderBy(cardInstallmentPlans.installments);
  }

  async createInstallmentPlan(plan: InsertCardInstallment): Promise<CardInstallmentPlan> {
    const [newPlan] = await db.insert(cardInstallmentPlans).values(plan).returning();
    return newPlan;
  }

  async updateInstallmentPlan(id: number, updates: Partial<InsertCardInstallment>): Promise<CardInstallmentPlan> {
    const [updated] = await db.update(cardInstallmentPlans)
      .set(updates)
      .where(eq(cardInstallmentPlans.id, id))
      .returning();
    return updated;
  }

  async deleteInstallmentPlan(id: number): Promise<void> {
    await db.update(cardInstallmentPlans)
      .set({ isActive: false })
      .where(eq(cardInstallmentPlans.id, id));
  }

  async seedDefaultCardConfigs(): Promise<void> {
    const existing = await db.select().from(cardConfigurations);
    if (existing.length === 0) {
      const defaultCards: InsertCardConfig[] = [
        { cardBrand: "visa", cardType: "credit", displayName: "Visa Crédito", maxInstallments: 12 },
        { cardBrand: "visa", cardType: "debit", displayName: "Visa Débito", maxInstallments: 1 },
        { cardBrand: "mastercard", cardType: "credit", displayName: "Mastercard Crédito", maxInstallments: 12 },
        { cardBrand: "mastercard", cardType: "debit", displayName: "Mastercard Débito", maxInstallments: 1 },
        { cardBrand: "amex", cardType: "credit", displayName: "American Express", maxInstallments: 12 },
        { cardBrand: "cabal", cardType: "credit", displayName: "Cabal Crédito", maxInstallments: 6 },
        { cardBrand: "naranja", cardType: "credit", displayName: "Naranja", maxInstallments: 12 },
      ];
      
      for (const card of defaultCards) {
        const [inserted] = await db.insert(cardConfigurations).values(card).returning();
        
        // Add default installment plans for credit cards
        if (card.cardType === "credit" && card.maxInstallments && card.maxInstallments > 1) {
          const plans: InsertCardInstallment[] = [
            { cardConfigId: inserted.id, installments: 1, surchargePercent: "0", description: "1 pago" },
            { cardConfigId: inserted.id, installments: 3, surchargePercent: "5", description: "3 cuotas" },
            { cardConfigId: inserted.id, installments: 6, surchargePercent: "10", description: "6 cuotas" },
          ];
          if (card.maxInstallments >= 12) {
            plans.push({ cardConfigId: inserted.id, installments: 12, surchargePercent: "15", description: "12 cuotas" });
          }
          await db.insert(cardInstallmentPlans).values(plans);
        }
      }
    }
  }

  // === BANK ACCOUNTS ===
  async getBankAccounts(): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts);
  }

  async getActiveBankAccounts(): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts)
      .where(eq(bankAccounts.isActive, true));
  }

  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts)
      .where(eq(bankAccounts.id, id));
    return account;
  }

  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    // If setting as default, unset other defaults
    if (account.isDefault) {
      await db.update(bankAccounts)
        .set({ isDefault: false })
        .where(eq(bankAccounts.isDefault, true));
    }
    const [newAccount] = await db.insert(bankAccounts).values(account).returning();
    return newAccount;
  }

  async updateBankAccount(id: number, updates: Partial<InsertBankAccount>): Promise<BankAccount> {
    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await db.update(bankAccounts)
        .set({ isDefault: false })
        .where(eq(bankAccounts.isDefault, true));
    }
    const [updated] = await db.update(bankAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bankAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteBankAccount(id: number): Promise<void> {
    await db.update(bankAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(bankAccounts.id, id));
  }

  // === CASH REGISTERS ===
  async getCashRegisters(): Promise<CashRegister[]> {
    return await db.select().from(cashRegisters).orderBy(cashRegisters.name);
  }

  async getActiveCashRegisters(): Promise<CashRegister[]> {
    return await db.select().from(cashRegisters)
      .where(eq(cashRegisters.isActive, true))
      .orderBy(cashRegisters.name);
  }

  async getCashRegister(id: number): Promise<CashRegister | undefined> {
    const [register] = await db.select().from(cashRegisters)
      .where(eq(cashRegisters.id, id));
    return register;
  }

  async createCashRegister(register: InsertCashRegister): Promise<CashRegister> {
    const [newRegister] = await db.insert(cashRegisters).values(register).returning();
    return newRegister;
  }

  async updateCashRegister(id: number, updates: Partial<InsertCashRegister>): Promise<CashRegister> {
    const [updated] = await db.update(cashRegisters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cashRegisters.id, id))
      .returning();
    return updated;
  }

  async deleteCashRegister(id: number): Promise<void> {
    await db.update(cashRegisters)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(cashRegisters.id, id));
  }

  async seedDefaultCashRegister(): Promise<void> {
    const existing = await db.select().from(cashRegisters);
    if (existing.length === 0) {
      await db.insert(cashRegisters).values({
        name: "Caja Principal",
        description: "Caja principal del local",
        isActive: true,
        currentBalance: "0",
      });
    }
  }

  // === CASH REGISTER SESSIONS ===
  async getOpenSessions(): Promise<CashRegisterSession[]> {
    return await db.select().from(cashRegisterSessions)
      .where(eq(cashRegisterSessions.status, "open"))
      .orderBy(desc(cashRegisterSessions.openedAt));
  }

  async getSessionsByRegister(cashRegisterId: number): Promise<CashRegisterSession[]> {
    return await db.select().from(cashRegisterSessions)
      .where(eq(cashRegisterSessions.cashRegisterId, cashRegisterId))
      .orderBy(desc(cashRegisterSessions.openedAt));
  }

  async getSessionWithDetails(sessionId: number): Promise<CashSessionWithDetails | undefined> {
    const [session] = await db.select().from(cashRegisterSessions)
      .where(eq(cashRegisterSessions.id, sessionId));
    
    if (!session) return undefined;

    const [register] = await db.select().from(cashRegisters)
      .where(eq(cashRegisters.id, session.cashRegisterId));

    const movements = await db.select().from(cashMovements)
      .where(eq(cashMovements.sessionId, sessionId))
      .orderBy(desc(cashMovements.createdAt));

    return {
      ...session,
      cashRegister: register,
      movements,
    };
  }

  async openSession(userId: string, cashRegisterId: number, openingBalance: string): Promise<CashRegisterSession> {
    // Check if there's already an open session
    const existing = await db.select().from(cashRegisterSessions)
      .where(and(
        eq(cashRegisterSessions.cashRegisterId, cashRegisterId),
        eq(cashRegisterSessions.status, "open")
      ));
    
    if (existing.length > 0) {
      throw new Error("Ya existe una sesión abierta para esta caja");
    }

    const [session] = await db.insert(cashRegisterSessions).values({
      cashRegisterId,
      openedBy: userId,
      openingBalance,
      status: "open",
    }).returning();

    return session;
  }

  async closeSession(userId: string, sessionId: number, closingBalance: string, notes?: string): Promise<CashRegisterSession> {
    const [session] = await db.select().from(cashRegisterSessions)
      .where(eq(cashRegisterSessions.id, sessionId));

    if (!session) throw new Error("Sesión no encontrada");
    if (session.status === "closed") throw new Error("La sesión ya está cerrada");

    // Calculate expected balance from movements
    const movements = await db.select().from(cashMovements)
      .where(eq(cashMovements.sessionId, sessionId));

    const openingBalance = parseFloat(session.openingBalance);
    let expectedBalance = openingBalance;
    
    for (const mov of movements) {
      const amount = parseFloat(mov.amount);
      if (mov.type === "income" || mov.type === "sale" || mov.type === "transfer_in") {
        expectedBalance += amount;
      } else {
        expectedBalance -= amount;
      }
    }

    const closingBalanceNum = parseFloat(closingBalance);
    const difference = closingBalanceNum - expectedBalance;

    const [updated] = await db.update(cashRegisterSessions)
      .set({
        closedBy: userId,
        closingBalance,
        expectedBalance: expectedBalance.toFixed(2),
        difference: difference.toFixed(2),
        status: "closed",
        closedAt: new Date(),
        notes,
      })
      .where(eq(cashRegisterSessions.id, sessionId))
      .returning();

    // Update cash register current balance
    await db.update(cashRegisters)
      .set({ 
        currentBalance: closingBalance,
        lastClosedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(cashRegisters.id, session.cashRegisterId));

    return updated;
  }

  async getCurrentSession(cashRegisterId: number): Promise<CashRegisterSession | undefined> {
    const [session] = await db.select().from(cashRegisterSessions)
      .where(and(
        eq(cashRegisterSessions.cashRegisterId, cashRegisterId),
        eq(cashRegisterSessions.status, "open")
      ));
    return session;
  }

  // === CASH MOVEMENTS ===
  async getMovementsBySession(sessionId: number): Promise<CashMovement[]> {
    return await db.select().from(cashMovements)
      .where(eq(cashMovements.sessionId, sessionId))
      .orderBy(desc(cashMovements.createdAt));
  }

  async createCashMovement(movement: InsertCashMovement): Promise<CashMovement> {
    // Calculate running balance
    const session = await db.select().from(cashRegisterSessions)
      .where(eq(cashRegisterSessions.id, movement.sessionId));

    if (session.length === 0 || session[0].status !== "open") {
      throw new Error("No hay sesión abierta para registrar movimientos");
    }

    const lastMovements = await db.select().from(cashMovements)
      .where(eq(cashMovements.sessionId, movement.sessionId))
      .orderBy(desc(cashMovements.createdAt))
      .limit(1);

    let runningBalance = parseFloat(session[0].openingBalance);
    if (lastMovements.length > 0 && lastMovements[0].runningBalance) {
      runningBalance = parseFloat(lastMovements[0].runningBalance);
    }

    const amount = parseFloat(movement.amount);
    if (movement.type === "income" || movement.type === "sale" || movement.type === "transfer_in") {
      runningBalance += amount;
    } else {
      runningBalance -= amount;
    }

    const [newMovement] = await db.insert(cashMovements).values({
      ...movement,
      runningBalance: runningBalance.toFixed(2),
    }).returning();

    // Update cash register current balance
    await db.update(cashRegisters)
      .set({ currentBalance: runningBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(cashRegisters.id, movement.cashRegisterId));

    return newMovement;
  }

  async getCashRegisterSummary(cashRegisterId: number): Promise<{ totalIncome: string; totalExpense: string; currentBalance: string }> {
    const [register] = await db.select().from(cashRegisters)
      .where(eq(cashRegisters.id, cashRegisterId));

    const currentSession = await this.getCurrentSession(cashRegisterId);
    
    let totalIncome = 0;
    let totalExpense = 0;

    if (currentSession) {
      const movements = await this.getMovementsBySession(currentSession.id);
      for (const mov of movements) {
        const amount = parseFloat(mov.amount);
        if (mov.type === "income" || mov.type === "sale" || mov.type === "transfer_in") {
          totalIncome += amount;
        } else {
          totalExpense += amount;
        }
      }
    }

    return {
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      currentBalance: register?.currentBalance || "0",
    };
  }

  // === CHECKS WALLET ===
  async getChecks(status?: string): Promise<Check[]> {
    if (status) {
      return await db.select().from(checksWallet)
        .where(eq(checksWallet.status, status))
        .orderBy(asc(checksWallet.dueDate));
    }
    return await db.select().from(checksWallet)
      .orderBy(asc(checksWallet.dueDate));
  }

  async getChecksByClient(clientId: number): Promise<Check[]> {
    return await db.select().from(checksWallet)
      .where(eq(checksWallet.clientId, clientId))
      .orderBy(asc(checksWallet.dueDate));
  }

  async getCheck(id: number): Promise<Check | undefined> {
    const [check] = await db.select().from(checksWallet)
      .where(eq(checksWallet.id, id));
    return check;
  }

  async createCheck(check: InsertCheck): Promise<Check> {
    const [newCheck] = await db.insert(checksWallet).values(check).returning();
    return newCheck;
  }

  async updateCheck(id: number, updates: Partial<InsertCheck>): Promise<Check> {
    const [updated] = await db.update(checksWallet)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(checksWallet.id, id))
      .returning();
    return updated;
  }

  async getChecksWithAlerts(): Promise<CheckWithAlert[]> {
    const checks = await db.select().from(checksWallet)
      .where(eq(checksWallet.status, "pending"))
      .orderBy(asc(checksWallet.dueDate));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return checks.map(check => {
      const dueDate = new Date(check.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntilDue < 0;
      
      let alertLevel: 'normal' | 'warning' | 'urgent' | 'overdue' = 'normal';
      if (isOverdue) alertLevel = 'overdue';
      else if (daysUntilDue <= 3) alertLevel = 'urgent';
      else if (daysUntilDue <= 7) alertLevel = 'warning';

      return {
        ...check,
        daysUntilDue,
        isOverdue,
        alertLevel,
      };
    });
  }

  async depositCheck(id: number, depositAccountId: number): Promise<Check> {
    const [updated] = await db.update(checksWallet)
      .set({
        status: "deposited",
        depositAccountId,
        depositDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(checksWallet.id, id))
      .returning();
    return updated;
  }

  async endorseCheck(id: number, endorsedTo: string): Promise<Check> {
    const [updated] = await db.update(checksWallet)
      .set({
        status: "endorsed",
        endorsedTo,
        endorsedDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(checksWallet.id, id))
      .returning();
    return updated;
  }

  async rejectCheck(id: number, reason: string): Promise<Check> {
    const [updated] = await db.update(checksWallet)
      .set({
        status: "rejected",
        rejectionReason: reason,
        rejectionDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(checksWallet.id, id))
      .returning();
    return updated;
  }

  // === Stock Locations ===
  async getStockLocations(): Promise<StockLocation[]> {
    return db.select().from(stockLocations).where(eq(stockLocations.isActive, true)).orderBy(stockLocations.code);
  }

  async getStockLocation(id: number): Promise<StockLocation | undefined> {
    const [location] = await db.select().from(stockLocations).where(eq(stockLocations.id, id));
    return location;
  }

  async createStockLocation(location: InsertStockLocation): Promise<StockLocation> {
    const [created] = await db.insert(stockLocations).values(location).returning();
    return created;
  }

  async updateStockLocation(id: number, updates: Partial<InsertStockLocation>): Promise<StockLocation> {
    const [updated] = await db.update(stockLocations).set(updates).where(eq(stockLocations.id, id)).returning();
    return updated;
  }

  async deleteStockLocation(id: number): Promise<void> {
    await db.update(stockLocations).set({ isActive: false }).where(eq(stockLocations.id, id));
  }

  async seedDefaultStockLocations(): Promise<void> {
    const existing = await db.select().from(stockLocations);
    if (existing.length === 0) {
      await db.insert(stockLocations).values([
        { code: "A-01-01", name: "Estante A - Nivel 1", zone: "A", aisle: "01", shelf: "01" },
        { code: "A-01-02", name: "Estante A - Nivel 2", zone: "A", aisle: "01", shelf: "02" },
        { code: "B-01-01", name: "Estante B - Nivel 1", zone: "B", aisle: "01", shelf: "01" },
        { code: "DEP-PISO", name: "Depósito Piso", zone: "DEP", description: "Productos grandes en piso" },
      ]);
    }
  }

  // === Stock Movements ===
  async getStockMovements(productId?: number): Promise<StockMovementWithDetails[]> {
    let query = db
      .select({
        id: stockMovements.id,
        productId: stockMovements.productId,
        movementType: stockMovements.movementType,
        quantity: stockMovements.quantity,
        previousStock: stockMovements.previousStock,
        newStock: stockMovements.newStock,
        referenceType: stockMovements.referenceType,
        referenceId: stockMovements.referenceId,
        notes: stockMovements.notes,
        userId: stockMovements.userId,
        createdAt: stockMovements.createdAt,
        product: {
          id: products.id,
          sku: products.sku,
          name: products.name,
          description: products.description,
          categoryId: products.categoryId,
          price: products.price,
          costPrice: products.costPrice,
          stockQuantity: products.stockQuantity,
          minStockLevel: products.minStockLevel,
          maxStockLevel: products.maxStockLevel,
          locationId: products.locationId,
          imageUrl: products.imageUrl,
          isActive: products.isActive,
        }
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .orderBy(desc(stockMovements.createdAt));

    if (productId) {
      return query.where(eq(stockMovements.productId, productId));
    }
    return query;
  }

  async createStockMovement(userId: string, movement: Omit<InsertStockMovement, 'userId' | 'previousStock' | 'newStock'>): Promise<StockMovement> {
    const product = await this.getProduct(movement.productId);
    if (!product) throw new Error("Producto no encontrado");

    const previousStock = product.stockQuantity;
    let newStock = previousStock;

    if (movement.movementType === 'entry' || movement.movementType === 'adjustment_add' || movement.movementType === 'purchase') {
      newStock = previousStock + movement.quantity;
    } else if (movement.movementType === 'exit' || movement.movementType === 'adjustment_subtract' || movement.movementType === 'sale') {
      newStock = previousStock - movement.quantity;
    }

    await db.update(products).set({ stockQuantity: newStock }).where(eq(products.id, movement.productId));

    const [created] = await db.insert(stockMovements).values({
      ...movement,
      userId,
      previousStock,
      newStock,
    }).returning();
    return created;
  }

  async adjustStock(userId: string, productId: number, quantity: number, type: 'add' | 'subtract', notes?: string): Promise<StockMovement> {
    return this.createStockMovement(userId, {
      productId,
      quantity: Math.abs(quantity),
      movementType: type === 'add' ? 'adjustment_add' : 'adjustment_subtract',
      notes,
    });
  }

  async getStockAlerts(): Promise<StockAlert[]> {
    const allProducts = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        categoryId: products.categoryId,
        price: products.price,
        costPrice: products.costPrice,
        stockQuantity: products.stockQuantity,
        minStockLevel: products.minStockLevel,
        maxStockLevel: products.maxStockLevel,
        locationId: products.locationId,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
        location: {
          id: stockLocations.id,
          code: stockLocations.code,
          name: stockLocations.name,
          description: stockLocations.description,
          zone: stockLocations.zone,
          aisle: stockLocations.aisle,
          shelf: stockLocations.shelf,
          bin: stockLocations.bin,
          isActive: stockLocations.isActive,
          createdAt: stockLocations.createdAt,
        }
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(stockLocations, eq(products.locationId, stockLocations.id))
      .where(eq(products.isActive, true));

    const alerts: StockAlert[] = [];

    for (const product of allProducts) {
      const currentStock = product.stockQuantity;
      const minLevel = product.minStockLevel ?? 5;
      const maxLevel = product.maxStockLevel ?? 100;

      if (currentStock === 0) {
        alerts.push({
          product: {
            ...product,
            category: product.category?.id ? product.category : null,
            location: product.location?.id ? product.location : null,
          },
          alertType: 'out_of_stock',
          currentStock,
          minLevel,
          maxLevel,
        });
      } else if (currentStock <= minLevel) {
        alerts.push({
          product: {
            ...product,
            category: product.category?.id ? product.category : null,
            location: product.location?.id ? product.location : null,
          },
          alertType: 'low_stock',
          currentStock,
          minLevel,
          maxLevel,
        });
      } else if (currentStock > maxLevel) {
        alerts.push({
          product: {
            ...product,
            category: product.category?.id ? product.category : null,
            location: product.location?.id ? product.location : null,
          },
          alertType: 'over_stock',
          currentStock,
          minLevel,
          maxLevel,
        });
      }
    }

    return alerts.sort((a, b) => {
      const order = { out_of_stock: 0, low_stock: 1, over_stock: 2 };
      return order[a.alertType] - order[b.alertType];
    });
  }

  // === BRANDS ===
  async getBrands(): Promise<Brand[]> {
    return await db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.name));
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand;
  }

  async getBrandByName(name: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.name, name));
    return brand;
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [created] = await db.insert(brands).values(brand).returning();
    return created;
  }

  async updateBrand(id: number, updates: Partial<InsertBrand>): Promise<Brand> {
    const [updated] = await db.update(brands).set(updates).where(eq(brands.id, id)).returning();
    return updated;
  }

  async deleteBrand(id: number): Promise<void> {
    await db.update(brands).set({ isActive: false }).where(eq(brands.id, id));
  }

  async seedDefaultBrands(): Promise<void> {
    const existing = await db.select().from(brands);
    if (existing.length === 0) {
      await db.insert(brands).values([
        { name: "Stanley" },
        { name: "Tramontina" },
        { name: "Black & Decker" },
        { name: "Pretul" },
        { name: "Sin marca" },
      ]);
    }
  }

  // === WAREHOUSES ===
  async getWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses).where(eq(warehouses.isActive, true)).orderBy(asc(warehouses.name));
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [created] = await db.insert(warehouses).values(warehouse).returning();
    return created;
  }

  async updateWarehouse(id: number, updates: Partial<InsertWarehouse>): Promise<Warehouse> {
    const [updated] = await db.update(warehouses).set(updates).where(eq(warehouses.id, id)).returning();
    return updated;
  }

  async deleteWarehouse(id: number): Promise<void> {
    await db.update(warehouses).set({ isActive: false }).where(eq(warehouses.id, id));
  }

  async seedDefaultWarehouses(): Promise<void> {
    const existing = await db.select().from(warehouses);
    if (existing.length === 0) {
      await db.insert(warehouses).values([
        { code: "DEP-CENTRAL", name: "Depósito Central", isMain: true },
        { code: "SUC-01", name: "Sucursal 1" },
      ]);
    }
  }

  // === PRODUCT WAREHOUSE STOCK ===
  async getProductWarehouseStock(productId: number): Promise<ProductWarehouseStock[]> {
    return await db.select().from(productWarehouseStock)
      .where(eq(productWarehouseStock.productId, productId));
  }

  async updateProductWarehouseStock(productId: number, warehouseId: number, stock: Partial<InsertProductWarehouseStock>): Promise<ProductWarehouseStock> {
    const existing = await db.select().from(productWarehouseStock)
      .where(and(
        eq(productWarehouseStock.productId, productId),
        eq(productWarehouseStock.warehouseId, warehouseId)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(productWarehouseStock)
        .set({ ...stock, updatedAt: new Date() })
        .where(and(
          eq(productWarehouseStock.productId, productId),
          eq(productWarehouseStock.warehouseId, warehouseId)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(productWarehouseStock)
        .values({ productId, warehouseId, ...stock })
        .returning();
      return created;
    }
  }

  async setProductWarehouseStock(data: InsertProductWarehouseStock): Promise<ProductWarehouseStock> {
    const existing = await db.select().from(productWarehouseStock)
      .where(and(
        eq(productWarehouseStock.productId, data.productId),
        eq(productWarehouseStock.warehouseId, data.warehouseId)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(productWarehouseStock)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(productWarehouseStock.productId, data.productId),
          eq(productWarehouseStock.warehouseId, data.warehouseId)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(productWarehouseStock)
        .values(data)
        .returning();
      return created;
    }
  }

  // === SUPPLIER IMPORT TEMPLATES ===
  async getSupplierImportTemplates(supplierId?: number): Promise<SupplierImportTemplate[]> {
    if (supplierId) {
      return await db.select().from(supplierImportTemplates)
        .where(and(
          eq(supplierImportTemplates.supplierId, supplierId),
          eq(supplierImportTemplates.isActive, true)
        ))
        .orderBy(desc(supplierImportTemplates.createdAt));
    }
    return await db.select().from(supplierImportTemplates)
      .where(eq(supplierImportTemplates.isActive, true))
      .orderBy(desc(supplierImportTemplates.createdAt));
  }

  async getSupplierImportTemplate(id: number): Promise<SupplierImportTemplate | undefined> {
    const [template] = await db.select().from(supplierImportTemplates)
      .where(eq(supplierImportTemplates.id, id));
    return template;
  }

  async createSupplierImportTemplate(template: InsertSupplierImportTemplate): Promise<SupplierImportTemplate> {
    const [created] = await db.insert(supplierImportTemplates).values(template).returning();
    return created;
  }

  async updateSupplierImportTemplate(id: number, updates: Partial<InsertSupplierImportTemplate>): Promise<SupplierImportTemplate> {
    const [updated] = await db.update(supplierImportTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supplierImportTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteSupplierImportTemplate(id: number): Promise<void> {
    await db.update(supplierImportTemplates)
      .set({ isActive: false })
      .where(eq(supplierImportTemplates.id, id));
  }

  // === PRICE UPDATE LOGS ===
  async getPriceUpdateLogs(supplierId?: number): Promise<PriceUpdateLog[]> {
    if (supplierId) {
      return await db.select().from(priceUpdateLogs)
        .where(eq(priceUpdateLogs.supplierId, supplierId))
        .orderBy(desc(priceUpdateLogs.createdAt));
    }
    return await db.select().from(priceUpdateLogs)
      .orderBy(desc(priceUpdateLogs.createdAt));
  }

  async getPriceUpdateLog(id: number): Promise<PriceUpdateLog | undefined> {
    const [log] = await db.select().from(priceUpdateLogs)
      .where(eq(priceUpdateLogs.id, id));
    return log;
  }

  async createPriceUpdateLog(log: InsertPriceUpdateLog): Promise<PriceUpdateLog> {
    const [created] = await db.insert(priceUpdateLogs).values(log).returning();
    return created;
  }

  async updatePriceUpdateLog(id: number, updates: Partial<InsertPriceUpdateLog>): Promise<PriceUpdateLog> {
    const [updated] = await db.update(priceUpdateLogs)
      .set(updates)
      .where(eq(priceUpdateLogs.id, id))
      .returning();
    return updated;
  }

  // Obtener productos por código de proveedor
  async getProductsBySupplierCode(supplierId: number): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.supplierId, supplierId),
        eq(products.isActive, true)
      ));
  }

  async getProductBySupplierCode(supplierCode: string, supplierId: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products)
      .where(and(
        eq(products.supplierCode, supplierCode),
        eq(products.supplierId, supplierId),
        eq(products.isActive, true)
      ));
    return product;
  }

  // === COMPANY SETTINGS ===
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings;
  }

  async saveCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const existing = await this.getCompanySettings();
    if (existing) {
      const [updated] = await db.update(companySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(companySettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(companySettings).values(settings).returning();
      return created;
    }
  }

  // === PRINT SETTINGS ===
  async getPrintSettings(): Promise<PrintSettings[]> {
    return await db.select().from(printSettings).where(eq(printSettings.isActive, true));
  }

  async getPrintSetting(documentType: string): Promise<PrintSettings | undefined> {
    const [setting] = await db.select().from(printSettings)
      .where(eq(printSettings.documentType, documentType));
    return setting;
  }

  async savePrintSetting(setting: InsertPrintSettings): Promise<PrintSettings> {
    const existing = await this.getPrintSetting(setting.documentType);
    if (existing) {
      const [updated] = await db.update(printSettings)
        .set({ ...setting, updatedAt: new Date() })
        .where(eq(printSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(printSettings).values(setting).returning();
      return created;
    }
  }

  async seedDefaultPrintSettings(): Promise<void> {
    const existing = await db.select().from(printSettings);
    if (existing.length === 0) {
      await db.insert(printSettings).values([
        { 
          documentType: "remito", 
          documentName: "Remito",
          paperSize: "A6",
          showPrices: false,
          showUnitPrice: false,
          showSubtotal: false,
          showTotal: false,
          showTaxes: false,
          showDiscounts: false,
        },
        { 
          documentType: "factura", 
          documentName: "Factura",
          paperSize: "A4",
          showQrCode: true,
        },
        { 
          documentType: "presupuesto", 
          documentName: "Presupuesto / Cotización",
          paperSize: "A4",
        },
        { 
          documentType: "ticket", 
          documentName: "Ticket de Venta",
          paperSize: "Ticket80",
          showLogo: false,
        },
      ]);
    }
  }

  // === E-COMMERCE SETTINGS ===
  async getEcommerceSettings(): Promise<EcommerceSettings | undefined> {
    const [settings] = await db.select().from(ecommerceSettings).limit(1);
    return settings;
  }

  async saveEcommerceSettings(settings: InsertEcommerceSettings): Promise<EcommerceSettings> {
    const existing = await this.getEcommerceSettings();
    if (existing) {
      const [updated] = await db.update(ecommerceSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(ecommerceSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(ecommerceSettings).values(settings).returning();
      return created;
    }
  }

  // === E-COMMERCE ORDERS ===
  async getEcommerceOrders(): Promise<EcommerceOrder[]> {
    return await db.select().from(ecommerceOrders).orderBy(desc(ecommerceOrders.createdAt));
  }

  async getEcommerceOrder(id: number): Promise<EcommerceOrderWithItems | undefined> {
    const [order] = await db.select().from(ecommerceOrders).where(eq(ecommerceOrders.id, id));
    if (!order) return undefined;
    const items = await db.select().from(ecommerceOrderItems)
      .where(eq(ecommerceOrderItems.orderId, id));
    return { ...order, items };
  }

  async createEcommerceOrder(data: InsertEcommerceOrder, items: InsertEcommerceOrderItem[]): Promise<EcommerceOrderWithItems> {
    const orderNumber = `EC-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
    const [order] = await db.insert(ecommerceOrders)
      .values({ ...data, orderNumber })
      .returning();
    
    const orderItems: EcommerceOrderItem[] = [];
    for (const item of items) {
      const [created] = await db.insert(ecommerceOrderItems)
        .values({ ...item, orderId: order.id })
        .returning();
      orderItems.push(created);
    }
    
    return { ...order, items: orderItems };
  }

  async updateEcommerceOrder(id: number, data: Partial<EcommerceOrder>): Promise<EcommerceOrder> {
    const [updated] = await db.update(ecommerceOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ecommerceOrders.id, id))
      .returning();
    return updated;
  }

  // === PRODUCTOS E-COMMERCE ===
  async getEcommerceProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.publishOnline, true),
        eq(products.isActive, true)
      ))
      .orderBy(products.name);
  }

  // === PURCHASE ORDERS ===
  async getPurchaseOrders(): Promise<(PurchaseOrder & { supplier: Supplier })[]> {
    const orders = await db.select().from(purchaseOrders)
      .orderBy(desc(purchaseOrders.createdAt));
    
    const result = [];
    for (const order of orders) {
      const [supplier] = await db.select().from(suppliers)
        .where(eq(suppliers.id, order.supplierId));
      result.push({ ...order, supplier: supplier! });
    }
    return result;
  }

  async createPurchaseOrder(data: any, items: any[]): Promise<PurchaseOrder> {
    const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
    const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitCost)), 0);
    
    const [order] = await db.insert(purchaseOrders)
      .values({
        orderNumber,
        supplierId: data.supplierId,
        notes: data.notes,
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        subtotal: subtotal.toString(),
        totalAmount: subtotal.toString(),
        status: 'draft'
      })
      .returning();

    for (const item of items) {
      await db.insert(purchaseOrderItems).values({
        purchaseOrderId: order.id,
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        quantity: item.quantity.toString(),
        unitCost: item.unitCost.toString(),
        subtotal: (item.quantity * item.unitCost).toString()
      });
    }

    return order;
  }

  async updatePurchaseOrderStatus(id: number, status: string): Promise<PurchaseOrder> {
    const [updated] = await db.update(purchaseOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updated;
  }

  // === QUOTES ===
  async getQuotes(): Promise<(Quote & { client: Client | null })[]> {
    const allQuotes = await db.select().from(quotes)
      .orderBy(desc(quotes.createdAt));
    
    const result = [];
    for (const quote of allQuotes) {
      let client = null;
      if (quote.clientId) {
        const [c] = await db.select().from(clients).where(eq(clients.id, quote.clientId));
        client = c || null;
      }
      result.push({ ...quote, client });
    }
    return result;
  }

  async createQuote(data: any, items: any[]): Promise<Quote> {
    const quoteNumber = `COT-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
    const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0);
    
    const [quote] = await db.insert(quotes)
      .values({
        quoteNumber,
        clientId: data.clientId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        notes: data.notes,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        subtotal: subtotal.toString(),
        totalAmount: subtotal.toString(),
        status: 'draft'
      })
      .returning();

    for (const item of items) {
      await db.insert(quoteItems).values({
        quoteId: quote.id,
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        subtotal: (item.quantity * item.unitPrice).toString()
      });
    }

    return quote;
  }

  async updateQuoteStatus(id: number, status: string): Promise<Quote> {
    const [updated] = await db.update(quotes)
      .set({ status, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return updated;
  }

  async convertQuoteToSale(quoteId: number): Promise<{ sale: Sale; quote: Quote }> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
    if (!quote) throw new Error("Cotización no encontrada");

    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));

    // Create sale from quote
    const saleRequest = {
      clientId: quote.clientId,
      paymentMethod: 'cash',
      items: items.map(i => ({
        productId: i.productId!,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: 0,
        subtotal: Number(i.subtotal)
      })),
      subtotal: Number(quote.subtotal),
      discount: 0,
      total: Number(quote.totalAmount)
    };

    const sale = await this.createSale(saleRequest);
    const updatedQuote = await this.updateQuoteStatus(quoteId, 'converted');
    await db.update(quotes).set({ convertedToSaleId: sale.id }).where(eq(quotes.id, quoteId));

    return { sale, quote: updatedQuote };
  }

  // === CUSTOMER ORDERS ===
  async getCustomerOrders(): Promise<(CustomerOrder & { client: Client | null })[]> {
    const orders = await db.select().from(customerOrders)
      .orderBy(desc(customerOrders.createdAt));
    
    const result = [];
    for (const order of orders) {
      let client = null;
      if (order.clientId) {
        const [c] = await db.select().from(clients).where(eq(clients.id, order.clientId));
        client = c || null;
      }
      result.push({ ...order, client });
    }
    return result;
  }

  async createCustomerOrder(data: any, items: any[]): Promise<CustomerOrder> {
    const orderNumber = `PED-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
    const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0);
    
    const [order] = await db.insert(customerOrders)
      .values({
        orderNumber,
        clientId: data.clientId,
        notes: data.notes,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        depositAmount: (data.depositAmount || 0).toString(),
        subtotal: subtotal.toString(),
        totalAmount: subtotal.toString(),
        status: 'pending',
        paymentStatus: data.depositAmount > 0 ? 'partial' : 'pending'
      })
      .returning();

    for (const item of items) {
      await db.insert(customerOrderItems).values({
        orderId: order.id,
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        subtotal: (item.quantity * item.unitPrice).toString()
      });
    }

    return order;
  }

  async updateCustomerOrderStatus(id: number, status: string): Promise<CustomerOrder> {
    const updates: any = { status, updatedAt: new Date() };
    if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }
    const [updated] = await db.update(customerOrders)
      .set(updates)
      .where(eq(customerOrders.id, id))
      .returning();
    return updated;
  }

  async convertCustomerOrderToSale(orderId: number): Promise<{ sale: Sale; order: CustomerOrder }> {
    const [order] = await db.select().from(customerOrders).where(eq(customerOrders.id, orderId));
    if (!order) throw new Error("Pedido no encontrado");

    const items = await db.select().from(customerOrderItems).where(eq(customerOrderItems.orderId, orderId));

    const saleRequest = {
      clientId: order.clientId,
      paymentMethod: 'cash',
      items: items.map(i => ({
        productId: i.productId!,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: 0,
        subtotal: Number(i.subtotal)
      })),
      subtotal: Number(order.subtotal),
      discount: 0,
      total: Number(order.totalAmount)
    };

    const sale = await this.createSale(saleRequest);
    await db.update(customerOrders)
      .set({ convertedToSaleId: sale.id, paymentStatus: 'paid' })
      .where(eq(customerOrders.id, orderId));
    
    const [updatedOrder] = await db.select().from(customerOrders).where(eq(customerOrders.id, orderId));

    return { sale, order: updatedOrder };
  }

  // === PRICE LISTS ===
  async getPriceLists(): Promise<PriceList[]> {
    return await db.select().from(priceLists).orderBy(priceLists.name);
  }

  async createPriceList(data: InsertPriceList): Promise<PriceList> {
    // If this is marked as default, unset other defaults
    if (data.isDefault) {
      await db.update(priceLists).set({ isDefault: false });
    }
    const [list] = await db.insert(priceLists).values(data).returning();
    return list;
  }

  async updatePriceList(id: number, data: Partial<PriceList>): Promise<PriceList> {
    if (data.isDefault) {
      await db.update(priceLists).set({ isDefault: false });
    }
    const [updated] = await db.update(priceLists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(priceLists.id, id))
      .returning();
    return updated;
  }

  // === LOYALTY PROGRAM ===
  async getLoyaltyProgram(): Promise<LoyaltyProgram | undefined> {
    const [program] = await db.select().from(loyaltyProgram).limit(1);
    return program;
  }

  async saveLoyaltyProgram(data: InsertLoyaltyProgram): Promise<LoyaltyProgram> {
    const existing = await this.getLoyaltyProgram();
    if (existing) {
      const [updated] = await db.update(loyaltyProgram)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(loyaltyProgram.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(loyaltyProgram).values(data).returning();
      return created;
    }
  }

  async getClientsWithPoints(): Promise<(Client & { loyaltyPoints?: ClientLoyaltyPoints })[]> {
    const allClients = await db.select().from(clients).where(eq(clients.isActive, true));
    const result = [];
    
    for (const client of allClients) {
      const [points] = await db.select().from(clientLoyaltyPoints)
        .where(eq(clientLoyaltyPoints.clientId, client.id));
      result.push({ ...client, loyaltyPoints: points });
    }
    
    return result;
  }

  // === BALANCES ===
  async getClientsWithBalance(): Promise<(Client & { currentBalance: number })[]> {
    const allClients = await db.select().from(clients).where(eq(clients.isActive, true));
    const result = [];
    
    for (const client of allClients) {
      const [balanceResult] = await db.select({
        balance: sql<number>`COALESCE(SUM(CASE WHEN ${clientAccountMovements.movementType} = 'debit' THEN ${clientAccountMovements.amount} ELSE -${clientAccountMovements.amount} END), 0)`
      }).from(clientAccountMovements)
        .where(eq(clientAccountMovements.clientId, client.id));
      
      result.push({ ...client, currentBalance: Number(balanceResult?.balance || 0) });
    }
    
    return result;
  }

  async getSuppliersWithBalance(): Promise<(Supplier & { currentBalance: number })[]> {
    const allSuppliers = await db.select().from(suppliers).where(eq(suppliers.isActive, true));
    const result = [];
    
    for (const supplier of allSuppliers) {
      const [balanceResult] = await db.select({
        balance: sql<number>`COALESCE(SUM(CASE WHEN ${supplierAccountMovements.movementType} = 'debit' THEN ${supplierAccountMovements.amount} ELSE -${supplierAccountMovements.amount} END), 0)`
      }).from(supplierAccountMovements)
        .where(eq(supplierAccountMovements.supplierId, supplier.id));
      
      result.push({ ...supplier, currentBalance: Number(balanceResult?.balance || 0) });
    }
    
    return result;
  }

  // === STOCK ADJUSTMENTS ===
  async createStockAdjustment(data: { productId: number; adjustmentType: string; quantity: number; notes?: string }): Promise<StockMovement> {
    const [product] = await db.select().from(products).where(eq(products.id, data.productId));
    if (!product) throw new Error("Producto no encontrado");

    const previousStock = product.stockQuantity;
    let newStock: number;
    let quantityChange: number;

    if (data.adjustmentType === 'add') {
      newStock = previousStock + data.quantity;
      quantityChange = data.quantity;
    } else if (data.adjustmentType === 'subtract') {
      newStock = previousStock - data.quantity;
      quantityChange = -data.quantity;
    } else { // set
      newStock = data.quantity;
      quantityChange = data.quantity - previousStock;
    }

    // Update product stock
    await db.update(products)
      .set({ stockQuantity: newStock, updatedAt: new Date() })
      .where(eq(products.id, data.productId));

    // Create stock movement record
    const [movement] = await db.insert(stockMovements)
      .values({
        productId: data.productId,
        movementType: 'adjustment',
        quantity: quantityChange,
        previousStock,
        newStock,
        notes: data.notes || `Ajuste manual: ${data.adjustmentType}`
      })
      .returning();

    return movement;
  }

  // === BULK UPDATE PRODUCTS ===
  async bulkUpdateProducts(productIds: number[], editType: string, value: string): Promise<{ updated: number }> {
    let updateCount = 0;

    for (const id of productIds) {
      const [product] = await db.select().from(products).where(eq(products.id, id));
      if (!product) continue;

      let updates: Partial<Product> = { updatedAt: new Date() };

      switch (editType) {
        case 'price_percent':
          const percentChange = parseFloat(value);
          const newPrice = Number(product.price) * (1 + percentChange / 100);
          updates.price = newPrice.toFixed(2);
          break;
        case 'price_fixed':
          updates.price = parseFloat(value).toFixed(2);
          break;
        case 'profit':
          updates.profitPercent = parseFloat(value);
          // Recalculate price based on cost and new profit
          const cost = Number(product.costWithTax || product.costPrice || 0);
          if (cost > 0) {
            updates.price = (cost * (1 + parseFloat(value) / 100)).toFixed(2);
          }
          break;
        case 'status':
          updates.isActive = value === '1';
          break;
      }

      await db.update(products).set(updates).where(eq(products.id, id));
      updateCount++;
    }

    return { updated: updateCount };
  }

  // === EMPLOYEES ===
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(employees.lastName);
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(data).returning();
    return employee;
  }

  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    const [updated] = await db.update(employees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updated;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.update(employees)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(employees.id, id));
  }

  // === PAYROLL PAYMENTS ===
  async getPayrollPayments(): Promise<PayrollPayment[]> {
    return await db.select().from(payrollPayments).orderBy(desc(payrollPayments.paymentDate));
  }

  async createPayrollPayment(data: InsertPayrollPayment): Promise<PayrollPayment> {
    const [payment] = await db.insert(payrollPayments).values(data).returning();
    return payment;
  }

  async markPayrollPaymentPaid(id: number): Promise<PayrollPayment> {
    const [updated] = await db.update(payrollPayments)
      .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
      .where(eq(payrollPayments.id, id))
      .returning();
    return updated;
  }

  // === EMPLOYEE ADVANCES ===
  async getEmployeeAdvances(): Promise<EmployeeAdvance[]> {
    return await db.select().from(employeeAdvances).orderBy(desc(employeeAdvances.requestDate));
  }

  async createEmployeeAdvance(data: InsertEmployeeAdvance): Promise<EmployeeAdvance> {
    const [advance] = await db.insert(employeeAdvances).values(data).returning();
    return advance;
  }

  async approveEmployeeAdvance(id: number): Promise<EmployeeAdvance> {
    const [updated] = await db.update(employeeAdvances)
      .set({ status: 'approved', approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(employeeAdvances.id, id))
      .returning();
    return updated;
  }

  async payEmployeeAdvance(id: number): Promise<EmployeeAdvance> {
    const [updated] = await db.update(employeeAdvances)
      .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
      .where(eq(employeeAdvances.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
