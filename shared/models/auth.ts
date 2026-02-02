import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, serial, text, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// === ROLES ===
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // admin, vendedor, cajero, almacen, etc.
  description: text("description"),
  isSystem: boolean("is_system").default(false), // Roles del sistema que no se pueden eliminar
  createdAt: timestamp("created_at").defaultNow(),
});

// === MODULES (Para control de acceso por plan) ===
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // ventas, compras, cajas, remitos, etc.
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // Nombre del icono de Lucide
  route: text("route"), // Ruta en el frontend
  sortOrder: serial("sort_order"),
  isActive: boolean("is_active").default(true),
});

// === ROLE MODULE PERMISSIONS ===
export const roleModulePermissions = pgTable("role_module_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id),
  moduleId: integer("module_id").references(() => modules.id),
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
});

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  roleId: integer("role_id").references(() => roles.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === RELATIONS ===
export const roleRelations = relations(roles, ({ many }) => ({
  users: many(users),
  permissions: many(roleModulePermissions),
}));

export const moduleRelations = relations(modules, ({ many }) => ({
  permissions: many(roleModulePermissions),
}));

export const userRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

export const roleModulePermissionRelations = relations(roleModulePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [roleModulePermissions.roleId],
    references: [roles.id],
  }),
  module: one(modules, {
    fields: [roleModulePermissions.moduleId],
    references: [modules.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true });
export const insertRoleModulePermissionSchema = createInsertSchema(roleModulePermissions).omit({ id: true });

// === TYPES ===
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type RoleModulePermission = typeof roleModulePermissions.$inferSelect;

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type UserWithRole = User & {
  role: Role | null;
};

export type RoleWithPermissions = Role & {
  permissions: (RoleModulePermission & { module: Module })[];
};
