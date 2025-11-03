import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { isPaymentLinkExpired } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Payment token is required' },
        { status: 400 }
      );
    }

    // Get invoice by payment link token
    const result = await pool.query(
      `SELECT 
        i.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.payment_link_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired payment link' },
        { status: 404 }
      );
    }

    const invoice = result.rows[0];

    // Check if payment link is expired
    if (invoice.payment_link_expires_at && isPaymentLinkExpired(invoice.payment_link_expires_at)) {
      return NextResponse.json(
        { error: 'Payment link has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        customer_email: invoice.customer_email,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        amount_due: parseFloat(invoice.amount_due),
        payment_status: invoice.payment_status,
        payment_link_expires_at: invoice.payment_link_expires_at,
        notes: invoice.notes,
      },
    });
  } catch (error) {
    console.error('Get payment invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { amount, payment_method } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Payment token is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    // Get invoice by payment link token
    const invoiceResult = await pool.query(
      'SELECT * FROM invoices WHERE payment_link_token = $1',
      [token]
    );

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payment link' },
        { status: 404 }
      );
    }

    const invoice = invoiceResult.rows[0];

    // Check if already paid
    if (invoice.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice has already been paid' },
        { status: 400 }
      );
    }

    // Check if payment link is expired
    if (invoice.payment_link_expires_at && isPaymentLinkExpired(invoice.payment_link_expires_at)) {
      return NextResponse.json(
        { error: 'Payment link has expired' },
        { status: 410 }
      );
    }

    // Validate payment amount
    if (parseFloat(amount) !== parseFloat(invoice.amount_due)) {
      return NextResponse.json(
        { error: 'Payment amount does not match invoice amount' },
        { status: 400 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate transaction ID (in real implementation, this would come from payment gateway)
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Record payment
      await client.query(
        `INSERT INTO payments (invoice_id, amount, payment_method, transaction_id, status) 
         VALUES ($1, $2, $3, $4, $5)`,
        [invoice.id, amount, payment_method || 'credit_card', transactionId, 'completed']
      );

      // Update invoice status
      await client.query(
        'UPDATE invoices SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['paid', invoice.id]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Payment processed successfully',
        transaction_id: transactionId,
        amount: parseFloat(amount),
        invoice_number: invoice.invoice_number,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Process payment error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}