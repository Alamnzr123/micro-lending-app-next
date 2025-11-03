'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate, getPaymentStatusColor } from '@/lib/utils';
import { Invoice, Payment } from '@/types';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
        setPayments(data.payments || []);
      } else {
        setError('Invoice not found');
      }
    } catch (error) {
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentLink = async () => {
    if (!invoice) return;

    setPaymentLinkLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoice.id}/payment-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        navigator.clipboard.writeText(data.paymentLink);
        alert('Payment link copied to clipboard!');
        // Refresh invoice data to get updated payment link info
        fetchInvoiceDetails();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to generate payment link');
      }
    } catch (error) {
      alert('Failed to generate payment link');
    } finally {
      setPaymentLinkLoading(false);
    }
  };

  const updateInvoiceStatus = async (newStatus: string) => {
    if (!invoice) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_status: newStatus }),
      });

      if (response.ok) {
        fetchInvoiceDetails(); // Refresh data
      } else {
        alert('Failed to update invoice status');
      }
    } catch (error) {
      alert('Failed to update invoice status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard/invoices" className="btn-primary">
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/invoices" className="hover:text-primary-600">Invoices</Link>
        <span>/</span>
        <span>{invoice.invoice_number}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice {invoice.invoice_number}</h1>
          <p className="text-gray-600 mt-1">Created on {formatDate(invoice.created_at)}</p>
        </div>
        <div className="flex space-x-3">
          {invoice.payment_status !== 'paid' && (
            <button
              onClick={generatePaymentLink}
              disabled={paymentLinkLoading}
              className="btn-secondary disabled:opacity-50"
            >
              {paymentLinkLoading ? 'Generating...' : 'Generate Payment Link'}
            </button>
          )}
          <Link href={`/dashboard/invoices/${invoice.id}/edit`} className="btn-secondary">
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <div className="card">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
              <span className={`status-badge ${getPaymentStatusColor(invoice.payment_status)}`}>
                {invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Invoice Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-medium text-gray-900">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(invoice.invoice_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Due:</span>
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(invoice.amount_due)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <div className="font-medium text-gray-900">{invoice.customer_name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <div className="font-medium text-gray-900">{invoice.customer_email}</div>
                  </div>
                  {invoice.customer_phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <div className="font-medium text-gray-900">{invoice.customer_phone}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-gray-900">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Yet</h3>
                <p className="text-gray-600">Payments will appear here once the customer pays.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.payment_method || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.transaction_id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`status-badge ${getPaymentStatusColor(payment.status)}`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {invoice.payment_status !== 'paid' && (
                <>
                  <button
                    onClick={generatePaymentLink}
                    disabled={paymentLinkLoading}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {paymentLinkLoading ? 'Generating...' : 'Generate Payment Link'}
                  </button>
                  
                  <button
                    onClick={() => updateInvoiceStatus('paid')}
                    className="w-full btn-secondary"
                  >
                    Mark as Paid
                  </button>
                  
                  <button
                    onClick={() => updateInvoiceStatus('cancelled')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel Invoice
                  </button>
                </>
              )}
              
              <Link
                href={`/dashboard/invoices/${invoice.id}/edit`}
                className="w-full btn-secondary block text-center"
              >
                Edit Invoice
              </Link>
            </div>
          </div>

          {/* Payment Link Info */}
          {invoice.payment_link_token && invoice.payment_status !== 'paid' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Link</h3>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Status:</strong> Active
                  </p>
                  {invoice.payment_link_expires_at && (
                    <p className="text-sm text-blue-800">
                      <strong>Expires:</strong> {formatDate(invoice.payment_link_expires_at)}
                    </p>
                  )}
                </div>
                
                {/* Payment Link URL Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-2">Payment URL:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/pay/${invoice.payment_link_token}`}
                      readOnly
                      className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1 text-gray-700"
                    />
                    <button
                      onClick={() => {
                        const paymentLink = `${window.location.origin}/pay/${invoice.payment_link_token}`;
                        navigator.clipboard.writeText(paymentLink);
                        alert('Payment link copied to clipboard!');
                      }}
                      className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <a
                    href={`/pay/${invoice.payment_link_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-primary text-center block"
                  >
                    🔗 Open Payment Page
                  </a>
                  <button
                    onClick={() => {
                      const paymentLink = `${window.location.origin}/pay/${invoice.payment_link_token}`;
                      navigator.clipboard.writeText(paymentLink);
                      alert('Payment link copied to clipboard!');
                    }}
                    className="w-full btn-secondary text-sm"
                  >
                    📋 Copy Payment Link
                  </button>
                  <div className="text-xs text-gray-500 text-center pt-2">
                    Share this link with your customer
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoice.amount_due)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium text-gray-900">$0.00</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(invoice.amount_due)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}