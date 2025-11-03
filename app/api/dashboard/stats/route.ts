import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';

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

    // Get dashboard statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_invoices,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN payment_status = 'overdue' OR (payment_status = 'pending' AND due_date < CURRENT_DATE) THEN 1 END) as overdue_invoices,
        COALESCE(SUM(CASE WHEN payment_status != 'paid' THEN amount_due ELSE 0 END), 0) as total_amount_due,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount_due ELSE 0 END), 0) as total_amount_paid
      FROM invoices
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    return NextResponse.json({
      totalInvoices: parseInt(stats.total_invoices),
      pendingInvoices: parseInt(stats.pending_invoices),
      paidInvoices: parseInt(stats.paid_invoices),
      overdueInvoices: parseInt(stats.overdue_invoices),
      totalAmountDue: parseFloat(stats.total_amount_due),
      totalAmountPaid: parseFloat(stats.total_amount_paid),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}