# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Web Application (Main App)
- `npm run serve` - Start application with pre-checks (recommended)
- `npm run dev` - Start development server with Turbo
- `npm run build` - Build for production
- `npm run start` - Start production server on port 3001
- `npm run lint` - Run ESLint checks

### Database Management
- `npm run db:setup` - Complete database setup (generates, migrates, seeds)
- `npm run db:reset` - Reset database and reconfigure
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Apply migrations
- `npm run db:seed` - Insert test data
- `npm run db:studio` - Open Drizzle Studio (database admin interface)

### Mobile Application
```bash
cd mobile/caisse-secours
npm run dev          # Test in browser
npm run build        # Build web app
npx cap sync android # Sync with Android
npx cap open android # Open in Android Studio
./build-android.bat  # Complete Android build script
```

## High-Level Architecture

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Database**: SQLite with Better-sqlite3
- **ORM**: Drizzle ORM with migrations
- **Authentication**: JWT with José library
- **UI**: Tailwind CSS + Lucide React icons
- **Mobile**: React + Capacitor for Android builds

### Database Schema
The application uses a relational SQLite database with four main tables:
- `clients` - Customer information with auto-generated matricules (CLT001, CLT002...)
- `transactions` - Deposits and withdrawals with client relationships
- `commissions` - Monthly commission calculations
- `commission_config` - Commission tier configuration

Client balances are calculated dynamically from transactions rather than stored directly.

### Application Structure
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # REST API endpoints
│   ├── (dashboard-group)/ # Protected dashboard pages
│   └── login/             # Authentication page
├── components/            # Reusable UI components (modals, forms)
├── lib/                   # Core business logic
│   ├── auth/             # JWT session management
│   ├── db/               # Database schema and migrations
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
└── types/                 # TypeScript type definitions
```

### Authentication System
- Simple username/password authentication (admin/microfinance2025)
- JWT sessions with automatic expiration
- All dashboard routes protected by middleware
- Session management through cookies

### Mobile Integration
The mobile app (`mobile/caisse-secours/`) is a separate React+Capacitor application that:
- Stores data locally using localStorage for offline operation
- Exports transactions to JSON format for import into main app
- Can import client lists from main app for synchronization
- Builds to Android APK using Capacitor and Android Studio

### Key Services
- `clientService.ts` - Client CRUD operations and balance calculations
- `transactionService.ts` - Transaction management with balance validation
- `commissionService.ts` - Commission calculation and collection
- `dashboardService.ts` - Analytics and KPI calculations

### Development Workflow
1. Database changes: Update `src/lib/db/schema.ts`, then run `npm run db:generate` and `npm run db:migrate`
2. New features: Follow the existing service pattern for business logic
3. Testing: No formal test suite - use `npm run db:setup` for clean test data
4. Mobile development: Work in `mobile/caisse-secours/` directory with separate npm commands

### Configuration Files
- `drizzle.config.ts` - Database ORM configuration
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS styling
- `mobile/caisse-secours/capacitor.config.ts` - Mobile app configuration

The application follows a monorepo structure with the main web application at root and mobile apps in the `mobile/` directory.