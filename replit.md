# FerreCloud - Hardware Store ERP System

## Overview

FerreCloud is a cloud-based ERP (Enterprise Resource Planning) system designed specifically for hardware stores (ferreterías). It provides comprehensive management of inventory, sales, clients, delivery notes (remitos), and pre-invoices. The application is built as a full-stack TypeScript monorepo with a React frontend and Express backend, using PostgreSQL for data persistence.

Key features include:
- **Point of Sale (POS)**: Real-time sales processing with cart management, mixed payments
- **Product Management**: Complete inventory with cost structure, profit margins, multiple units, brands, suppliers, fractional selling, e-commerce flags
- **Client Management**: Customer database with CUIT lookup, WhatsApp, authorized contacts, current accounts
- **Supplier Management**: Suppliers with discounts, current accounts, payment terms
- **Delivery Notes (Remitos)**: Track goods with folder system (pending/invoiced/voided)
- **Pre-Invoices**: Generate pre-invoices from pending delivery notes with admin review
- **Cash Registers**: Multiple registers, movements, sessions, check wallet with alerts
- **Stock Management**: Locations, movements, alerts by min/max levels, multi-warehouse stock
- **Payment Methods**: Configurable methods, cards with installment plans and surcharges
- **Dashboard Analytics**: Real-time business metrics and charts

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens (orange/slate color scheme)
- **Charts**: Recharts for dashboard visualizations
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for input validation and type safety
- **Authentication**: Replit Auth integration using OpenID Connect (OIDC) with Passport.js
- **Session Management**: PostgreSQL-backed sessions via `connect-pg-simple`

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for database migrations (`drizzle-kit push`)
- **Key Tables**: users, sessions, products, categories, brands, warehouses, product_warehouse_stock, clients, sales, sale_items, delivery_notes, delivery_note_items, pre_invoices, stock_locations, stock_movements, suppliers, payment_methods, card_configurations, cash_registers, checks_wallet

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components (Layout, Sidebar, etc.)
│   ├── hooks/           # Custom React hooks for data fetching
│   ├── pages/           # Page components
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── routes.ts        # API route handlers
│   ├── storage.ts       # Database operations
│   └── replit_integrations/auth/  # Authentication setup
├── shared/              # Shared code between client/server
│   ├── schema.ts        # Drizzle database schema
│   ├── routes.ts        # API route definitions with Zod
│   └── models/auth.ts   # User and session models
```

### Build System
- **Development**: Vite dev server with HMR, proxying API requests to Express
- **Production**: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Scripts**: `npm run dev` (development), `npm run build` (production build), `npm run db:push` (sync schema)

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Authentication
- **Replit Auth**: OpenID Connect authentication via Replit's identity provider
- **Required Environment Variables**: 
  - `DATABASE_URL` - PostgreSQL connection string
  - `SESSION_SECRET` - Session encryption key
  - `ISSUER_URL` - OIDC issuer (defaults to Replit)
  - `REPL_ID` - Replit environment identifier

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Lucide React**: Icon library
- **Recharts**: Data visualization for dashboard
- **date-fns**: Date formatting and manipulation

### Development Tools
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **TypeScript**: Type checking across the entire codebase