import { db } from "./db";
import { eq, desc, sql, sum, count, and, inArray } from "drizzle-orm";
import { 
  products, categories, clients, sales, saleItems,
  deliveryNotes, deliveryNoteItems, preInvoices, preInvoiceDeliveryNotes,
  roles, modules, roleModulePermissions, users,
  type Product, type InsertProduct,
  type Category,
  type Client, type InsertClient,
  type Sale, type SaleItem, type CreateSaleRequest,
  type DashboardStats, type SaleWithDetails,
  type DeliveryNote, type DeliveryNoteWithDetails, type CreateDeliveryNoteRequest,
  type PreInvoice, type PreInvoiceWithDetails, type CreatePreInvoiceRequest,
  type ClientWithPendingNotes,
  type Role, type InsertRole, type Module, type InsertModule,
  type RoleModulePermission, type User, type UserWithRole, type RoleWithPermissions
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
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<InsertClient>): Promise<Client>;

  // Sales
  createSale(userId: string, request: CreateSaleRequest): Promise<Sale>;
  getSales(): Promise<SaleWithDetails[]>;
  getSale(id: number): Promise<SaleWithDetails | undefined>;

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

  async createCategory(name: string, description?: string): Promise<Category> {
    const [category] = await db.insert(categories).values({ name, description }).returning();
    return category;
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
    const [updatedClient] = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
    return updatedClient;
  }

  // === Sales ===
  async createSale(userId: string, request: CreateSaleRequest): Promise<Sale> {
    // Transaction logic would be ideal here, but simpler approach for MVP
    
    // Calculate total
    let totalAmount = 0;
    for (const item of request.items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    // Create Sale Header
    const receiptNumber = `REC-${nanoid(8).toUpperCase()}`;
    const [sale] = await db.insert(sales).values({
      receiptNumber,
      clientId: request.clientId,
      userId,
      totalAmount: totalAmount.toString(),
      paymentMethod: request.paymentMethod,
      status: "completed"
    }).returning();

    // Create Sale Items and Update Stock
    for (const item of request.items) {
      const subtotal = item.quantity * item.unitPrice;
      
      await db.insert(saleItems).values({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: subtotal.toString()
      });

      // Update Stock
      const product = await this.getProduct(item.productId);
      if (product) {
        await this.updateProduct(item.productId, {
          stockQuantity: product.stockQuantity - item.quantity
        });
      }
    }

    return sale;
  }

  async getSales(): Promise<SaleWithDetails[]> {
    // Use Drizzle relations for cleaner fetching if setup, but simple query join works too
    const allSales = await db.query.sales.findMany({
      with: {
        client: true,
        items: {
          with: {
            product: true
          }
        }
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
        }
      }
    });
    return sale;
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
}

export const storage = new DatabaseStorage();
