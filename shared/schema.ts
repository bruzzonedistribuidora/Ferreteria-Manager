import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

// Export all auth models (users and sessions)
export * from "./models/auth";

// === PRODUCTS ===
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

// === BRANDS (Marcas) ===
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === WAREHOUSES/BRANCHES (Depósitos/Sucursales) ===
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  isMain: boolean("is_main").default(false), // Depósito principal
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  // General
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  additionalCode1: text("additional_code_1"), // Códigos adicionales
  additionalCode2: text("additional_code_2"),
  additionalCode3: text("additional_code_3"),
  additionalCode4: text("additional_code_4"),
  barcode: text("barcode"), // Código de barras
  categoryId: integer("category_id").references(() => categories.id),
  brandId: integer("brand_id").references(() => brands.id),
  supplierId: integer("supplier_id"), // Proveedor principal (FK added via relations)
  supplierCode: text("supplier_code"), // Código del proveedor
  // Unidades
  stockUnit: text("stock_unit").default("unidad"), // Unidad primaria (stock)
  saleUnit: text("sale_unit").default("unidad"), // Unidad de venta
  // Monedas
  purchaseCurrency: text("purchase_currency").default("ARS"),
  saleCurrency: text("sale_currency").default("ARS"),
  // Costos y Precios
  listCostNoTax: numeric("list_cost_no_tax", { precision: 12, scale: 2 }).default("0"), // Costo lista s/IVA
  bulkQuantity: integer("bulk_quantity").default(1), // Cantidad por bulto
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).default("0"), // Costo unitario calculado
  costNoTax: numeric("cost_no_tax", { precision: 12, scale: 2 }).default("0"), // Costo s/IVA
  costWithTax: numeric("cost_with_tax", { precision: 12, scale: 2 }).default("0"), // Costo c/IVA
  costUsd: numeric("cost_usd", { precision: 12, scale: 2 }).default("0"), // Costo en USD
  // Descuentos del proveedor
  supplierDiscount1: numeric("supplier_discount_1", { precision: 5, scale: 2 }).default("0"),
  supplierDiscount2: numeric("supplier_discount_2", { precision: 5, scale: 2 }).default("0"),
  supplierDiscount3: numeric("supplier_discount_3", { precision: 5, scale: 2 }).default("0"),
  supplierDiscount4: numeric("supplier_discount_4", { precision: 5, scale: 2 }).default("0"),
  applySupplierDiscounts: boolean("apply_supplier_discounts").default(false),
  // Precios de venta
  profitPercent: numeric("profit_percent", { precision: 5, scale: 2 }).default("60"), // % Ganancia
  priceNoTax: numeric("price_no_tax", { precision: 12, scale: 2 }).default("0"), // Precio s/IVA
  priceWithTax: numeric("price_with_tax", { precision: 12, scale: 2 }).default("0"), // Precio c/IVA
  priceUsd: numeric("price_usd", { precision: 12, scale: 2 }).default("0"), // Precio en USD
  taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).default("21"), // IVA %
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // Precio final (legacy, mantener compatibilidad)
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }), // Legacy
  // Inventario
  stockQuantity: integer("stock_quantity").notNull().default(0),
  minStockLevel: integer("min_stock_level").default(5), // Mínimo de alerta
  reorderPoint: integer("reorder_point").default(10), // Punto de pedido automático
  maxStockLevel: integer("max_stock_level").default(100),
  locationId: integer("location_id").references(() => stockLocations.id),
  // Venta Fraccionada
  allowFractional: boolean("allow_fractional").default(false), // Habilitar fraccionado
  fractionalUnit: text("fractional_unit"), // Unidad fraccionada (ej: metro, gramo)
  fractionalRatio: numeric("fractional_ratio", { precision: 10, scale: 4 }).default("1"), // Ratio conversión
  // E-Commerce
  publishOnline: boolean("publish_online").default(false),
  isFeatured: boolean("is_featured").default(false),
  isOnSale: boolean("is_on_sale").default(false),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  salePercent: numeric("sale_percent", { precision: 5, scale: 2 }),
  isNewArrival: boolean("is_new_arrival").default(false),
  ecommerceTags: text("ecommerce_tags").array(),
  ecommerceSortOrder: integer("ecommerce_sort_order").default(0),
  ecommerceImages: text("ecommerce_images").array(),
  // Meta
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === PRODUCT WAREHOUSE STOCK (Stock por depósito/sucursal) ===
export const productWarehouseStock = pgTable("product_warehouse_stock", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  minStockLevel: integer("min_stock_level").default(0),
  maxStockLevel: integer("max_stock_level").default(0),
  locationCode: text("location_code"), // Ubicación dentro del depósito
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === STOCK LOCATIONS (Ubicaciones en depósito) ===
export const stockLocations = pgTable("stock_locations", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  zone: text("zone"),
  aisle: text("aisle"),
  shelf: text("shelf"),
  bin: text("bin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === STOCK MOVEMENTS (Movimientos de stock) ===
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  movementType: text("movement_type").notNull(),
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  notes: text("notes"),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === CLIENTS ===
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  businessName: text("business_name"), // Razón social
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  taxId: text("tax_id"), // CUIT/CUIL/DNI
  taxCondition: text("tax_condition").default("consumidor_final"), // consumidor_final, responsable_inscripto, monotributista, exento
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === AUTHORIZED CONTACTS (Personas autorizadas por cliente) ===
export const clientAuthorizedContacts = pgTable("client_authorized_contacts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  dni: text("dni"),
  phone: text("phone"),
  email: text("email"),
  position: text("position"), // Cargo: encargado, dueño, empleado
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === CURRENT ACCOUNT (Cuenta corriente) ===
export const clientAccountMovements = pgTable("client_account_movements", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(), // debit (debe), credit (haber)
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(), // Running balance after this movement
  concept: text("concept").notNull(), // invoice, payment, delivery_note, adjustment, etc.
  referenceType: text("reference_type"), // sale, delivery_note, pre_invoice, payment
  referenceId: integer("reference_id"), // ID of related document
  documentNumber: text("document_number"), // Número de comprobante
  notes: text("notes"),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SUPPLIERS (PROVEEDORES) ===
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  businessName: text("business_name"), // Razón social
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  taxId: text("tax_id"), // CUIT/CUIL/DNI
  taxCondition: text("tax_condition").default("responsable_inscripto"),
  defaultDiscountPercent: numeric("default_discount_percent", { precision: 5, scale: 2 }).default("0"),
  paymentTermDays: integer("payment_term_days").default(30), // Días para pago
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankCbu: text("bank_cbu"),
  bankAlias: text("bank_alias"),
  contactName: text("contact_name"), // Nombre del contacto principal
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SUPPLIER ACCOUNT MOVEMENTS (Cuenta corriente proveedor) ===
export const supplierAccountMovements = pgTable("supplier_account_movements", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  type: text("type").notNull(), // debit (debe - lo que les debemos), credit (haber - pagos realizados)
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(), // Running balance
  concept: text("concept").notNull(),
  referenceType: text("reference_type"), // purchase_order, payment, adjustment
  referenceId: integer("reference_id"),
  documentNumber: text("document_number"), // Número de factura proveedor
  dueDate: timestamp("due_date"), // Fecha de vencimiento
  notes: text("notes"),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SUPPLIER PRODUCT DISCOUNTS (Descuentos por artículo) ===
export const supplierProductDiscounts = pgTable("supplier_product_discounts", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  productId: integer("product_id").references(() => products.id), // null = aplica a todos
  categoryId: integer("category_id").references(() => categories.id), // null = aplica a todos
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull(),
  minQuantity: integer("min_quantity").default(1), // Cantidad mínima para aplicar descuento
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SALES ===
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  receiptNumber: text("receipt_number").unique(), // Autogenerated receipt #
  documentType: text("document_type").default("ingreso"), // factura_a, factura_b, factura_c, ingreso, presupuesto
  documentNumber: text("document_number"), // ARCA invoice number if fiscal
  clientId: integer("client_id").references(() => clients.id),
  userId: text("user_id").references(() => users.id), // Who made the sale (Replit Auth ID is string)
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }), // Before discounts
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, transfer, mixed
  fiscalStatus: text("fiscal_status").default("pending"), // pending, validated, rejected, not_applicable
  status: text("status").default("completed"), // completed, cancelled, pending, converted
  originDocumentType: text("origin_document_type"), // If converted from another doc
  originDocumentId: integer("origin_document_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SALE PAYMENTS (for mixed payments) ===
export const salePayments = pgTable("sale_payments", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  paymentMethod: text("payment_method").notNull(), // cash, card, transfer, check, credit_account
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  cardType: text("card_type"), // visa, mastercard, amex, etc.
  cardLastDigits: text("card_last_digits"),
  installments: integer("installments").default(1),
  surchargePercent: numeric("surcharge_percent", { precision: 5, scale: 2 }).default("0"),
  referenceNumber: text("reference_number"), // Transaction ID, check number, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(), // Price at moment of sale
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

// === RELATIONS ===
export const productRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const saleRelations = relations(sales, ({ one, many }) => ({
  client: one(clients, {
    fields: [sales.clientId],
    references: [clients.id],
  }),
  items: many(saleItems),
  payments: many(salePayments),
}));

export const salePaymentRelations = relations(salePayments, ({ one }) => ({
  sale: one(sales, {
    fields: [salePayments.saleId],
    references: [sales.id],
  }),
}));

export const saleItemRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

// === DELIVERY NOTES (REMITOS) ===
export const deliveryNotes = pgTable("delivery_notes", {
  id: serial("id").primaryKey(),
  noteNumber: text("note_number").unique().notNull(), // R-0001, R-0002...
  clientId: integer("client_id").references(() => clients.id).notNull(),
  userId: text("user_id").references(() => users.id),
  status: text("status").default("pending"), // pending, invoiced, cancelled
  notes: text("notes"),
  deliveryDate: timestamp("delivery_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deliveryNoteItems = pgTable("delivery_note_items", {
  id: serial("id").primaryKey(),
  deliveryNoteId: integer("delivery_note_id").notNull().references(() => deliveryNotes.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

// === PRE-INVOICES (PRE-FACTURAS) ===
export const preInvoices = pgTable("pre_invoices", {
  id: serial("id").primaryKey(),
  preInvoiceNumber: text("pre_invoice_number").unique().notNull(), // PF-0001, PF-0002...
  clientId: integer("client_id").references(() => clients.id).notNull(),
  userId: text("user_id").references(() => users.id),
  status: text("status").default("pending_review"), // pending_review, approved, rejected, invoiced
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  adminNotes: text("admin_notes"), // Notas de administración
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Link table: which delivery notes are included in each pre-invoice
export const preInvoiceDeliveryNotes = pgTable("pre_invoice_delivery_notes", {
  id: serial("id").primaryKey(),
  preInvoiceId: integer("pre_invoice_id").notNull().references(() => preInvoices.id),
  deliveryNoteId: integer("delivery_note_id").notNull().references(() => deliveryNotes.id),
});

// === DELIVERY NOTE RELATIONS ===
export const deliveryNoteRelations = relations(deliveryNotes, ({ one, many }) => ({
  client: one(clients, {
    fields: [deliveryNotes.clientId],
    references: [clients.id],
  }),
  items: many(deliveryNoteItems),
}));

export const deliveryNoteItemRelations = relations(deliveryNoteItems, ({ one }) => ({
  deliveryNote: one(deliveryNotes, {
    fields: [deliveryNoteItems.deliveryNoteId],
    references: [deliveryNotes.id],
  }),
  product: one(products, {
    fields: [deliveryNoteItems.productId],
    references: [products.id],
  }),
}));

export const preInvoiceRelations = relations(preInvoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [preInvoices.clientId],
    references: [clients.id],
  }),
  deliveryNotes: many(preInvoiceDeliveryNotes),
}));

export const preInvoiceDeliveryNoteRelations = relations(preInvoiceDeliveryNotes, ({ one }) => ({
  preInvoice: one(preInvoices, {
    fields: [preInvoiceDeliveryNotes.preInvoiceId],
    references: [preInvoices.id],
  }),
  deliveryNote: one(deliveryNotes, {
    fields: [preInvoiceDeliveryNotes.deliveryNoteId],
    references: [deliveryNotes.id],
  }),
}));

// === CLIENT RELATIONS ===
export const clientRelations = relations(clients, ({ many }) => ({
  authorizedContacts: many(clientAuthorizedContacts),
  accountMovements: many(clientAccountMovements),
  sales: many(sales),
  deliveryNotes: many(deliveryNotes),
}));

export const clientAuthorizedContactRelations = relations(clientAuthorizedContacts, ({ one }) => ({
  client: one(clients, {
    fields: [clientAuthorizedContacts.clientId],
    references: [clients.id],
  }),
}));

export const clientAccountMovementRelations = relations(clientAccountMovements, ({ one }) => ({
  client: one(clients, {
    fields: [clientAccountMovements.clientId],
    references: [clients.id],
  }),
}));

// === SUPPLIER RELATIONS ===
export const supplierRelations = relations(suppliers, ({ many }) => ({
  accountMovements: many(supplierAccountMovements),
  productDiscounts: many(supplierProductDiscounts),
}));

export const supplierAccountMovementRelations = relations(supplierAccountMovements, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierAccountMovements.supplierId],
    references: [suppliers.id],
  }),
}));

export const supplierProductDiscountRelations = relations(supplierProductDiscounts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierProductDiscounts.supplierId],
    references: [suppliers.id],
  }),
  product: one(products, {
    fields: [supplierProductDiscounts.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [supplierProductDiscounts.categoryId],
    references: [categories.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, receiptNumber: true, userId: true, createdAt: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true, saleId: true });
export const insertDeliveryNoteSchema = createInsertSchema(deliveryNotes).omit({ id: true, noteNumber: true, userId: true, createdAt: true });
export const insertDeliveryNoteItemSchema = createInsertSchema(deliveryNoteItems).omit({ id: true, deliveryNoteId: true });
export const insertPreInvoiceSchema = createInsertSchema(preInvoices).omit({ id: true, preInvoiceNumber: true, userId: true, createdAt: true, reviewedAt: true, reviewedBy: true });
export const insertAuthorizedContactSchema = createInsertSchema(clientAuthorizedContacts).omit({ id: true, createdAt: true });
export const insertAccountMovementSchema = createInsertSchema(clientAccountMovements).omit({ id: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSupplierMovementSchema = createInsertSchema(supplierAccountMovements).omit({ id: true, createdAt: true });
export const insertSupplierDiscountSchema = createInsertSchema(supplierProductDiscounts).omit({ id: true, createdAt: true });
export const insertSalePaymentSchema = createInsertSchema(salePayments).omit({ id: true, createdAt: true });
export const insertBrandSchema = createInsertSchema(brands).omit({ id: true, createdAt: true });
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true, createdAt: true });
export const insertProductWarehouseStockSchema = createInsertSchema(productWarehouseStock).omit({ id: true, updatedAt: true });

// === API TYPES ===
export type Product = typeof products.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
export type ProductWarehouseStock = typeof productWarehouseStock.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type DeliveryNote = typeof deliveryNotes.$inferSelect;
export type DeliveryNoteItem = typeof deliveryNoteItems.$inferSelect;
export type PreInvoice = typeof preInvoices.$inferSelect;
export type PreInvoiceDeliveryNote = typeof preInvoiceDeliveryNotes.$inferSelect;
export type ClientAuthorizedContact = typeof clientAuthorizedContacts.$inferSelect;
export type ClientAccountMovement = typeof clientAccountMovements.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type SupplierAccountMovement = typeof supplierAccountMovements.$inferSelect;
export type SupplierProductDiscount = typeof supplierProductDiscounts.$inferSelect;
export type SalePayment = typeof salePayments.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertDeliveryNote = z.infer<typeof insertDeliveryNoteSchema>;
export type InsertDeliveryNoteItem = z.infer<typeof insertDeliveryNoteItemSchema>;
export type InsertAuthorizedContact = z.infer<typeof insertAuthorizedContactSchema>;
export type InsertAccountMovement = z.infer<typeof insertAccountMovementSchema>;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type InsertProductWarehouseStock = z.infer<typeof insertProductWarehouseStockSchema>;

// Custom Types for Frontend
export type ProductWithCategory = Product & { category: Category | null };

export type SalePaymentInput = {
  paymentMethod: string;
  amount: number;
  cardType?: string;
  cardLastDigits?: string;
  installments?: number;
  surchargePercent?: number;
  referenceNumber?: string;
  notes?: string;
};

export type CreateSaleRequest = {
  clientId?: number;
  documentType?: string; // factura_a, factura_b, factura_c, ingreso, presupuesto
  paymentMethod: string; // Primary method or 'mixed'
  discountPercent?: number;
  notes?: string;
  createRemito?: boolean; // Generar remito automáticamente
  payments?: SalePaymentInput[]; // For mixed payments
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
  }[];
};

export type SaleWithDetails = Sale & {
  client: Client | null;
  items: (SaleItem & { product: Product })[];
  payments?: SalePayment[];
};

export type DashboardStats = {
  totalSalesToday: number;
  revenueToday: number;
  lowStockCount: number;
  totalProducts: number;
  recentSales: SaleWithDetails[];
};

// Delivery Notes Types
export type DeliveryNoteWithDetails = DeliveryNote & {
  client: Client;
  items: (DeliveryNoteItem & { product: Product })[];
};

export type CreateDeliveryNoteRequest = {
  clientId: number;
  notes?: string;
  deliveryDate?: string;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
  }[];
};

// Pre-Invoice Types
export type PreInvoiceWithDetails = PreInvoice & {
  client: Client;
  deliveryNotes: DeliveryNoteWithDetails[];
};

export type CreatePreInvoiceRequest = {
  clientId: number;
  deliveryNoteIds: number[];
};

// Client with pending delivery notes for grouping
export type ClientWithPendingNotes = Client & {
  pendingDeliveryNotes: DeliveryNoteWithDetails[];
  totalPendingAmount: number;
};

// === ADVANCED CLIENT TYPES ===
export type ClientWithDetails = Client & {
  authorizedContacts: ClientAuthorizedContact[];
  currentBalance: number;
};

export type ClientAccountSummary = {
  clientId: number;
  clientName: string;
  totalDebit: number;
  totalCredit: number;
  currentBalance: number;
  movements: ClientAccountMovement[];
};

export type CreateAccountMovementRequest = {
  clientId: number;
  type: "debit" | "credit";
  amount: number;
  concept: string;
  referenceType?: string;
  referenceId?: number;
  documentNumber?: string;
  notes?: string;
};

// === SUPPLIER TYPES ===
export type SupplierWithDetails = Supplier & {
  productDiscounts: SupplierProductDiscount[];
  currentBalance: number;
};

export type SupplierAccountSummary = {
  supplierId: number;
  supplierName: string;
  totalDebit: number;
  totalCredit: number;
  currentBalance: number;
  movements: SupplierAccountMovement[];
};

export type CreateSupplierMovementRequest = {
  supplierId: number;
  type: "debit" | "credit";
  amount: number;
  concept: string;
  referenceType?: string;
  referenceId?: number;
  documentNumber?: string;
  dueDate?: string;
  notes?: string;
};

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertSupplierMovement = z.infer<typeof insertSupplierMovementSchema>;
export type InsertSupplierDiscount = z.infer<typeof insertSupplierDiscountSchema>;

// === PAYMENT METHODS MODULE ===
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(), // cash, card, transfer, check, credit_account, echeq
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  requiresReference: boolean("requires_reference").default(false), // Needs transaction number
  allowsInstallments: boolean("allows_installments").default(false),
  defaultSurchargePercent: numeric("default_surcharge_percent", { precision: 5, scale: 2 }).default("0"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cardConfigurations = pgTable("card_configurations", {
  id: serial("id").primaryKey(),
  cardBrand: text("card_brand").notNull(), // visa, mastercard, amex, cabal, naranja, etc.
  cardType: text("card_type").notNull(), // credit, debit
  displayName: text("display_name").notNull(),
  isActive: boolean("is_active").default(true),
  defaultSurchargePercent: numeric("default_surcharge_percent", { precision: 5, scale: 2 }).default("0"),
  maxInstallments: integer("max_installments").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cardInstallmentPlans = pgTable("card_installment_plans", {
  id: serial("id").primaryKey(),
  cardConfigId: integer("card_config_id").notNull().references(() => cardConfigurations.id),
  installments: integer("installments").notNull(), // 1, 3, 6, 12, etc.
  surchargePercent: numeric("surcharge_percent", { precision: 5, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  description: text("description"), // "3 cuotas sin interés", etc.
});

export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  accountType: text("account_type").notNull(), // checking, savings
  accountNumber: text("account_number"),
  cbu: text("cbu"), // CBU for Argentina
  alias: text("alias"), // Bank alias
  holderName: text("holder_name").notNull(),
  holderCuit: text("holder_cuit"),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const cardConfigRelations = relations(cardConfigurations, ({ many }) => ({
  installmentPlans: many(cardInstallmentPlans),
}));

export const cardInstallmentRelations = relations(cardInstallmentPlans, ({ one }) => ({
  cardConfig: one(cardConfigurations, {
    fields: [cardInstallmentPlans.cardConfigId],
    references: [cardConfigurations.id],
  }),
}));

// Insert schemas
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCardConfigSchema = createInsertSchema(cardConfigurations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCardInstallmentSchema = createInsertSchema(cardInstallmentPlans).omit({ id: true });
export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type CardConfiguration = typeof cardConfigurations.$inferSelect;
export type CardInstallmentPlan = typeof cardInstallmentPlans.$inferSelect;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type InsertCardConfig = z.infer<typeof insertCardConfigSchema>;
export type InsertCardInstallment = z.infer<typeof insertCardInstallmentSchema>;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;

// Card with installment plans
export type CardWithPlans = CardConfiguration & {
  installmentPlans: CardInstallmentPlan[];
};

// === MODULE 6: CASH REGISTERS (CAJAS) ===
export const cashRegisters = pgTable("cash_registers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  currentBalance: numeric("current_balance", { precision: 14, scale: 2 }).default("0"),
  lastClosedAt: timestamp("last_closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cashRegisterSessions = pgTable("cash_register_sessions", {
  id: serial("id").primaryKey(),
  cashRegisterId: integer("cash_register_id").notNull().references(() => cashRegisters.id),
  openedBy: text("opened_by").notNull().references(() => users.id),
  closedBy: text("closed_by").references(() => users.id),
  openingBalance: numeric("opening_balance", { precision: 14, scale: 2 }).notNull(),
  closingBalance: numeric("closing_balance", { precision: 14, scale: 2 }),
  expectedBalance: numeric("expected_balance", { precision: 14, scale: 2 }),
  difference: numeric("difference", { precision: 14, scale: 2 }),
  status: text("status").notNull().default("open"), // open, closed
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
});

export const cashMovements = pgTable("cash_movements", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => cashRegisterSessions.id),
  cashRegisterId: integer("cash_register_id").notNull().references(() => cashRegisters.id),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // income, expense, sale, payment, transfer_in, transfer_out
  category: text("category"), // sale, purchase, expense, deposit, withdrawal, adjustment
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id),
  saleId: integer("sale_id"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  description: text("description"),
  reference: text("reference"), // numero de comprobante, factura, etc.
  runningBalance: numeric("running_balance", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// === CHECKS WALLET (CARTERA DE CHEQUES) ===
export const checksWallet = pgTable("checks_wallet", {
  id: serial("id").primaryKey(),
  checkType: text("check_type").notNull(), // physical, echeq
  checkNumber: text("check_number").notNull(),
  bankName: text("bank_name").notNull(),
  bankBranch: text("bank_branch"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  issuerName: text("issuer_name").notNull(),
  issuerCuit: text("issuer_cuit"),
  payeeName: text("payee_name"), // A favor de
  status: text("status").notNull().default("pending"), // pending, deposited, cashed, rejected, endorsed
  endorsedTo: text("endorsed_to"), // Endosado a (nombre)
  endorsedDate: timestamp("endorsed_date"),
  depositDate: timestamp("deposit_date"),
  depositAccountId: integer("deposit_account_id").references(() => bankAccounts.id),
  rejectionReason: text("rejection_reason"),
  rejectionDate: timestamp("rejection_date"),
  originType: text("origin_type"), // sale, collection, purchase
  originId: integer("origin_id"), // ID de venta o cobro
  clientId: integer("client_id").references(() => clients.id),
  notes: text("notes"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for Module 6
export const insertCashRegisterSchema = createInsertSchema(cashRegisters).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCashSessionSchema = createInsertSchema(cashRegisterSessions).omit({ id: true, openedAt: true });
export const insertCashMovementSchema = createInsertSchema(cashMovements).omit({ id: true, createdAt: true });
export const insertCheckSchema = createInsertSchema(checksWallet).omit({ id: true, createdAt: true, updatedAt: true });

// Types for Module 6
export type CashRegister = typeof cashRegisters.$inferSelect;
export type CashRegisterSession = typeof cashRegisterSessions.$inferSelect;
export type CashMovement = typeof cashMovements.$inferSelect;
export type Check = typeof checksWallet.$inferSelect;
export type InsertCashRegister = z.infer<typeof insertCashRegisterSchema>;
export type InsertCashSession = z.infer<typeof insertCashSessionSchema>;
export type InsertCashMovement = z.infer<typeof insertCashMovementSchema>;
export type InsertCheck = z.infer<typeof insertCheckSchema>;

// Session with details
export type CashSessionWithDetails = CashRegisterSession & {
  cashRegister: CashRegister;
  movements: CashMovement[];
};

// Check with alerts
export type CheckWithAlert = Check & {
  daysUntilDue: number;
  isOverdue: boolean;
  alertLevel: 'normal' | 'warning' | 'urgent' | 'overdue';
};

// === Insert schemas for Stock Module ===
export const insertStockLocationSchema = createInsertSchema(stockLocations).omit({ id: true, createdAt: true });
export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true, createdAt: true });

// Types for Stock Module
export type StockLocation = typeof stockLocations.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockLocation = z.infer<typeof insertStockLocationSchema>;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

// Stock alert types
export type StockAlert = {
  product: Product & { category: Category | null; location: StockLocation | null };
  alertType: 'low_stock' | 'out_of_stock' | 'over_stock';
  currentStock: number;
  minLevel: number;
  maxLevel: number;
};

// Stock movement with product details
export type StockMovementWithDetails = StockMovement & {
  product: Product | null;
};

// === SUPPLIER IMPORT TEMPLATES (Plantillas de Importación de Proveedores) ===
export const supplierImportTemplates = pgTable("supplier_import_templates", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  name: text("name").notNull(), // Nombre de la plantilla
  columnMapping: jsonb("column_mapping").notNull(), // { supplierCode: "A", description: "B", price: "C", ... }
  hasHeaderRow: boolean("has_header_row").default(true), // Si la primera fila es encabezado
  startRow: integer("start_row").default(1), // Desde qué fila empezar a leer
  sheetName: text("sheet_name"), // Nombre de la hoja (si es Excel)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupplierImportTemplateSchema = createInsertSchema(supplierImportTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SupplierImportTemplate = typeof supplierImportTemplates.$inferSelect;
export type InsertSupplierImportTemplate = z.infer<typeof insertSupplierImportTemplateSchema>;

// === PRICE UPDATE LOGS (Historial de Actualizaciones de Precios) ===
export const priceUpdateLogs = pgTable("price_update_logs", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  templateId: integer("template_id").references(() => supplierImportTemplates.id),
  fileName: text("file_name"),
  totalProducts: integer("total_products").default(0), // Total en el archivo
  updatedProducts: integer("updated_products").default(0), // Actualizados
  newProducts: integer("new_products").default(0), // Nuevos (no existían)
  notFoundProducts: integer("not_found_products").default(0), // No encontrados en sistema
  discontinuedProducts: integer("discontinued_products").default(0), // Ya no están en la lista
  avgVariationPercent: numeric("avg_variation_percent", { precision: 8, scale: 2 }), // Variación promedio
  status: text("status").default("pending"), // pending, processing, completed, cancelled
  details: jsonb("details"), // Detalles por producto { sku, oldPrice, newPrice, variation }
  createdAt: timestamp("created_at").defaultNow(),
  appliedAt: timestamp("applied_at"), // Cuándo se aplicó
  appliedBy: text("applied_by"), // Quién lo aplicó
});

export const insertPriceUpdateLogSchema = createInsertSchema(priceUpdateLogs).omit({
  id: true,
  createdAt: true,
});

export type PriceUpdateLog = typeof priceUpdateLogs.$inferSelect;
export type InsertPriceUpdateLog = z.infer<typeof insertPriceUpdateLogSchema>;

// === COMPANY SETTINGS (Datos de la Empresa) ===
export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  // Datos generales
  companyName: text("company_name").notNull(),
  fantasyName: text("fantasy_name"), // Nombre de fantasía
  cuit: text("cuit").notNull(),
  taxCondition: text("tax_condition"), // Responsable Inscripto, Monotributista, etc.
  grossIncome: text("gross_income"), // Número de ingresos brutos
  activityStartDate: timestamp("activity_start_date"),
  
  // Dirección
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  country: text("country").default("Argentina"),
  
  // Contacto
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  
  // Logo
  logoUrl: text("logo_url"),
  
  // ARCA/AFIP Configuration
  arcaCertificate: text("arca_certificate"), // Certificado .pem
  arcaPrivateKey: text("arca_private_key"), // Clave privada
  arcaPointOfSale: integer("arca_point_of_sale"), // Punto de venta
  arcaEnvironment: text("arca_environment").default("testing"), // testing/production
  arcaLastCaeNumber: integer("arca_last_cae_number"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;

// === PRINT SETTINGS (Configuración de Impresión) ===
export const printSettings = pgTable("print_settings", {
  id: serial("id").primaryKey(),
  documentType: text("document_type").notNull().unique(), // remito, factura, presupuesto, ticket, etc.
  documentName: text("document_name").notNull(), // Nombre para mostrar
  
  // Formato de página
  paperSize: text("paper_size").default("A4"), // A4, A5, A6, Ticket80, Ticket58
  orientation: text("orientation").default("portrait"), // portrait, landscape
  marginTop: integer("margin_top").default(10),
  marginBottom: integer("margin_bottom").default(10),
  marginLeft: integer("margin_left").default(10),
  marginRight: integer("margin_right").default(10),
  
  // Elementos a mostrar
  showLogo: boolean("show_logo").default(true),
  showCompanyData: boolean("show_company_data").default(true),
  showClientData: boolean("show_client_data").default(true),
  showPrices: boolean("show_prices").default(true),
  showUnitPrice: boolean("show_unit_price").default(true),
  showSubtotal: boolean("show_subtotal").default(true),
  showDiscounts: boolean("show_discounts").default(true),
  showTaxes: boolean("show_taxes").default(true),
  showTotal: boolean("show_total").default(true),
  showPaymentMethod: boolean("show_payment_method").default(true),
  showNotes: boolean("show_notes").default(true),
  showBarcode: boolean("show_barcode").default(false),
  showQrCode: boolean("show_qr_code").default(false),
  showSignature: boolean("show_signature").default(false),
  
  // Texto personalizado
  headerText: text("header_text"),
  footerText: text("footer_text"),
  
  // Columnas personalizadas
  customColumns: jsonb("custom_columns"), // ["codigo", "descripcion", "cantidad", "precio", "total"]
  
  // Número de copias
  copies: integer("copies").default(1),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrintSettingsSchema = createInsertSchema(printSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PrintSettings = typeof printSettings.$inferSelect;
export type InsertPrintSettings = z.infer<typeof insertPrintSettingsSchema>;

// =====================
// E-COMMERCE TABLES
// =====================

export const ecommerceSettings = pgTable("ecommerce_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").default("Mi Tienda Online"),
  storeDescription: text("store_description"),
  storeLogoUrl: text("store_logo_url"),
  storeBannerUrl: text("store_banner_url"),
  currency: text("currency").default("ARS"),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).default("0"),
  maxOrderAmount: numeric("max_order_amount", { precision: 10, scale: 2 }),
  
  // Envíos
  shippingEnabled: boolean("shipping_enabled").default(true),
  freeShippingMinAmount: numeric("free_shipping_min_amount", { precision: 10, scale: 2 }),
  flatShippingRate: numeric("flat_shipping_rate", { precision: 10, scale: 2 }).default("0"),
  localPickupEnabled: boolean("local_pickup_enabled").default(true),
  
  // Pagos
  paymentOnDeliveryEnabled: boolean("payment_on_delivery_enabled").default(true),
  bankTransferEnabled: boolean("bank_transfer_enabled").default(true),
  stripeEnabled: boolean("stripe_enabled").default(false),
  mercadoPagoEnabled: boolean("mercado_pago_enabled").default(false),
  
  // Notificaciones
  notifyNewOrders: boolean("notify_new_orders").default(true),
  notificationEmail: text("notification_email"),
  notificationWhatsapp: text("notification_whatsapp"),
  
  // Estado
  isActive: boolean("is_active").default(false),
  maintenanceMode: boolean("maintenance_mode").default(false),
  maintenanceMessage: text("maintenance_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ecommerceOrders = pgTable("ecommerce_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  
  // Cliente
  clientId: integer("client_id").references(() => clients.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerWhatsapp: text("customer_whatsapp"),
  
  // Dirección de envío
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingProvince: text("shipping_province"),
  shippingPostalCode: text("shipping_postal_code"),
  shippingMethod: text("shipping_method"), // delivery, pickup
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  
  // Totales
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  taxes: numeric("taxes", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  
  // Pago
  paymentMethod: text("payment_method").notNull(), // cash_on_delivery, bank_transfer, stripe, mercadopago
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, refunded
  paymentReference: text("payment_reference"),
  
  // Estado del pedido
  orderStatus: text("order_status").default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  
  // Notas
  customerNotes: text("customer_notes"),
  internalNotes: text("internal_notes"),
  
  // Tracking
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  
  // Conversión a venta
  saleId: integer("sale_id").references(() => sales.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ecommerceOrderItems = pgTable("ecommerce_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => ecommerceOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  productSku: text("product_sku").notNull(),
  productName: text("product_name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export const shoppingCarts = pgTable("shopping_carts", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  clientId: integer("client_id").references(() => clients.id),
  items: jsonb("items").default([]), // [{productId, sku, name, quantity, price}]
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).default("0"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// E-Commerce Insert Schemas
export const insertEcommerceSettingsSchema = createInsertSchema(ecommerceSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEcommerceOrderSchema = createInsertSchema(ecommerceOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEcommerceOrderItemSchema = createInsertSchema(ecommerceOrderItems).omit({
  id: true,
});

export const insertShoppingCartSchema = createInsertSchema(shoppingCarts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// E-Commerce Types
export type EcommerceSettings = typeof ecommerceSettings.$inferSelect;
export type InsertEcommerceSettings = z.infer<typeof insertEcommerceSettingsSchema>;
export type EcommerceOrder = typeof ecommerceOrders.$inferSelect;
export type InsertEcommerceOrder = z.infer<typeof insertEcommerceOrderSchema>;
export type EcommerceOrderItem = typeof ecommerceOrderItems.$inferSelect;
export type InsertEcommerceOrderItem = z.infer<typeof insertEcommerceOrderItemSchema>;
export type ShoppingCart = typeof shoppingCarts.$inferSelect;
export type InsertShoppingCart = z.infer<typeof insertShoppingCartSchema>;

export type EcommerceOrderWithItems = EcommerceOrder & {
  items: EcommerceOrderItem[];
};

// =====================
// PURCHASE ORDERS (Pedidos de Compra a Proveedores)
// =====================

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  userId: text("user_id").references(() => users.id),
  status: text("status").default("draft"), // draft, sent, confirmed, partial, received, cancelled
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("ARS"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  receivedDate: timestamp("received_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").notNull().references(() => purchaseOrders.id),
  productId: integer("product_id").references(() => products.id),
  productSku: text("product_sku"),
  productName: text("product_name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  quantityReceived: numeric("quantity_received", { precision: 10, scale: 3 }).default("0"),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

// =====================
// QUOTES (Cotizaciones/Presupuestos Formales)
// =====================

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: text("quote_number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id),
  userId: text("user_id").references(() => users.id),
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  status: text("status").default("draft"), // draft, sent, accepted, rejected, expired, converted
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  terms: text("terms"),
  convertedToSaleId: integer("converted_to_sale_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  productId: integer("product_id").references(() => products.id),
  productSku: text("product_sku"),
  productName: text("product_name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

// =====================
// CUSTOMER ORDERS (Pedidos de Clientes)
// =====================

export const customerOrders = pgTable("customer_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id),
  userId: text("user_id").references(() => users.id),
  status: text("status").default("pending"), // pending, confirmed, processing, ready, delivered, cancelled
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("pending"), // pending, partial, paid
  depositAmount: numeric("deposit_amount", { precision: 12, scale: 2 }).default("0"),
  expectedDate: timestamp("expected_date"),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
  convertedToSaleId: integer("converted_to_sale_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerOrderItems = pgTable("customer_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => customerOrders.id),
  productId: integer("product_id").references(() => products.id),
  productSku: text("product_sku"),
  productName: text("product_name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

// =====================
// LOYALTY PROGRAM (Fidelización)
// =====================

export const loyaltyProgram = pgTable("loyalty_program", {
  id: serial("id").primaryKey(),
  name: text("name").default("Programa de Puntos"),
  pointsPerCurrency: numeric("points_per_currency", { precision: 8, scale: 4 }).default("1"), // 1 punto por cada $X
  currencyPerPoint: numeric("currency_per_point", { precision: 8, scale: 4 }).default("0.01"), // $0.01 por punto
  minPointsRedemption: integer("min_points_redemption").default(100),
  maxDiscountPercent: numeric("max_discount_percent", { precision: 5, scale: 2 }).default("10"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientLoyaltyPoints = pgTable("client_loyalty_points", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  points: integer("points").default(0),
  totalEarned: integer("total_earned").default(0),
  totalRedeemed: integer("total_redeemed").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(), // earn, redeem, expire, adjust
  points: integer("points").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  referenceType: text("reference_type"), // sale, manual
  referenceId: integer("reference_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =====================
// PRICE LISTS (Listas de Precios)
// =====================

export const priceLists = pgTable("price_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique(),
  description: text("description"),
  type: text("type").default("percentage"), // percentage, fixed
  adjustmentPercent: numeric("adjustment_percent", { precision: 5, scale: 2 }).default("0"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const priceListItems = pgTable("price_list_items", {
  id: serial("id").primaryKey(),
  priceListId: integer("price_list_id").notNull().references(() => priceLists.id),
  productId: integer("product_id").references(() => products.id),
  categoryId: integer("category_id").references(() => categories.id),
  customPrice: numeric("custom_price", { precision: 12, scale: 2 }),
  adjustmentPercent: numeric("adjustment_percent", { precision: 5, scale: 2 }),
});

// Insert Schemas for new tables
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({ id: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({ id: true });
export const insertCustomerOrderSchema = createInsertSchema(customerOrders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerOrderItemSchema = createInsertSchema(customerOrderItems).omit({ id: true });
export const insertLoyaltyProgramSchema = createInsertSchema(loyaltyProgram).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientLoyaltyPointsSchema = createInsertSchema(clientLoyaltyPoints).omit({ id: true, updatedAt: true });
export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({ id: true, createdAt: true });
export const insertPriceListSchema = createInsertSchema(priceLists).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPriceListItemSchema = createInsertSchema(priceListItems).omit({ id: true });

// Types for new tables
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type CustomerOrder = typeof customerOrders.$inferSelect;
export type CustomerOrderItem = typeof customerOrderItems.$inferSelect;
export type LoyaltyProgram = typeof loyaltyProgram.$inferSelect;
export type ClientLoyaltyPoints = typeof clientLoyaltyPoints.$inferSelect;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type PriceList = typeof priceLists.$inferSelect;
export type PriceListItem = typeof priceListItems.$inferSelect;

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type InsertCustomerOrder = z.infer<typeof insertCustomerOrderSchema>;
export type InsertCustomerOrderItem = z.infer<typeof insertCustomerOrderItemSchema>;
export type InsertLoyaltyProgram = z.infer<typeof insertLoyaltyProgramSchema>;
export type InsertClientLoyaltyPoints = z.infer<typeof insertClientLoyaltyPointsSchema>;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type InsertPriceList = z.infer<typeof insertPriceListSchema>;
export type InsertPriceListItem = z.infer<typeof insertPriceListItemSchema>;

// Composite types
export type PurchaseOrderWithDetails = PurchaseOrder & {
  supplier: Supplier;
  items: PurchaseOrderItem[];
};

export type QuoteWithDetails = Quote & {
  client: Client | null;
  items: QuoteItem[];
};

export type CustomerOrderWithDetails = CustomerOrder & {
  client: Client | null;
  items: CustomerOrderItem[];
};

export type PriceListWithItems = PriceList & {
  items: PriceListItem[];
};
