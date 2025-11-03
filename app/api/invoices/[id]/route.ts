import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Get invoice with customer details
    const invoiceResult = await pool.query(
      `SELECT 
        i.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = $1`,
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceResult.rows[0];

    // Get payment history for this invoice
    const paymentsResult = await pool.query(
      'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
      [invoiceId]
    );

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        customer_email: invoice.customer_email,
        customer_phone: invoice.customer_phone,
        customer_address: invoice.customer_address,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        amount_due: parseFloat(invoice.amount_due),
        payment_status: invoice.payment_status,
        payment_link_token: invoice.payment_link_token,
        payment_link_expires_at: invoice.payment_link_expires_at,
        notes: invoice.notes,
        created_by: invoice.created_by,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
      },
      payments: paymentsResult.rows.map(payment => ({
        id: payment.id,
        invoice_id: payment.invoice_id,
        amount: parseFloat(payment.amount),
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id,
        status: payment.status,
        created_at: payment.created_at,
      })),
    });
  } catch (error) {
    console.error('Get invoice details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const { payment_status, notes } = await request.json();

    // Validate payment status
    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
    if (payment_status && !validStatuses.includes(payment_status)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }

    // Check if invoice exists
    const existingInvoice = await pool.query(
      'SELECT * FROM invoices WHERE id = $1',
      [invoiceId]
    );

    if (existingInvoice.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (payment_status) {
      paramCount++;
      updateFields.push(`payment_status = $${paramCount}`);
      updateValues.push(payment_status);
    }

    if (notes !== undefined) {
      paramCount++;
      updateFields.push(`notes = $${paramCount}`);
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add updated_at and invoice ID
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    paramCount++;
    updateValues.push(invoiceId);

    const updateQuery = `
      UPDATE invoices 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, updateValues);

    return NextResponse.json({
      message: 'Invoice updated successfully',
      invoice: result.rows[0],
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}