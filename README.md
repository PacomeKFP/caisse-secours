# Commission Management System

A comprehensive NextJS application for managing clients, transactions, and automated commission calculations.

## Features

- **Client Management**: Complete CRUD operations for client data
- **Transaction Tracking**: Deposit and withdrawal management with automatic balance updates
- **Commission Calculation**: Automated monthly commission calculation with tiered rates
- **Business Rules**: Temporal constraints and sequential calculation enforcement
- **Responsive UI**: Modern interface built with shadcn/ui and Tailwind CSS
- **Type Safety**: Full TypeScript implementation with Zod validation

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui components
- **Validation**: Zod for form and API validation
- **TypeScript**: Strict mode enabled

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd commission-management
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`
Edit `.env` with your database connection string.

4. Set up the database:
\`\`\`bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run initial setup (optional)
npm run db:seed
\`\`\`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to see the application.

## Commission Calculation Rules

### Commission Grid
- 0 - 10,000: 2%
- 10,001 - 50,000: 3.5%  
- 50,001+: 5%

### Business Rules
1. **5th Rule**: Cannot calculate commissions for month X before the 5th of the following month
2. **Sequential Calculation**: Missing previous months must be calculated first
3. **Uniqueness**: Cannot calculate commissions twice for the same month/client

## API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get client details
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Transactions
- `GET /api/clients/[id]/transactions` - Get client transactions
- `POST /api/transactions` - Create transaction

### Commissions
- `GET /api/commissions` - List commissions
- `POST /api/commissions/calculate` - Calculate monthly commissions

## Database Schema

The application uses three main entities:

- **Client**: Stores client information and current balance
- **Transaction**: Records all deposits and withdrawals (with inheritance pattern)
- **Commission**: Stores calculated monthly commissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
