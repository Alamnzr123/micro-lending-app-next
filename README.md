# Micro Lending Accounts Receivable Management System

A comprehensive web application built with Next.js and PostgreSQL for managing accounts receivable in a micro-lending company. The system enables Finance Managers to create and track invoices while providing customers with a seamless payment experience through secure payment links.

## 🚀 Features

### Finance Manager (Creditor) Features
- **Secure Authentication**: Username/password authentication with JWT tokens
- **Invoice Management**: Create, view, search, and filter invoices
- **Customer Management**: Automatic customer creation and management
- **Payment Link Generation**: Create secure, time-limited payment links
- **Dashboard Analytics**: Real-time statistics and financial overview
- **Responsive Design**: Mobile-friendly interface

### Customer (Debtor) Features
- **No Login Required**: Hassle-free payment experience
- **Secure Payment Processing**: SSL-encrypted payment interface
- **Payment Link Validation**: Automatic expiry and status checking
- **Payment Confirmation**: Instant payment confirmation and receipt

## 🛠 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd micro-lending-ar-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
Create a PostgreSQL database and run the schema:

```bash
# Connect to PostgreSQL
psql -U your_username -d postgres

# Create database
CREATE DATABASE micro_lending_db;

# Connect to the new database
\c micro_lending_db

# Run the schema (copy content from lib/db-schema.sql)
```

### 4. Environment Configuration
Copy `.env.local` and update with your database credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/micro_lending_db

# JWT Secret for Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Payment Gateway (Mock for demo)
PAYMENT_GATEWAY_URL=https://api.mockpayment.com
```

### 5. Run the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## 👤 Default Login Credentials

**Finance Manager:**
- Username: `admin`
- Password: `admin123`

## 🏗 Project Structure

```
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── dashboard/            # Dashboard data endpoints
│   │   ├── invoices/             # Invoice management endpoints
│   │   └── pay/                  # Payment processing endpoints
│   ├── dashboard/                # Finance Manager dashboard
│   │   ├── invoices/             # Invoice management pages
│   │   └── customers/            # Customer management pages
│   ├── login/                    # Authentication page
│   ├── pay/                      # Customer payment pages
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication utilities
│   ├── database.ts               # Database connection
│   ├── utils.ts                  # Helper functions
│   └── db-schema.sql             # Database schema
├── types/                        # TypeScript type definitions
└── middleware.ts                 # Next.js middleware for route protection
```

## 🧪 Test Cases Implementation

The system implements all the specified test cases:

### Authentication Tests
- ✅ **Test Case 1**: Successful login with valid credentials
- ✅ **Test Case 2**: Authentication failure with invalid credentials

### Invoice Management Tests
- ✅ **Test Case 3**: Create invoice with valid information
- ✅ **Test Case 4**: Validation error for missing customer information
- ✅ **Test Case 5**: View all invoices with comprehensive details
- ✅ **Test Case 6**: Search invoices by number, customer name, or email
- ✅ **Test Case 7**: Filter invoices by payment status

### Payment Link Tests
- ✅ **Test Case 8**: Generate unique payment links for invoices
- ✅ **Test Case 9**: Customer redirection to secure payment page
- ✅ **Test Case 10**: Successful payment processing and confirmation
- ✅ **Test Case 11**: Expired payment link error handling

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Route Protection**: Middleware-based route protection
- **Input Validation**: Comprehensive form validation
- **SQL Injection Prevention**: Parameterized queries
- **Payment Link Expiry**: Time-limited payment links (30 days)

## 📊 Database Schema

### Tables
- **users**: Finance manager accounts
- **customers**: Customer information
- **invoices**: Invoice records with payment tracking
- **payments**: Payment transaction history

### Key Relationships
- Invoices → Customers (Many-to-One)
- Payments → Invoices (Many-to-One)
- Invoices → Users (Many-to-One, created_by)

## 🎨 Design Decisions & Assumptions

### Architecture Decisions
1. **Next.js App Router**: Modern React framework with built-in API routes
2. **PostgreSQL**: Robust relational database for financial data
3. **JWT Authentication**: Stateless authentication suitable for web applications
4. **Component-based UI**: Reusable components for maintainability

### Business Logic Assumptions
1. **Customer Auto-creation**: Customers are created automatically when creating invoices
2. **Payment Link Expiry**: 30-day expiration for security
3. **Single Payment per Invoice**: One-time payment model
4. **Demo Payment Gateway**: Mock payment processing for demonstration

### UI/UX Decisions
1. **Responsive Design**: Mobile-first approach with Tailwind CSS
2. **Intuitive Navigation**: Clear breadcrumbs and navigation structure
3. **Status Indicators**: Color-coded payment status badges
4. **Real-time Feedback**: Loading states and success/error messages

## 🚀 Additional Features

Beyond the core requirements, the system includes:

- **Dashboard Analytics**: Financial overview with key metrics
- **Advanced Search**: Multi-field search functionality
- **Pagination**: Efficient data loading for large datasets
- **Payment History**: Complete audit trail of payments
- **Responsive Design**: Optimized for all device sizes
- **Error Handling**: Comprehensive error management
- **Loading States**: User-friendly loading indicators

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - Finance manager login

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

### Invoices
- `GET /api/invoices` - List invoices with filtering
- `POST /api/invoices` - Create new invoice
- `POST /api/invoices/[id]/payment-link` - Generate payment link

### Payments
- `GET /api/pay/[token]` - Get invoice by payment token
- `POST /api/pay/[token]` - Process payment

## 🧪 Testing the Application

### Manual Testing Scenarios

1. **Finance Manager Workflow**:
   - Login with admin/admin123
   - Create a new invoice
   - Generate payment link
   - View dashboard statistics

2. **Customer Payment Workflow**:
   - Use generated payment link
   - Complete mock payment
   - Verify payment confirmation

3. **Search and Filter Testing**:
   - Search invoices by customer name
   - Filter by payment status
   - Test pagination

## 🚀 Deployment Considerations

### Production Setup
1. **Environment Variables**: Update all secrets and database URLs
2. **Database Migration**: Run schema on production database
3. **SSL Certificate**: Enable HTTPS for secure payments
4. **Payment Gateway**: Integrate with real payment processor
5. **Email Notifications**: Add email confirmations for payments

### Performance Optimizations
- Database indexing for search queries
- Image optimization for faster loading
- API response caching where appropriate
- Connection pooling for database

## 📝 License

This project is developed for demonstration purposes. Please ensure compliance with relevant financial regulations when deploying in production.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For questions or support, please contact the development team or create an issue in the repository.