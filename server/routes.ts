import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Products Routes ===
  app.get(api.products.list.path, isAuthenticated, async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const products = await storage.getProducts(search, categoryId);
    res.json(products);
  });

  app.get(api.products.get.path, isAuthenticated, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.products.update.path, isAuthenticated, async (req, res) => {
    const input = api.products.update.input.parse(req.body);
    const product = await storage.updateProduct(Number(req.params.id), input);
    res.json(product);
  });

  app.delete(api.products.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  // === Categories Routes ===
  app.get(api.categories.list.path, isAuthenticated, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post(api.categories.create.path, isAuthenticated, async (req, res) => {
    const input = api.categories.create.input.parse(req.body);
    const category = await storage.createCategory(input.name, input.description || undefined);
    res.status(201).json(category);
  });

  // === Clients Routes ===
  app.get(api.clients.list.path, isAuthenticated, async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const clients = await storage.getClients(search);
    res.json(clients);
  });

  app.get(api.clients.get.path, isAuthenticated, async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  app.post(api.clients.create.path, isAuthenticated, async (req, res) => {
    const input = api.clients.create.input.parse(req.body);
    const client = await storage.createClient(input);
    res.status(201).json(client);
  });

  app.put(api.clients.update.path, isAuthenticated, async (req, res) => {
    const input = api.clients.update.input.parse(req.body);
    const client = await storage.updateClient(Number(req.params.id), input);
    res.json(client);
  });

  // === Sales Routes ===
  app.post(api.sales.create.path, isAuthenticated, async (req, res) => {
    const input = api.sales.create.input.parse(req.body);
    const user = req.user as any;
    // user.claims.sub is the replit auth user id
    const sale = await storage.createSale(user.claims.sub, input);
    res.status(201).json(sale);
  });

  app.get(api.sales.list.path, isAuthenticated, async (req, res) => {
    const sales = await storage.getSales();
    res.json(sales);
  });

  app.get(api.sales.get.path, isAuthenticated, async (req, res) => {
    const sale = await storage.getSale(Number(req.params.id));
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.json(sale);
  });

  // === Stats Routes ===
  app.get(api.stats.dashboard.path, isAuthenticated, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // === Delivery Notes (Remitos) Routes ===
  // IMPORTANT: specific routes before parameterized routes
  app.get(api.deliveryNotes.pendingByClient.path, isAuthenticated, async (req, res) => {
    const pending = await storage.getPendingDeliveryNotesByClient();
    res.json(pending);
  });

  app.get(api.deliveryNotes.list.path, isAuthenticated, async (req, res) => {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const notes = await storage.getDeliveryNotes(clientId);
    res.json(notes);
  });

  app.get(api.deliveryNotes.get.path, isAuthenticated, async (req, res) => {
    const note = await storage.getDeliveryNote(Number(req.params.id));
    if (!note) return res.status(404).json({ message: "Remito no encontrado" });
    res.json(note);
  });

  app.post(api.deliveryNotes.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.deliveryNotes.create.input.parse(req.body);
      const user = req.user as any;
      const note = await storage.createDeliveryNote(user.claims.sub, input);
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.deliveryNotes.updateStatus.path, isAuthenticated, async (req, res) => {
    const { status } = api.deliveryNotes.updateStatus.input.parse(req.body);
    const note = await storage.updateDeliveryNoteStatus(Number(req.params.id), status);
    res.json(note);
  });

  // === Pre-Invoices (Pre-Facturas) Routes ===
  app.get(api.preInvoices.list.path, isAuthenticated, async (req, res) => {
    const preInvoices = await storage.getPreInvoices();
    res.json(preInvoices);
  });

  app.get(api.preInvoices.get.path, isAuthenticated, async (req, res) => {
    const preInvoice = await storage.getPreInvoice(Number(req.params.id));
    if (!preInvoice) return res.status(404).json({ message: "Pre-Factura no encontrada" });
    res.json(preInvoice);
  });

  app.post(api.preInvoices.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.preInvoices.create.input.parse(req.body);
      const user = req.user as any;
      const preInvoice = await storage.createPreInvoice(user.claims.sub, input);
      res.status(201).json(preInvoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.preInvoices.updateStatus.path, isAuthenticated, async (req, res) => {
    const { status, adminNotes } = api.preInvoices.updateStatus.input.parse(req.body);
    const user = req.user as any;
    const preInvoice = await storage.updatePreInvoiceStatus(
      Number(req.params.id), 
      status, 
      adminNotes,
      user.claims.sub
    );
    res.json(preInvoice);
  });

  // === SEED DATA ===
  // Simple seed check
  const cats = await storage.getCategories();
  if (cats.length === 0) {
    console.log("Seeding database...");
    
    // Categories
    const tools = await storage.createCategory("Herramientas Manuales", "Martillos, destornilladores, llaves");
    const powerTools = await storage.createCategory("Herramientas Eléctricas", "Taladros, amoladoras, sierras");
    const plumbing = await storage.createCategory("Plomería", "Caños, grifería, accesorios");
    const painting = await storage.createCategory("Pinturería", "Pinturas, pinceles, rodillos");

    // Products
    await storage.createProduct({
      sku: "HAM-001",
      name: "Martillo Galponero 500g",
      description: "Mango de madera, cabeza acero forjado",
      categoryId: tools.id,
      price: "15000.00",
      stockQuantity: 25,
      minStockLevel: 5,
      imageUrl: "https://placehold.co/400x400/png?text=Martillo"
    });

    await storage.createProduct({
      sku: "DRILL-PRO-20V",
      name: "Taladro Inalámbrico 20V",
      description: "Batería litio, maletín incluido",
      categoryId: powerTools.id,
      price: "185000.00",
      stockQuantity: 8,
      minStockLevel: 2,
      imageUrl: "https://placehold.co/400x400/png?text=Taladro"
    });

    await storage.createProduct({
      sku: "PAINT-LAT-20L",
      name: "Látex Interior Blanco 20L",
      description: "Lavable, alto poder cubritivo",
      categoryId: painting.id,
      price: "65000.00",
      stockQuantity: 15,
      minStockLevel: 10,
      imageUrl: "https://placehold.co/400x400/png?text=Látex+20L"
    });

    await storage.createProduct({
      sku: "TAPE-MET-5M",
      name: "Cinta Métrica 5m",
      description: "Cinta de acero, freno automático",
      categoryId: tools.id,
      price: "4500.00",
      stockQuantity: 50,
      minStockLevel: 10,
      imageUrl: "https://placehold.co/400x400/png?text=Cinta+Métrica"
    });

    // Clients
    await storage.createClient({
      name: "Juan Perez",
      email: "juan.perez@email.com",
      phone: "11-2233-4455",
      address: "Av. Siempre Viva 123",
      taxId: "20-12345678-9",
      notes: "Cliente frecuente"
    });

    console.log("Database seeded!");
  }

  // Seed default roles and modules
  await storage.seedDefaultRolesAndModules();

  // === Roles Routes ===
  app.get("/api/roles", isAuthenticated, async (req, res) => {
    const roles = await storage.getRoles();
    res.json(roles);
  });

  app.get("/api/roles/:id", isAuthenticated, async (req, res) => {
    const role = await storage.getRole(Number(req.params.id));
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json(role);
  });

  app.post("/api/roles", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        description: z.string().optional()
      });
      const input = schema.parse(req.body);
      const role = await storage.createRole(input);
      res.status(201).json(role);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/roles/:id", isAuthenticated, async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional()
    });
    const input = schema.parse(req.body);
    const role = await storage.updateRole(Number(req.params.id), input);
    res.json(role);
  });

  app.delete("/api/roles/:id", isAuthenticated, async (req, res) => {
    await storage.deleteRole(Number(req.params.id));
    res.status(204).send();
  });

  app.put("/api/roles/:id/permissions", isAuthenticated, async (req, res) => {
    const schema = z.object({
      permissions: z.array(z.object({
        moduleId: z.number(),
        canView: z.boolean(),
        canCreate: z.boolean(),
        canEdit: z.boolean(),
        canDelete: z.boolean()
      }))
    });
    const input = schema.parse(req.body);
    await storage.setRolePermissions(Number(req.params.id), input.permissions);
    res.json({ success: true });
  });

  // === Modules Routes ===
  app.get("/api/modules", isAuthenticated, async (req, res) => {
    const modules = await storage.getModules();
    res.json(modules);
  });

  app.put("/api/modules/:id/status", isAuthenticated, async (req, res) => {
    const schema = z.object({ isActive: z.boolean() });
    const input = schema.parse(req.body);
    const module = await storage.updateModuleStatus(Number(req.params.id), input.isActive);
    res.json(module);
  });

  // === Users Routes ===
  app.get("/api/users", isAuthenticated, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    const userId = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.put("/api/users/:id/role", isAuthenticated, async (req, res) => {
    const schema = z.object({ roleId: z.number() });
    const input = schema.parse(req.body);
    const userId = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
    const user = await storage.updateUserRole(userId, input.roleId);
    res.json(user);
  });

  app.put("/api/users/:id/status", isAuthenticated, async (req, res) => {
    const schema = z.object({ isActive: z.boolean() });
    const input = schema.parse(req.body);
    const userId = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
    const user = await storage.updateUserStatus(userId, input.isActive);
    res.json(user);
  });

  return httpServer;
}
