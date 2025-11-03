const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log('🚀 Setting up database...');

    // Create tables
    console.log('📋 Creating tables...');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'finance_manager',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20),
          address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
          id SERIAL PRIMARY KEY,
          invoice_number VARCHAR(50) UNIQUE NOT NULL,
          customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
          invoice_date DATE NOT NULL,
          due_date DATE NOT NULL,
          amount_due DECIMAL(10,2) NOT NULL,
          payment_status VARCHAR(20) DEFAULT 'pending',
          payment_link_token VARCHAR(255) UNIQUE,
          payment_link_expires_at TIMESTAMP,
          notes TEXT,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          payment_method VARCHAR(50),
          transaction_id VARCHAR(100),
          status VARCHAR(20) DEFAULT 'completed',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('📊 Creating indexes...');

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_payment_link_token ON invoices(payment_link_token)');

    console.log('👤 Creating default admin user...');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (username, email, password_hash, role) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', 'admin@microlending.com', hashedPassword, 'finance_manager']);

    console.log('🎯 Creating sample data...');

    // Create sample customer
    const customerResult = await client.query(`
      INSERT INTO customers (name, email, phone, address) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address
      RETURNING id
    `, ['John Doe', 'john.doe@example.com', '+1 (555) 123-4567', '123 Main St, Anytown, ST 12345']);

    const customerId = customerResult.rows[0].id;

    // Get admin user ID
    const adminResult = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    const adminId = adminResult.rows[0].id;

    // Create sample invoices
    const sampleInvoices = [
      {
        invoice_number: 'INV-2024-001',
        amount_due: 500.00,
        invoice_date: '2024-01-15',
        due_date: '2024-02-15',
        status: 'pending',
        notes: 'Monthly service fee'
      },
      {
        invoice_number: 'INV-2024-002',
        amount_due: 750.00,
        invoice_date: '2024-01-20',
        due_date: '2024-02-20',
        status: 'paid',
        notes: 'Consulting services'
      },
      {
        invoice_number: 'INV-2024-003',
        amount_due: 300.00,
        invoice_date: '2024-01-25',
        due_date: '2024-01-30',
        status: 'overdue',
        notes: 'Late payment fee'
      }
    ];

    for (const invoice of sampleInvoices) {
      const paymentToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const paymentExpiry = new Date();
      paymentExpiry.setDate(paymentExpiry.getDate() + 30);

      await client.query(`
        INSERT INTO invoices (invoice_number, customer_id, invoice_date, due_date, amount_due, payment_status, payment_link_token, payment_link_expires_at, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (invoice_number) DO NOTHING
      `, [
        invoice.invoice_number,
        customerId,
        invoice.invoice_date,
        invoice.due_date,
        invoice.amount_due,
        invoice.status,
        paymentToken,
        paymentExpiry,
        invoice.notes,
        adminId
      ]);
    }

    console.log('✅ Database setup completed successfully!');
    console.log('');
    console.log('🔑 Default login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('🌐 You can now start the application with: npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();