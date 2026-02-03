import { Express, RequestHandler, Request } from "express";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { employees, roles, roleModulePermissions, modules } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import session from "express-session";

export type EmployeeSession = {
  employeeId: number;
  username: string;
  firstName: string;
  lastName: string;
  roleId: number | null;
  roleName: string | null;
  permissions: Array<{
    moduleCode: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>;
};

declare module "express-session" {
  interface SessionData {
    employee?: EmployeeSession;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getEmployeeWithPermissions(employeeId: number) {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, employeeId),
  });

  if (!employee) return null;

  let roleName: string | null = null;
  let permissions: EmployeeSession["permissions"] = [];

  if (employee.roleId) {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, employee.roleId),
    });
    roleName = role?.name || null;

    const perms = await db
      .select({
        moduleCode: modules.code,
        canView: roleModulePermissions.canView,
        canCreate: roleModulePermissions.canCreate,
        canEdit: roleModulePermissions.canEdit,
        canDelete: roleModulePermissions.canDelete,
      })
      .from(roleModulePermissions)
      .innerJoin(modules, eq(roleModulePermissions.moduleId, modules.id))
      .where(eq(roleModulePermissions.roleId, employee.roleId));

    permissions = perms.map(p => ({
      moduleCode: p.moduleCode,
      canView: p.canView ?? false,
      canCreate: p.canCreate ?? false,
      canEdit: p.canEdit ?? false,
      canDelete: p.canDelete ?? false,
    }));
  }

  return {
    employee,
    roleName,
    permissions,
  };
}

export const isEmployeeAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.employee) {
    return next();
  }
  return res.status(401).json({ message: "No autorizado" });
};

export const hasPermission = (moduleCode: string, permission: "canView" | "canCreate" | "canEdit" | "canDelete"): RequestHandler => {
  return (req, res, next) => {
    const employee = req.session?.employee;
    if (!employee) {
      return res.status(401).json({ message: "No autorizado" });
    }

    // Admin role has all permissions
    if (employee.roleName === "admin") {
      return next();
    }

    const modulePerm = employee.permissions.find(p => p.moduleCode === moduleCode);
    if (modulePerm && modulePerm[permission]) {
      return next();
    }

    return res.status(403).json({ message: "No tienes permiso para esta acción" });
  };
};

export function setupEmployeeAuthRoutes(app: Express) {
  // Employee login
  app.post("/api/employee/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña requeridos" });
      }

      const employee = await db.query.employees.findFirst({
        where: and(
          eq(employees.username, username),
          eq(employees.isActive, true)
        ),
      });

      if (!employee || !employee.passwordHash) {
        return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
      }

      const isValid = await verifyPassword(password, employee.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
      }

      // Get role and permissions
      const data = await getEmployeeWithPermissions(employee.id);
      if (!data) {
        return res.status(401).json({ message: "Error al obtener datos del empleado" });
      }

      // Update last login
      await db.update(employees)
        .set({ lastLoginAt: new Date() })
        .where(eq(employees.id, employee.id));

      // Set session
      req.session.employee = {
        employeeId: employee.id,
        username: employee.username!,
        firstName: employee.firstName,
        lastName: employee.lastName,
        roleId: employee.roleId,
        roleName: data.roleName,
        permissions: data.permissions,
      };

      res.json({
        success: true,
        employee: {
          id: employee.id,
          username: employee.username,
          firstName: employee.firstName,
          lastName: employee.lastName,
          role: data.roleName,
        },
      });
    } catch (error) {
      console.error("Employee login error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get current employee session
  app.get("/api/employee/session", (req, res) => {
    if (req.session?.employee) {
      res.json({
        authenticated: true,
        employee: req.session.employee,
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Employee logout
  app.post("/api/employee/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.json({ success: true });
    });
  });

  // Create employee with credentials (admin only)
  app.post("/api/employees/create-with-credentials", isEmployeeAuthenticated, async (req, res) => {
    try {
      const employee = req.session?.employee;
      if (employee?.roleName !== "admin") {
        return res.status(403).json({ message: "Solo administradores pueden crear usuarios" });
      }

      const { username, password, firstName, lastName, roleId, ...rest } = req.body;

      if (!username || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Datos incompletos" });
      }

      // Check if username exists
      const existing = await db.query.employees.findFirst({
        where: eq(employees.username, username),
      });

      if (existing) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      const passwordHash = await hashPassword(password);

      const [newEmployee] = await db.insert(employees).values({
        username,
        passwordHash,
        firstName,
        lastName,
        roleId: roleId || null,
        ...rest,
      }).returning();

      res.status(201).json(newEmployee);
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(500).json({ message: "Error al crear empleado" });
    }
  });

  // Update employee password
  app.put("/api/employees/:id/password", isEmployeeAuthenticated, async (req, res) => {
    try {
      const employee = req.session?.employee;
      const targetId = Number(req.params.id);

      // Only admin or the employee themselves can change password
      if (employee?.roleName !== "admin" && employee?.employeeId !== targetId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { newPassword, currentPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "Nueva contraseña requerida" });
      }

      // If not admin, require current password
      if (employee?.roleName !== "admin") {
        if (!currentPassword) {
          return res.status(400).json({ message: "Contraseña actual requerida" });
        }

        const existingEmployee = await db.query.employees.findFirst({
          where: eq(employees.id, targetId),
        });

        if (!existingEmployee?.passwordHash) {
          return res.status(400).json({ message: "Empleado no tiene contraseña configurada" });
        }

        const isValid = await verifyPassword(currentPassword, existingEmployee.passwordHash);
        if (!isValid) {
          return res.status(401).json({ message: "Contraseña actual incorrecta" });
        }
      }

      const passwordHash = await hashPassword(newPassword);

      await db.update(employees)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(employees.id, targetId));

      res.json({ success: true, message: "Contraseña actualizada" });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ message: "Error al actualizar contraseña" });
    }
  });

  // Initialize admin user (only if no employees exist)
  app.post("/api/employee/init-admin", async (req, res) => {
    try {
      // Check if any employees exist
      const existingEmployees = await db.select().from(employees).limit(1);
      if (existingEmployees.length > 0) {
        return res.status(400).json({ message: "Ya existen empleados en el sistema" });
      }

      // Create admin role if it doesn't exist
      let adminRole = await db.query.roles.findFirst({
        where: eq(roles.name, "admin"),
      });

      if (!adminRole) {
        const [newRole] = await db.insert(roles).values({
          name: "admin",
          description: "Administrador con acceso total",
          isSystem: true,
        }).returning();
        adminRole = newRole;
      }

      // Create admin employee
      const passwordHash = await hashPassword("admin123");
      const [admin] = await db.insert(employees).values({
        username: "admin",
        passwordHash,
        roleId: adminRole.id,
        firstName: "Administrador",
        lastName: "Sistema",
        position: "Administrador",
        isActive: true,
      }).returning();

      res.json({ 
        success: true, 
        message: "Usuario admin creado. Usuario: admin, Contraseña: admin123",
        employee: { id: admin.id, username: admin.username }
      });
    } catch (error) {
      console.error("Init admin error:", error);
      res.status(500).json({ message: "Error al crear usuario admin" });
    }
  });

  // Seed roles if needed
  app.get("/api/roles", isEmployeeAuthenticated, async (req, res) => {
    const allRoles = await db.select().from(roles);
    res.json(allRoles);
  });

  app.post("/api/roles", isEmployeeAuthenticated, async (req, res) => {
    try {
      const employee = req.session?.employee;
      if (employee?.roleName !== "admin") {
        return res.status(403).json({ message: "Solo administradores pueden crear roles" });
      }

      const { name, description } = req.body;
      const [role] = await db.insert(roles).values({ name, description }).returning();
      res.status(201).json(role);
    } catch (error) {
      console.error("Create role error:", error);
      res.status(500).json({ message: "Error al crear rol" });
    }
  });
}
