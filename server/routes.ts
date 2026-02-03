import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { isAuthenticated } from "./replit_integrations/auth";
import OpenAI from "openai";
import { emitDataChange } from "./websocket";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
      emitDataChange("products");
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Import products endpoint with brand/category/supplier name resolution
  app.post("/api/products/import", isAuthenticated, async (req, res) => {
    try {
      const data = req.body;
      
      // Handle brand by name
      let brandId = null;
      if (data.brandName && typeof data.brandName === 'string' && data.brandName.trim()) {
        const existingBrand = await storage.getBrandByName(data.brandName.trim());
        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          const newBrand = await storage.createBrand({ name: data.brandName.trim() });
          brandId = newBrand.id;
        }
      }

      // Handle category by name
      let categoryId = null;
      if (data.categoryName && typeof data.categoryName === 'string' && data.categoryName.trim()) {
        const existingCategory = await storage.getCategoryByName(data.categoryName.trim());
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const newCategory = await storage.createCategory({ name: data.categoryName.trim() });
          categoryId = newCategory.id;
        }
      }

      // Handle supplier by name
      let supplierId = null;
      if (data.supplierName && typeof data.supplierName === 'string' && data.supplierName.trim()) {
        const existingSupplier = await storage.getSupplierByName(data.supplierName.trim());
        if (existingSupplier) {
          supplierId = existingSupplier.id;
        } else {
          const newSupplier = await storage.createSupplier({ 
            name: data.supplierName.trim(),
          });
          supplierId = newSupplier.id;
        }
      }

      // Build product data
      const productData = {
        sku: data.sku || `SKU-${Date.now()}`,
        name: data.name || "Sin nombre",
        description: data.description || null,
        barcode: data.barcode || null,
        additionalCode1: data.additionalCode1 || null,
        additionalCode2: data.additionalCode2 || null,
        categoryId,
        brandId,
        supplierId,
        stockUnit: data.stockUnit || "unidad",
        saleUnit: data.saleUnit || "unidad",
        listCostNoTax: data.listCostNoTax || data.costNoTax || "0",
        bulkQuantity: parseInt(data.bulkQuantity) || 1,
        costNoTax: data.costNoTax || "0",
        costWithTax: data.costWithTax || "0",
        profitPercent: data.profitPercent || "60",
        priceNoTax: data.priceNoTax || "0",
        priceWithTax: data.priceWithTax || data.price || "0",
        price: data.price || data.priceWithTax || "0",
        stockQuantity: parseInt(data.stockQuantity) || 0,
        minStockLevel: parseInt(data.minStockLevel) || 5,
        reorderPoint: parseInt(data.reorderPoint) || 10,
        supplierDiscount1: data.supplierDiscount1 || "0",
        supplierDiscount2: data.supplierDiscount2 || "0",
        supplierDiscount3: data.supplierDiscount3 || "0",
        supplierDiscount4: data.supplierDiscount4 || "0",
        isActive: true,
      };

      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (err: any) {
      console.error("Import error:", err);
      res.status(400).json({ message: err.message || "Error al importar producto" });
    }
  });

  app.put(api.products.update.path, isAuthenticated, async (req, res) => {
    const input = api.products.update.input.parse(req.body);
    const product = await storage.updateProduct(Number(req.params.id), input);
    emitDataChange("products");
    res.json(product);
  });

  app.patch("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.updateProduct(Number(req.params.id), req.body);
      emitDataChange("products");
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al actualizar producto" });
    }
  });

  app.delete(api.products.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    emitDataChange("products");
    res.status(204).send();
  });

  // === Categories Routes ===
  app.get(api.categories.list.path, isAuthenticated, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post(api.categories.create.path, isAuthenticated, async (req, res) => {
    const input = api.categories.create.input.parse(req.body);
    const category = await storage.createCategory({ name: input.name, description: input.description });
    emitDataChange("categories");
    res.status(201).json(category);
  });

  app.put("/api/categories/:id", isAuthenticated, async (req, res) => {
    const category = await storage.updateCategory(Number(req.params.id), req.body);
    emitDataChange("categories");
    res.json(category);
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    emitDataChange("categories");
    res.status(204).send();
  });

  // === ARCA/AFIP CUIT Lookup ===
  app.get("/api/arca/cuit/:cuit", isAuthenticated, async (req, res) => {
    try {
      const cuitParam = String(req.params.cuit);
      const cuit = cuitParam.replace(/\D/g, ''); // Remove non-numeric characters
      
      if (cuit.length !== 11) {
        return res.status(400).json({ message: "CUIT debe tener 11 dígitos" });
      }

      // Use the public API from cuitonline.com
      const response = await fetch(`https://cuitonline.com/detalle/${cuit}`);
      
      if (!response.ok) {
        return res.status(404).json({ message: "No se encontraron datos para este CUIT" });
      }

      const html = await response.text();
      
      // Parse the HTML to extract data
      const nameMatch = html.match(/<h1[^>]*class="[^"]*nombre[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                        html.match(/<title>([^|]+)/i);
      const addressMatch = html.match(/Domicilio Fiscal[^<]*<[^>]*>([^<]+)/i);
      const conditionMatch = html.match(/Condición frente al IVA[^<]*<[^>]*>([^<]+)/i) ||
                             html.match(/(IVA\s*(Responsable|Exento|Monotributo)[^<]*)/i);
      const activityMatch = html.match(/Actividad Principal[^<]*<[^>]*>([^<]+)/i);
      
      // Try alternative parsing for name
      let name = "";
      if (nameMatch && nameMatch[1]) {
        name = nameMatch[1].trim().replace(/\s*-\s*CUIT.*$/i, '').trim();
      }
      
      // Determine if it's a company (starts with 30, 33, 34) or person (20, 23, 24, 27)
      const prefix = cuit.substring(0, 2);
      const isCompany = ['30', '33', '34'].includes(prefix);
      
      const result = {
        cuit: cuit,
        name: name || null,
        address: addressMatch ? addressMatch[1].trim() : null,
        ivaCondition: conditionMatch ? conditionMatch[1].trim() : null,
        activity: activityMatch ? activityMatch[1].trim() : null,
        isCompany: isCompany,
        found: !!name
      };

      // If we couldn't find data from cuitonline, try alternative API
      if (!result.found) {
        try {
          const altResponse = await fetch(`https://afip.tangofactura.com/Rest/GetContribuyenteFull?cuit=${cuit}`);
          if (altResponse.ok) {
            const altData = await altResponse.json();
            if (altData && altData.Contribuyente) {
              const contrib = altData.Contribuyente;
              result.name = contrib.nombre || contrib.razonSocial || null;
              result.address = contrib.domicilioFiscal ? 
                `${contrib.domicilioFiscal.direccion || ''}, ${contrib.domicilioFiscal.localidad || ''}, ${contrib.domicilioFiscal.provincia || ''}`.replace(/^,\s*|,\s*$/g, '') : 
                null;
              result.ivaCondition = contrib.estadoClave || null;
              result.found = !!result.name;
            }
          }
        } catch (altError) {
          console.log("Alternative API failed, continuing with partial data");
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching CUIT data:", error);
      res.status(500).json({ message: "Error al consultar datos del CUIT" });
    }
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
    emitDataChange("clients");
    res.status(201).json(client);
  });

  app.put(api.clients.update.path, isAuthenticated, async (req, res) => {
    const input = api.clients.update.input.parse(req.body);
    const client = await storage.updateClient(Number(req.params.id), input);
    emitDataChange("clients");
    res.json(client);
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    await storage.deleteClient(Number(req.params.id));
    emitDataChange("clients");
    res.status(204).send();
  });

  app.get("/api/clients/search/:query", isAuthenticated, async (req, res) => {
    const clients = await storage.searchClients(req.params.query);
    res.json(clients);
  });

  app.get("/api/clients/:id/details", isAuthenticated, async (req, res) => {
    const client = await storage.getClientWithDetails(Number(req.params.id));
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  // === Authorized Contacts Routes ===
  app.get("/api/clients/:clientId/contacts", isAuthenticated, async (req, res) => {
    const contacts = await storage.getAuthorizedContacts(Number(req.params.clientId));
    res.json(contacts);
  });

  app.post("/api/clients/:clientId/contacts", isAuthenticated, async (req, res) => {
    try {
      const contactSchema = z.object({
        name: z.string().min(1),
        dni: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        position: z.string().optional(),
        notes: z.string().optional()
      });
      const input = contactSchema.parse(req.body);
      const contact = await storage.createAuthorizedContact({
        ...input,
        clientId: Number(req.params.clientId)
      });
      res.status(201).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/contacts/:id", isAuthenticated, async (req, res) => {
    const contact = await storage.updateAuthorizedContact(Number(req.params.id), req.body);
    res.json(contact);
  });

  app.delete("/api/contacts/:id", isAuthenticated, async (req, res) => {
    await storage.deleteAuthorizedContact(Number(req.params.id));
    res.status(204).send();
  });

  // === Client Account (Cuenta Corriente) Routes ===
  app.get("/api/clients/:clientId/account", isAuthenticated, async (req, res) => {
    const summary = await storage.getClientAccountSummary(Number(req.params.clientId));
    res.json(summary);
  });

  app.get("/api/clients/:clientId/movements", isAuthenticated, async (req, res) => {
    const movements = await storage.getClientMovements(Number(req.params.clientId));
    res.json(movements);
  });

  app.post("/api/clients/:clientId/movements", isAuthenticated, async (req, res) => {
    try {
      const movementSchema = z.object({
        type: z.enum(["debit", "credit"]),
        amount: z.number().positive(),
        concept: z.string().min(1),
        referenceType: z.string().optional(),
        referenceId: z.number().optional(),
        documentNumber: z.string().optional(),
        notes: z.string().optional()
      });
      const input = movementSchema.parse(req.body);
      const user = req.user as any;
      const movement = await storage.createAccountMovement(user.claims.sub, {
        ...input,
        clientId: Number(req.params.clientId)
      });
      res.status(201).json(movement);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Suppliers Routes ===
  app.get("/api/suppliers", isAuthenticated, async (req, res) => {
    const search = req.query.search as string | undefined;
    const suppliers = await storage.getSuppliers(search);
    res.json(suppliers);
  });

  app.get("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    const supplier = await storage.getSupplier(Number(req.params.id));
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  });

  app.get("/api/suppliers/:id/details", isAuthenticated, async (req, res) => {
    const supplier = await storage.getSupplierWithDetails(Number(req.params.id));
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  });

  app.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const supplierSchema = z.object({
        name: z.string().min(1),
        businessName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        postalCode: z.string().optional(),
        taxId: z.string().optional(),
        taxCondition: z.string().optional(),
        defaultDiscountPercent: z.string().optional(),
        paymentTermDays: z.number().optional(),
        bankName: z.string().optional(),
        bankAccountNumber: z.string().optional(),
        bankCbu: z.string().optional(),
        bankAlias: z.string().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
        notes: z.string().optional()
      });
      const input = supplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(input);
      res.status(201).json(supplier);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    const supplier = await storage.updateSupplier(Number(req.params.id), req.body);
    emitDataChange("suppliers");
    res.json(supplier);
  });

  app.delete("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    await storage.deleteSupplier(Number(req.params.id));
    emitDataChange("suppliers");
    res.status(204).send();
  });

  // === Supplier Account Routes ===
  app.get("/api/suppliers/:supplierId/account", isAuthenticated, async (req, res) => {
    const summary = await storage.getSupplierAccountSummary(Number(req.params.supplierId));
    res.json(summary);
  });

  app.get("/api/suppliers/:supplierId/movements", isAuthenticated, async (req, res) => {
    const movements = await storage.getSupplierMovements(Number(req.params.supplierId));
    res.json(movements);
  });

  app.post("/api/suppliers/:supplierId/movements", isAuthenticated, async (req, res) => {
    try {
      const movementSchema = z.object({
        type: z.enum(["debit", "credit"]),
        amount: z.number().positive(),
        concept: z.string().min(1),
        referenceType: z.string().optional(),
        referenceId: z.number().optional(),
        documentNumber: z.string().optional(),
        dueDate: z.string().optional(),
        notes: z.string().optional()
      });
      const input = movementSchema.parse(req.body);
      const user = req.user as any;
      const movement = await storage.createSupplierMovement(user.claims.sub, {
        ...input,
        supplierId: Number(req.params.supplierId)
      });
      res.status(201).json(movement);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Supplier Product Discounts Routes ===
  app.get("/api/suppliers/:supplierId/discounts", isAuthenticated, async (req, res) => {
    const discounts = await storage.getSupplierDiscounts(Number(req.params.supplierId));
    res.json(discounts);
  });

  app.post("/api/suppliers/:supplierId/discounts", isAuthenticated, async (req, res) => {
    try {
      const discountSchema = z.object({
        productId: z.number().optional(),
        categoryId: z.number().optional(),
        discountPercent: z.string(),
        minQuantity: z.number().optional(),
        validFrom: z.string().optional(),
        validTo: z.string().optional(),
        notes: z.string().optional()
      });
      const input = discountSchema.parse(req.body);
      const discount = await storage.createSupplierDiscount({
        ...input,
        supplierId: Number(req.params.supplierId),
        validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
        validTo: input.validTo ? new Date(input.validTo) : undefined
      });
      res.status(201).json(discount);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete("/api/discounts/:id", isAuthenticated, async (req, res) => {
    await storage.deleteSupplierDiscount(Number(req.params.id));
    res.status(204).send();
  });

  // === Sales Routes ===
  app.post(api.sales.create.path, isAuthenticated, async (req, res) => {
    const input = api.sales.create.input.parse(req.body);
    const user = req.user as any;
    // user.claims.sub is the replit auth user id
    const sale = await storage.createSale(user.claims.sub, input);
    emitDataChange("sales");
    emitDataChange("products"); // Stock changed
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

  app.post("/api/sales/:id/convert-to-remito", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const remito = await storage.convertSaleToRemito(Number(req.params.id), user.claims.sub);
    if (!remito) return res.status(404).json({ message: "Sale not found" });
    emitDataChange("delivery-notes");
    emitDataChange("sales");
    res.status(201).json(remito);
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
      emitDataChange("delivery-notes");
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
    emitDataChange("delivery-notes");
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
    const tools = await storage.createCategory({ name: "Herramientas Manuales", description: "Martillos, destornilladores, llaves" });
    const powerTools = await storage.createCategory({ name: "Herramientas Eléctricas", description: "Taladros, amoladoras, sierras" });
    const plumbing = await storage.createCategory({ name: "Plomería", description: "Caños, grifería, accesorios" });
    const painting = await storage.createCategory({ name: "Pinturería", description: "Pinturas, pinceles, rodillos" });

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

  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
      const user = await storage.updateUser(userId, req.body);
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al actualizar usuario" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al eliminar usuario" });
    }
  });

  // === PAYMENT METHODS MODULE ===
  // Seed default data on startup
  await storage.seedDefaultPaymentMethods();
  await storage.seedDefaultCardConfigs();

  // Payment Methods
  app.get("/api/payment-methods", isAuthenticated, async (req, res) => {
    const methods = await storage.getPaymentMethods();
    res.json(methods);
  });

  app.get("/api/payment-methods/active", isAuthenticated, async (req, res) => {
    const methods = await storage.getActivePaymentMethods();
    res.json(methods);
  });

  app.post("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        code: z.string(),
        name: z.string(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        requiresReference: z.boolean().optional(),
        allowsInstallments: z.boolean().optional(),
        defaultSurchargePercent: z.string().optional(),
        sortOrder: z.number().optional()
      });
      const input = schema.parse(req.body);
      const method = await storage.createPaymentMethod(input);
      res.status(201).json(method);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/payment-methods/:id", isAuthenticated, async (req, res) => {
    const schema = z.object({
      code: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      requiresReference: z.boolean().optional(),
      allowsInstallments: z.boolean().optional(),
      defaultSurchargePercent: z.string().optional(),
      sortOrder: z.number().optional()
    });
    const input = schema.parse(req.body);
    const method = await storage.updatePaymentMethod(Number(req.params.id), input);
    res.json(method);
  });

  app.delete("/api/payment-methods/:id", isAuthenticated, async (req, res) => {
    await storage.deletePaymentMethod(Number(req.params.id));
    res.status(204).send();
  });

  // Card Configurations
  app.get("/api/cards", isAuthenticated, async (req, res) => {
    const cards = await storage.getAllCardsWithPlans();
    res.json(cards);
  });

  app.get("/api/cards/active", isAuthenticated, async (req, res) => {
    const cards = await storage.getActiveCards();
    res.json(cards);
  });

  app.get("/api/cards/:id", isAuthenticated, async (req, res) => {
    const card = await storage.getCardWithPlans(Number(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  });

  app.post("/api/cards", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        cardBrand: z.string(),
        cardType: z.string(),
        displayName: z.string(),
        isActive: z.boolean().optional(),
        defaultSurchargePercent: z.string().optional(),
        maxInstallments: z.number().optional()
      });
      const input = schema.parse(req.body);
      const card = await storage.createCardConfiguration(input);
      res.status(201).json(card);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/cards/:id", isAuthenticated, async (req, res) => {
    const schema = z.object({
      cardBrand: z.string().optional(),
      cardType: z.string().optional(),
      displayName: z.string().optional(),
      isActive: z.boolean().optional(),
      defaultSurchargePercent: z.string().optional(),
      maxInstallments: z.number().optional()
    });
    const input = schema.parse(req.body);
    const card = await storage.updateCardConfiguration(Number(req.params.id), input);
    res.json(card);
  });

  app.delete("/api/cards/:id", isAuthenticated, async (req, res) => {
    await storage.deleteCardConfiguration(Number(req.params.id));
    res.status(204).send();
  });

  // Installment Plans
  app.get("/api/cards/:cardId/installments", isAuthenticated, async (req, res) => {
    const plans = await storage.getCardInstallmentPlans(Number(req.params.cardId));
    res.json(plans);
  });

  app.post("/api/cards/:cardId/installments", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        installments: z.number(),
        surchargePercent: z.string(),
        isActive: z.boolean().optional(),
        description: z.string().optional()
      });
      const input = schema.parse(req.body);
      const plan = await storage.createInstallmentPlan({
        ...input,
        cardConfigId: Number(req.params.cardId)
      });
      res.status(201).json(plan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/installments/:id", isAuthenticated, async (req, res) => {
    const schema = z.object({
      installments: z.number().optional(),
      surchargePercent: z.string().optional(),
      isActive: z.boolean().optional(),
      description: z.string().optional()
    });
    const input = schema.parse(req.body);
    const plan = await storage.updateInstallmentPlan(Number(req.params.id), input);
    res.json(plan);
  });

  app.delete("/api/installments/:id", isAuthenticated, async (req, res) => {
    await storage.deleteInstallmentPlan(Number(req.params.id));
    res.status(204).send();
  });

  // Bank Accounts
  app.get("/api/bank-accounts", isAuthenticated, async (req, res) => {
    const accounts = await storage.getBankAccounts();
    res.json(accounts);
  });

  app.get("/api/bank-accounts/active", isAuthenticated, async (req, res) => {
    const accounts = await storage.getActiveBankAccounts();
    res.json(accounts);
  });

  app.get("/api/bank-accounts/:id", isAuthenticated, async (req, res) => {
    const account = await storage.getBankAccount(Number(req.params.id));
    if (!account) return res.status(404).json({ message: "Bank account not found" });
    res.json(account);
  });

  app.post("/api/bank-accounts", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        bankName: z.string(),
        accountType: z.string(),
        accountNumber: z.string().optional(),
        cbu: z.string().optional(),
        alias: z.string().optional(),
        holderName: z.string(),
        holderCuit: z.string().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
        notes: z.string().optional()
      });
      const input = schema.parse(req.body);
      const account = await storage.createBankAccount(input);
      res.status(201).json(account);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/bank-accounts/:id", isAuthenticated, async (req, res) => {
    const schema = z.object({
      bankName: z.string().optional(),
      accountType: z.string().optional(),
      accountNumber: z.string().optional(),
      cbu: z.string().optional(),
      alias: z.string().optional(),
      holderName: z.string().optional(),
      holderCuit: z.string().optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
      notes: z.string().optional()
    });
    const input = schema.parse(req.body);
    const account = await storage.updateBankAccount(Number(req.params.id), input);
    res.json(account);
  });

  app.delete("/api/bank-accounts/:id", isAuthenticated, async (req, res) => {
    await storage.deleteBankAccount(Number(req.params.id));
    res.status(204).send();
  });

  // === Cash Registers Routes ===
  await storage.seedDefaultCashRegister();
  await storage.seedDefaultStockLocations();
  await storage.seedDefaultBrands();
  await storage.seedDefaultWarehouses();

  app.get("/api/cash-registers", isAuthenticated, async (req, res) => {
    const registers = await storage.getCashRegisters();
    res.json(registers);
  });

  app.get("/api/cash-registers/active", isAuthenticated, async (req, res) => {
    const registers = await storage.getActiveCashRegisters();
    res.json(registers);
  });

  app.get("/api/cash-registers/:id", isAuthenticated, async (req, res) => {
    const register = await storage.getCashRegister(Number(req.params.id));
    if (!register) return res.status(404).json({ message: "Caja no encontrada" });
    res.json(register);
  });

  app.get("/api/cash-registers/:id/summary", isAuthenticated, async (req, res) => {
    const summary = await storage.getCashRegisterSummary(Number(req.params.id));
    res.json(summary);
  });

  app.get("/api/cash-registers/:id/current-session", isAuthenticated, async (req, res) => {
    const session = await storage.getCurrentSession(Number(req.params.id));
    res.json(session || null);
  });

  app.post("/api/cash-registers", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      });
      const input = schema.parse(req.body);
      const register = await storage.createCashRegister(input);
      res.status(201).json(register);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/cash-registers/:id", isAuthenticated, async (req, res) => {
    const schema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    });
    const input = schema.parse(req.body);
    const register = await storage.updateCashRegister(Number(req.params.id), input);
    res.json(register);
  });

  app.delete("/api/cash-registers/:id", isAuthenticated, async (req, res) => {
    await storage.deleteCashRegister(Number(req.params.id));
    res.status(204).send();
  });

  // === Cash Sessions Routes ===
  app.get("/api/cash-sessions/open", isAuthenticated, async (req, res) => {
    const sessions = await storage.getOpenSessions();
    res.json(sessions);
  });

  app.get("/api/cash-registers/:registerId/sessions", isAuthenticated, async (req, res) => {
    const sessions = await storage.getSessionsByRegister(Number(req.params.registerId));
    res.json(sessions);
  });

  app.get("/api/cash-sessions/:id", isAuthenticated, async (req, res) => {
    const session = await storage.getSessionWithDetails(Number(req.params.id));
    if (!session) return res.status(404).json({ message: "Sesión no encontrada" });
    res.json(session);
  });

  app.post("/api/cash-sessions/open", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        cashRegisterId: z.number(),
        openingBalance: z.string(),
      });
      const input = schema.parse(req.body);
      const user = req.user as any;
      const session = await storage.openSession(user.claims.sub, input.cashRegisterId, input.openingBalance);
      res.status(201).json(session);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err.message) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.post("/api/cash-sessions/:id/close", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        closingBalance: z.string(),
        notes: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const user = req.user as any;
      const session = await storage.closeSession(user.claims.sub, Number(req.params.id), input.closingBalance, input.notes);
      res.json(session);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err.message) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  // === Cash Movements Routes ===
  app.get("/api/cash-sessions/:sessionId/movements", isAuthenticated, async (req, res) => {
    const movements = await storage.getMovementsBySession(Number(req.params.sessionId));
    res.json(movements);
  });

  app.post("/api/cash-movements", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        sessionId: z.number(),
        cashRegisterId: z.number(),
        type: z.string(),
        category: z.string().optional(),
        paymentMethodId: z.number().optional(),
        saleId: z.number().optional(),
        amount: z.string(),
        description: z.string().optional(),
        reference: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const user = req.user as any;
      const movement = await storage.createCashMovement({ ...input, userId: user.claims.sub });
      res.status(201).json(movement);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err.message) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  // === Checks Wallet Routes ===
  app.get("/api/checks", isAuthenticated, async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const checks = await storage.getChecks(status);
    res.json(checks);
  });

  app.get("/api/checks/alerts", isAuthenticated, async (req, res) => {
    const checks = await storage.getChecksWithAlerts();
    res.json(checks);
  });

  app.get("/api/checks/:id", isAuthenticated, async (req, res) => {
    const check = await storage.getCheck(Number(req.params.id));
    if (!check) return res.status(404).json({ message: "Cheque no encontrado" });
    res.json(check);
  });

  app.get("/api/clients/:clientId/checks", isAuthenticated, async (req, res) => {
    const checks = await storage.getChecksByClient(Number(req.params.clientId));
    res.json(checks);
  });

  app.post("/api/checks", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        checkType: z.string(),
        checkNumber: z.string(),
        bankName: z.string(),
        bankBranch: z.string().optional(),
        amount: z.string(),
        issueDate: z.string().transform(s => new Date(s)),
        dueDate: z.string().transform(s => new Date(s)),
        issuerName: z.string(),
        issuerCuit: z.string().optional(),
        payeeName: z.string().optional(),
        status: z.string().optional(),
        originType: z.string().optional(),
        originId: z.number().optional(),
        clientId: z.number().optional(),
        notes: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const user = req.user as any;
      const check = await storage.createCheck({ ...input, createdBy: user.claims.sub });
      res.status(201).json(check);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/checks/:id", isAuthenticated, async (req, res) => {
    const schema = z.object({
      checkType: z.string().optional(),
      checkNumber: z.string().optional(),
      bankName: z.string().optional(),
      bankBranch: z.string().optional(),
      amount: z.string().optional(),
      issueDate: z.string().transform(s => new Date(s)).optional(),
      dueDate: z.string().transform(s => new Date(s)).optional(),
      issuerName: z.string().optional(),
      issuerCuit: z.string().optional(),
      payeeName: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    });
    const input = schema.parse(req.body);
    const check = await storage.updateCheck(Number(req.params.id), input);
    res.json(check);
  });

  app.post("/api/checks/:id/deposit", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        depositAccountId: z.number(),
      });
      const input = schema.parse(req.body);
      const check = await storage.depositCheck(Number(req.params.id), input.depositAccountId);
      res.json(check);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/checks/:id/endorse", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        endorsedTo: z.string(),
      });
      const input = schema.parse(req.body);
      const check = await storage.endorseCheck(Number(req.params.id), input.endorsedTo);
      res.json(check);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/checks/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        reason: z.string(),
      });
      const input = schema.parse(req.body);
      const check = await storage.rejectCheck(Number(req.params.id), input.reason);
      res.json(check);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === MODULE 8: STOCK ===
  
  // Stock Locations
  app.get("/api/stock-locations", isAuthenticated, async (req, res) => {
    const locations = await storage.getStockLocations();
    res.json(locations);
  });

  app.get("/api/stock-locations/:id", isAuthenticated, async (req, res) => {
    const location = await storage.getStockLocation(Number(req.params.id));
    if (!location) return res.status(404).json({ message: "Ubicación no encontrada" });
    res.json(location);
  });

  app.post("/api/stock-locations", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        code: z.string().min(1, "El código es requerido"),
        name: z.string().min(1, "El nombre es requerido"),
        description: z.string().optional(),
        zone: z.string().optional(),
        aisle: z.string().optional(),
        shelf: z.string().optional(),
        bin: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const location = await storage.createStockLocation(input);
      res.status(201).json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/stock-locations/:id", isAuthenticated, async (req, res) => {
    try {
      const location = await storage.updateStockLocation(Number(req.params.id), req.body);
      res.json(location);
    } catch (err) {
      throw err;
    }
  });

  app.delete("/api/stock-locations/:id", isAuthenticated, async (req, res) => {
    await storage.deleteStockLocation(Number(req.params.id));
    res.status(204).send();
  });

  // Stock Movements
  app.get("/api/stock-movements", isAuthenticated, async (req, res) => {
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const movements = await storage.getStockMovements(productId);
    res.json(movements);
  });

  app.post("/api/stock-movements", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        productId: z.number(),
        movementType: z.enum(['entry', 'exit', 'adjustment_add', 'adjustment_subtract', 'purchase', 'sale']),
        quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
        referenceType: z.string().optional(),
        referenceId: z.number().optional(),
        notes: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const user = req.user as any;
      const movement = await storage.createStockMovement(user.claims.sub, input);
      res.status(201).json(movement);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/stock/adjust", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        productId: z.number(),
        quantity: z.number(),
        type: z.enum(['add', 'subtract']),
        notes: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const user = req.user as any;
      const movement = await storage.adjustStock(user.claims.sub, input.productId, input.quantity, input.type, input.notes);
      res.status(201).json(movement);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Stock Alerts
  app.get("/api/stock/alerts", isAuthenticated, async (req, res) => {
    const alerts = await storage.getStockAlerts();
    res.json(alerts);
  });

  // === BRANDS ROUTES ===
  app.get("/api/brands", isAuthenticated, async (req, res) => {
    const brandsList = await storage.getBrands();
    res.json(brandsList);
  });

  app.get("/api/brands/:id", isAuthenticated, async (req, res) => {
    const brand = await storage.getBrand(Number(req.params.id));
    if (!brand) return res.status(404).json({ message: "Marca no encontrada" });
    res.json(brand);
  });

  app.post("/api/brands", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const brand = await storage.createBrand(input);
      res.status(201).json(brand);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/brands/:id", isAuthenticated, async (req, res) => {
    const brand = await storage.updateBrand(Number(req.params.id), req.body);
    res.json(brand);
  });

  app.put("/api/brands/:id", isAuthenticated, async (req, res) => {
    const brand = await storage.updateBrand(Number(req.params.id), req.body);
    res.json(brand);
  });

  app.delete("/api/brands/:id", isAuthenticated, async (req, res) => {
    await storage.deleteBrand(Number(req.params.id));
    res.status(204).send();
  });

  // === WAREHOUSES ROUTES ===
  app.get("/api/warehouses", isAuthenticated, async (req, res) => {
    const warehousesList = await storage.getWarehouses();
    res.json(warehousesList);
  });

  app.get("/api/warehouses/:id", isAuthenticated, async (req, res) => {
    const warehouse = await storage.getWarehouse(Number(req.params.id));
    if (!warehouse) return res.status(404).json({ message: "Depósito no encontrado" });
    res.json(warehouse);
  });

  app.post("/api/warehouses", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        address: z.string().optional(),
        phone: z.string().optional(),
        isMain: z.boolean().optional(),
      });
      const input = schema.parse(req.body);
      const warehouse = await storage.createWarehouse(input);
      res.status(201).json(warehouse);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/warehouses/:id", isAuthenticated, async (req, res) => {
    const warehouse = await storage.updateWarehouse(Number(req.params.id), req.body);
    res.json(warehouse);
  });

  app.delete("/api/warehouses/:id", isAuthenticated, async (req, res) => {
    await storage.deleteWarehouse(Number(req.params.id));
    res.status(204).send();
  });

  // === PRODUCT WAREHOUSE STOCK ROUTES ===
  app.get("/api/products/:id/warehouse-stock", isAuthenticated, async (req, res) => {
    const stocks = await storage.getProductWarehouseStock(Number(req.params.id));
    res.json(stocks);
  });

  app.post("/api/products/:id/warehouse-stock", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        warehouseId: z.number(),
        stockQuantity: z.number().default(0),
        minStockLevel: z.number().optional(),
        maxStockLevel: z.number().optional(),
        locationCode: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const stock = await storage.setProductWarehouseStock({
        productId: Number(req.params.id),
        ...input
      });
      res.status(201).json(stock);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === SUPPLIER IMPORT TEMPLATES ROUTES ===
  app.get("/api/supplier-import-templates", isAuthenticated, async (req, res) => {
    const supplierId = req.query.supplierId ? Number(req.query.supplierId) : undefined;
    const templates = await storage.getSupplierImportTemplates(supplierId);
    res.json(templates);
  });

  app.get("/api/supplier-import-templates/:id", isAuthenticated, async (req, res) => {
    const template = await storage.getSupplierImportTemplate(Number(req.params.id));
    if (!template) return res.status(404).json({ message: "Plantilla no encontrada" });
    res.json(template);
  });

  app.post("/api/supplier-import-templates", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        supplierId: z.number(),
        name: z.string().min(1),
        columnMapping: z.record(z.string()),
        hasHeaderRow: z.boolean().optional(),
        startRow: z.number().optional(),
        sheetName: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const template = await storage.createSupplierImportTemplate(input);
      res.status(201).json(template);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/supplier-import-templates/:id", isAuthenticated, async (req, res) => {
    const template = await storage.updateSupplierImportTemplate(Number(req.params.id), req.body);
    res.json(template);
  });

  app.delete("/api/supplier-import-templates/:id", isAuthenticated, async (req, res) => {
    await storage.deleteSupplierImportTemplate(Number(req.params.id));
    res.status(204).send();
  });

  // === PRICE UPDATE ROUTES ===
  app.get("/api/price-updates", isAuthenticated, async (req, res) => {
    const supplierId = req.query.supplierId ? Number(req.query.supplierId) : undefined;
    const logs = await storage.getPriceUpdateLogs(supplierId);
    res.json(logs);
  });

  app.get("/api/price-updates/:id", isAuthenticated, async (req, res) => {
    const log = await storage.getPriceUpdateLog(Number(req.params.id));
    if (!log) return res.status(404).json({ message: "Registro no encontrado" });
    res.json(log);
  });

  app.post("/api/price-updates/analyze", isAuthenticated, async (req, res) => {
    try {
      const { supplierId, templateId, data } = req.body;
      
      // Get template
      const template = await storage.getSupplierImportTemplate(templateId);
      if (!template) {
        return res.status(400).json({ message: "Plantilla no encontrada" });
      }

      // Get existing products for this supplier
      const existingProducts = await storage.getProductsBySupplierCode(supplierId);
      const productsByCode = new Map(
        existingProducts.map(p => [p.supplierCode, p])
      );

      const mapping = template.columnMapping as Record<string, string>;
      const analysis: any[] = [];
      let updatedCount = 0;
      let notFoundCount = 0;
      let totalVariation = 0;
      const processedCodes = new Set<string>();

      for (const row of data) {
        const supplierCode = row[mapping.supplierCode];
        const newPrice = parseFloat(row[mapping.price]) || 0;
        const description = row[mapping.description] || "";

        if (!supplierCode) continue;
        processedCodes.add(supplierCode);

        const existingProduct = productsByCode.get(supplierCode);
        
        if (existingProduct) {
          const oldPrice = parseFloat(existingProduct.listCostNoTax || existingProduct.costNoTax || "0");
          const variation = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
          totalVariation += variation;
          updatedCount++;

          analysis.push({
            supplierCode,
            description,
            sku: existingProduct.sku,
            productName: existingProduct.name,
            oldPrice,
            newPrice,
            variation: Math.round(variation * 100) / 100,
            status: "update"
          });
        } else {
          notFoundCount++;
          analysis.push({
            supplierCode,
            description,
            sku: null,
            productName: null,
            oldPrice: 0,
            newPrice,
            variation: 0,
            status: "not_found"
          });
        }
      }

      // Find discontinued products (in system but not in file)
      const discontinuedProducts = existingProducts.filter(
        p => p.supplierCode && !processedCodes.has(p.supplierCode)
      );

      for (const product of discontinuedProducts) {
        analysis.push({
          supplierCode: product.supplierCode,
          description: product.name,
          sku: product.sku,
          productName: product.name,
          oldPrice: parseFloat(product.listCostNoTax || product.costNoTax || "0"),
          newPrice: 0,
          variation: -100,
          status: "discontinued"
        });
      }

      const avgVariation = updatedCount > 0 ? totalVariation / updatedCount : 0;

      // Create log entry
      const log = await storage.createPriceUpdateLog({
        supplierId,
        templateId,
        fileName: req.body.fileName || "imported_file.xlsx",
        totalProducts: data.length,
        updatedProducts: updatedCount,
        notFoundProducts: notFoundCount,
        discontinuedProducts: discontinuedProducts.length,
        avgVariationPercent: String(Math.round(avgVariation * 100) / 100),
        status: "pending",
        details: analysis
      });

      res.json({
        logId: log.id,
        summary: {
          total: data.length,
          updated: updatedCount,
          notFound: notFoundCount,
          discontinued: discontinuedProducts.length,
          avgVariation: Math.round(avgVariation * 100) / 100
        },
        details: analysis
      });
    } catch (err: any) {
      console.error("Price analysis error:", err);
      res.status(500).json({ message: err.message || "Error al analizar precios" });
    }
  });

  app.post("/api/price-updates/:id/apply", isAuthenticated, async (req, res) => {
    try {
      const log = await storage.getPriceUpdateLog(Number(req.params.id));
      if (!log) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }

      if (log.status !== "pending") {
        return res.status(400).json({ message: "Esta actualización ya fue procesada" });
      }

      const details = log.details as any[];
      let appliedCount = 0;

      for (const item of details) {
        if (item.status === "update" && item.sku) {
          // Find product and update price
          const products = await storage.getProducts();
          const product = products.find(p => p.sku === item.sku);
          
          if (product) {
            await storage.updateProduct(product.id, {
              listCostNoTax: String(item.newPrice),
              costNoTax: String(item.newPrice),
              costWithTax: String(item.newPrice * 1.21), // Add IVA 21%
            });
            appliedCount++;
          }
        }
      }

      // Update log status
      const user = req.user as any;
      await storage.updatePriceUpdateLog(log.id, {
        status: "completed",
        appliedAt: new Date(),
        appliedBy: user?.id || "unknown"
      });

      res.json({ 
        success: true, 
        appliedCount,
        message: `Se actualizaron ${appliedCount} productos` 
      });
    } catch (err: any) {
      console.error("Price apply error:", err);
      res.status(500).json({ message: err.message || "Error al aplicar precios" });
    }
  });

  app.post("/api/price-updates/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      await storage.updatePriceUpdateLog(Number(req.params.id), {
        status: "cancelled"
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al cancelar" });
    }
  });

  // === COMPANY SETTINGS ROUTES ===
  app.get("/api/settings/company", isAuthenticated, async (req, res) => {
    const settings = await storage.getCompanySettings();
    res.json(settings || null);
  });

  app.post("/api/settings/company", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.saveCompanySettings(req.body);
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al guardar configuración" });
    }
  });

  // === PRINT SETTINGS ROUTES ===
  app.get("/api/settings/print", isAuthenticated, async (req, res) => {
    const settings = await storage.getPrintSettings();
    res.json(settings);
  });

  app.get("/api/settings/print/:documentType", isAuthenticated, async (req, res) => {
    const setting = await storage.getPrintSetting(req.params.documentType);
    if (!setting) return res.status(404).json({ message: "Configuración no encontrada" });
    res.json(setting);
  });

  app.post("/api/settings/print", isAuthenticated, async (req, res) => {
    try {
      const setting = await storage.savePrintSetting(req.body);
      res.json(setting);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al guardar configuración de impresión" });
    }
  });

  // Seed default print settings
  await storage.seedDefaultPrintSettings();

  // === E-COMMERCE SETTINGS ROUTES ===
  app.get("/api/ecommerce/settings", isAuthenticated, async (req, res) => {
    const settings = await storage.getEcommerceSettings();
    res.json(settings || null);
  });

  app.post("/api/ecommerce/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.saveEcommerceSettings(req.body);
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al guardar configuración" });
    }
  });

  // === E-COMMERCE PRODUCTS (Public catalog) ===
  app.get("/api/ecommerce/products", async (req, res) => {
    const products = await storage.getEcommerceProducts();
    res.json(products);
  });

  // === E-COMMERCE ORDERS ===
  app.get("/api/ecommerce/orders", isAuthenticated, async (req, res) => {
    const orders = await storage.getEcommerceOrders();
    res.json(orders);
  });

  app.get("/api/ecommerce/orders/:id", isAuthenticated, async (req, res) => {
    const order = await storage.getEcommerceOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
    res.json(order);
  });

  app.post("/api/ecommerce/orders", async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const order = await storage.createEcommerceOrder(orderData, items || []);
      res.status(201).json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al crear pedido" });
    }
  });

  app.patch("/api/ecommerce/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.updateEcommerceOrder(Number(req.params.id), req.body);
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al actualizar pedido" });
    }
  });

  app.post("/api/ecommerce/orders/:id/confirm", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.updateEcommerceOrder(Number(req.params.id), {
        orderStatus: "confirmed"
      });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al confirmar" });
    }
  });

  app.post("/api/ecommerce/orders/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.updateEcommerceOrder(Number(req.params.id), {
        orderStatus: "cancelled"
      });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al cancelar" });
    }
  });

  // === PURCHASE ORDERS ROUTES ===
  app.get("/api/purchase-orders", isAuthenticated, async (req, res) => {
    const orders = await storage.getPurchaseOrders();
    res.json(orders);
  });

  app.post("/api/purchase-orders", isAuthenticated, async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const order = await storage.createPurchaseOrder(orderData, items || []);
      res.status(201).json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al crear pedido" });
    }
  });

  app.patch("/api/purchase-orders/:id/status", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.updatePurchaseOrderStatus(Number(req.params.id), req.body.status);
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al actualizar estado" });
    }
  });

  // === QUOTES ROUTES ===
  app.get("/api/quotes", isAuthenticated, async (req, res) => {
    const quotes = await storage.getQuotes();
    res.json(quotes);
  });

  app.post("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const { items, ...quoteData } = req.body;
      const quote = await storage.createQuote(quoteData, items || []);
      res.status(201).json(quote);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al crear cotización" });
    }
  });

  app.patch("/api/quotes/:id/status", isAuthenticated, async (req, res) => {
    try {
      const quote = await storage.updateQuoteStatus(Number(req.params.id), req.body.status);
      res.json(quote);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al actualizar estado" });
    }
  });

  app.post("/api/quotes/:id/convert", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.convertQuoteToSale(Number(req.params.id));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al convertir cotización" });
    }
  });

  // === CUSTOMER ORDERS ROUTES ===
  app.get("/api/customer-orders", isAuthenticated, async (req, res) => {
    const orders = await storage.getCustomerOrders();
    res.json(orders);
  });

  app.post("/api/customer-orders", isAuthenticated, async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const order = await storage.createCustomerOrder(orderData, items || []);
      res.status(201).json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al crear pedido" });
    }
  });

  app.patch("/api/customer-orders/:id/status", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.updateCustomerOrderStatus(Number(req.params.id), req.body.status);
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al actualizar estado" });
    }
  });

  app.post("/api/customer-orders/:id/convert", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.convertCustomerOrderToSale(Number(req.params.id));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al facturar pedido" });
    }
  });

  // === PRICE LISTS ROUTES ===
  app.get("/api/price-lists", isAuthenticated, async (req, res) => {
    const lists = await storage.getPriceLists();
    res.json(lists);
  });

  app.post("/api/price-lists", isAuthenticated, async (req, res) => {
    try {
      const list = await storage.createPriceList(req.body);
      res.status(201).json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al crear lista" });
    }
  });

  app.patch("/api/price-lists/:id", isAuthenticated, async (req, res) => {
    try {
      const list = await storage.updatePriceList(Number(req.params.id), req.body);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al actualizar lista" });
    }
  });

  // === LOYALTY PROGRAM ROUTES ===
  app.get("/api/loyalty-program", isAuthenticated, async (req, res) => {
    const program = await storage.getLoyaltyProgram();
    res.json(program || {});
  });

  app.put("/api/loyalty-program", isAuthenticated, async (req, res) => {
    try {
      const program = await storage.saveLoyaltyProgram(req.body);
      res.json(program);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al guardar programa" });
    }
  });

  app.get("/api/clients-with-points", isAuthenticated, async (req, res) => {
    const clients = await storage.getClientsWithPoints();
    res.json(clients);
  });

  // === BALANCES ROUTES ===
  app.get("/api/clients-with-balance", isAuthenticated, async (req, res) => {
    const clients = await storage.getClientsWithBalance();
    res.json(clients);
  });

  app.get("/api/suppliers-with-balance", isAuthenticated, async (req, res) => {
    const suppliers = await storage.getSuppliersWithBalance();
    res.json(suppliers);
  });

  // === STOCK ADJUSTMENTS ROUTE ===
  app.post("/api/stock-adjustments", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.createStockAdjustment(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al ajustar stock" });
    }
  });

  // === BULK UPDATE PRODUCTS ===
  app.post("/api/products/bulk-update", isAuthenticated, async (req, res) => {
    try {
      const { productIds, editType, value } = req.body;
      const result = await storage.bulkUpdateProducts(productIds, editType, value);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error en actualización masiva" });
    }
  });

  // === EMPLOYEES ROUTES ===
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    const employees = await storage.getEmployees();
    res.json(employees);
  });

  app.post("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const employee = await storage.createEmployee(req.body);
      res.status(201).json(employee);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al crear empleado" });
    }
  });

  app.put("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const employee = await storage.updateEmployee(Number(req.params.id), req.body);
      res.json(employee);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al actualizar empleado" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteEmployee(Number(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al eliminar empleado" });
    }
  });

  // === PAYROLL PAYMENTS ROUTES ===
  app.get("/api/payroll-payments", isAuthenticated, async (req, res) => {
    const payments = await storage.getPayrollPayments();
    res.json(payments);
  });

  app.post("/api/payroll-payments", isAuthenticated, async (req, res) => {
    try {
      const payment = await storage.createPayrollPayment(req.body);
      res.status(201).json(payment);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al crear pago" });
    }
  });

  app.put("/api/payroll-payments/:id/pay", isAuthenticated, async (req, res) => {
    try {
      const payment = await storage.markPayrollPaymentPaid(Number(req.params.id));
      res.json(payment);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al marcar como pagado" });
    }
  });

  // === EMPLOYEE ADVANCES ROUTES ===
  app.get("/api/employee-advances", isAuthenticated, async (req, res) => {
    const advances = await storage.getEmployeeAdvances();
    res.json(advances);
  });

  app.post("/api/employee-advances", isAuthenticated, async (req, res) => {
    try {
      const advance = await storage.createEmployeeAdvance(req.body);
      res.status(201).json(advance);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al crear adelanto" });
    }
  });

  app.put("/api/employee-advances/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const advance = await storage.approveEmployeeAdvance(Number(req.params.id));
      res.json(advance);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al aprobar adelanto" });
    }
  });

  app.put("/api/employee-advances/:id/pay", isAuthenticated, async (req, res) => {
    try {
      const advance = await storage.payEmployeeAdvance(Number(req.params.id));
      res.json(advance);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al pagar adelanto" });
    }
  });

  // === LOYALTY COUPONS ROUTES ===
  app.get("/api/loyalty-coupons", isAuthenticated, async (req, res) => {
    const coupons = await storage.getLoyaltyCoupons();
    res.json(coupons);
  });

  app.post("/api/loyalty-coupons", isAuthenticated, async (req, res) => {
    try {
      const coupon = await storage.createLoyaltyCoupon(req.body);
      res.status(201).json(coupon);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al crear cupón" });
    }
  });

  app.put("/api/loyalty-coupons/:id", isAuthenticated, async (req, res) => {
    try {
      const coupon = await storage.updateLoyaltyCoupon(Number(req.params.id), req.body);
      res.json(coupon);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al actualizar cupón" });
    }
  });

  app.delete("/api/loyalty-coupons/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteLoyaltyCoupon(Number(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al eliminar cupón" });
    }
  });

  // === LOYALTY OFFERS ROUTES ===
  app.get("/api/loyalty-offers", isAuthenticated, async (req, res) => {
    const offers = await storage.getLoyaltyOffers();
    res.json(offers);
  });

  app.post("/api/loyalty-offers", isAuthenticated, async (req, res) => {
    try {
      const offer = await storage.createLoyaltyOffer(req.body);
      res.status(201).json(offer);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al crear oferta" });
    }
  });

  app.put("/api/loyalty-offers/:id", isAuthenticated, async (req, res) => {
    try {
      const offer = await storage.updateLoyaltyOffer(Number(req.params.id), req.body);
      res.json(offer);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al actualizar oferta" });
    }
  });

  app.delete("/api/loyalty-offers/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteLoyaltyOffer(Number(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al eliminar oferta" });
    }
  });

  // === PAYMENT REQUESTS ROUTES ===
  app.get("/api/payment-requests", isAuthenticated, async (req, res) => {
    const requests = await storage.getPaymentRequests();
    res.json(requests);
  });

  app.put("/api/payment-requests/:id/process", isAuthenticated, async (req, res) => {
    try {
      const { status, notes } = req.body;
      const userId = req.user?.claims?.sub;
      const request = await storage.processPaymentRequest(Number(req.params.id), status, userId, notes);
      res.json(request);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al procesar solicitud" });
    }
  });

  // === CUSTOMER PORTAL ROUTES (PUBLIC - No auth required) ===
  app.post("/api/portal/login", async (req, res) => {
    try {
      const { identifier } = req.body; // DNI or CUIT
      const result = await storage.portalLogin(identifier);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ message: "No se encontró cliente con ese DNI/CUIT" });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al iniciar sesión" });
    }
  });

  app.get("/api/portal/client/:token", async (req, res) => {
    try {
      const data = await storage.getPortalClientData(req.params.token);
      if (data) {
        res.json(data);
      } else {
        res.status(404).json({ message: "Sesión no válida o expirada" });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al obtener datos" });
    }
  });

  app.get("/api/portal/offers", async (req, res) => {
    const offers = await storage.getActivePortalOffers();
    res.json(offers);
  });

  app.post("/api/portal/validate-coupon", async (req, res) => {
    try {
      const { code, clientId } = req.body;
      const result = await storage.validateCoupon(code, clientId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Cupón no válido" });
    }
  });

  app.post("/api/portal/payment-request", async (req, res) => {
    try {
      const request = await storage.createPaymentRequest(req.body);
      res.status(201).json(request);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error al enviar solicitud de pago" });
    }
  });

  // === FINANCIAL AI ASSISTANT ===
  app.post("/api/finance-ai/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, financialData } = req.body;

      const systemPrompt = `Eres un asesor financiero experto para ferreterías en Argentina. Tu rol es ayudar al dueño del negocio a:
- Mejorar el ticket promedio de venta
- Aumentar la rentabilidad
- Optimizar el flujo de caja
- Tomar decisiones estratégicas basadas en datos
- Identificar oportunidades de crecimiento

Datos actuales del negocio:
${JSON.stringify(financialData, null, 2)}

Responde en español de forma clara, práctica y accionable. Da consejos específicos basados en los números reales. Usa formato con viñetas cuando sea apropiado.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        stream: true,
        max_tokens: 1500,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error("Finance AI error:", err);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: err.message || "Error en asistente IA" });
      }
    }
  });

  return httpServer;
}
