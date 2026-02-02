import { z } from 'zod';
import { 
  insertProductSchema, 
  insertClientSchema, 
  insertCategorySchema,
  products,
  clients,
  categories,
  sales
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      input: z.object({
        search: z.string().optional(),
        categoryId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products',
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/products/:id',
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/categories',
      input: insertCategorySchema,
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
      },
    },
  },
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients',
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof clients.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/clients/:id',
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients',
      input: insertClientSchema,
      responses: {
        201: z.custom<typeof clients.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/clients/:id',
      input: insertClientSchema.partial(),
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
      },
    },
  },
  sales: {
    create: {
      method: 'POST' as const,
      path: '/api/sales',
      input: z.object({
        clientId: z.number().optional(),
        paymentMethod: z.string(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
          unitPrice: z.number(), // Explicitly passed price to allow overrides/discounts
        })),
      }),
      responses: {
        201: z.custom<typeof sales.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/sales',
      responses: {
        200: z.array(z.any()), // Complex type with relations
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/sales/:id',
      responses: {
        200: z.any(), // Complex type with relations
        404: errorSchemas.notFound,
      },
    },
  },
  stats: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/stats/dashboard',
      responses: {
        200: z.object({
          totalSalesToday: z.number(),
          revenueToday: z.number(),
          lowStockCount: z.number(),
          totalProducts: z.number(),
          recentSales: z.array(z.any()),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
