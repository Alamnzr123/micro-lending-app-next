import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';
import { generatePaymentToken, generatePaymentLinkExpiry } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(
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

    // Get invoice
    const invoiceResult = await pool.query(
      'SELECT * FROM invoices WHERE id = $1',
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceResult.rows[0];

    if (invoice.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot generate payment link for paid invoice' },
        { status: 400 }
      );
    }

    // Generate new payment link token and expiry
    const paymentToken = generatePaymentToken();
    const paymentExpiry = generatePaymentLinkExpiry();

    // Update invoice with new payment link
    await pool.query(
      'UPDATE invoices SET payment_link_token = $1, payment_link_expires_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [paymentToken, paymentExpiry, invoiceId]
    );

    const paymentLink = `${process.env.NEXTAUTH_URL}/pay/${paymentToken}`;

    return NextResponse.json({
      message: 'Payment link generated successfully',
      paymentLink,
      expiresAt: paymentExpiry,
    });
  } catch (error) {
    console.error('Generate payment link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}