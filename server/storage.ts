import { db } from "./db";
import { eq, desc, sql, sum, count } from "drizzle-orm";
import { 
  products, categories, clients, sales, saleItems,
  type Product, type InsertProduct,
  type Category,
  type Client, type InsertClient,
  type Sale, type SaleItem, type CreateSaleRequest,
  type DashboardStats, type SaleWithDetails
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
}

export const storage = new DatabaseStorage();
