import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';
import { generatePaymentToken, generatePaymentLinkExpiry } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND i.payment_status = $${paramCount}`;
      queryParams.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (i.invoice_number ILIKE $${paramCount} OR c.name ILIKE $${paramCount} OR c.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND i.payment_status = $${countParamCount}`;
      countParams.push(status);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (i.invoice_number ILIKE $${countParamCount} OR c.name ILIKE $${countParamCount} OR c.email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      invoices: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const {
      invoice_number,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      invoice_date,
      due_date,
      amount_due,
      notes,
    } = await request.json();

    // Validate required fields
    if (!invoice_number || !customer_name || !customer_email || !invoice_date || !due_date || !amount_due) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if invoice number already exists
    const existingInvoice = await pool.query(
      'SELECT id FROM invoices WHERE invoice_number = $1',
      [invoice_number]
    );

    if (existingInvoice.rows.length > 0) {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 400 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create or get customer
      let customerId;
      const existingCustomer = await client.query(
        'SELECT id FROM customers WHERE email = $1',
        [customer_email]
      );

      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
        // Update customer info
        await client.query(
          'UPDATE customers SET name = $1, phone = $2, address = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
          [customer_name, customer_phone, customer_address, customerId]
        );
      } else {
        const newCustomer = await client.query(
          'INSERT INTO customers (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING id',
          [customer_name, customer_email, customer_phone, customer_address]
        );
        customerId = newCustomer.rows[0].id;
      }

      // Generate payment link token
      const paymentToken = generatePaymentToken();
      const paymentExpiry = generatePaymentLinkExpiry();

      // Create invoice
      const newInvoice = await client.query(
        `INSERT INTO invoices 
         (invoice_number, customer_id, invoice_date, due_date, amount_due, notes, payment_link_token, payment_link_expires_at, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [invoice_number, customerId, invoice_date, due_date, amount_due, notes, paymentToken, paymentExpiry, decoded.id]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Invoice created successfully',
        invoice: newInvoice.rows[0],
        paymentLink: `${process.env.NEXTAUTH_URL}/pay/${paymentToken}`,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}