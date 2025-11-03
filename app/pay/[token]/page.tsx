'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency, formatDate, isPaymentLinkExpired } from '@/lib/utils';
import { Invoice } from '@/types';

export default function PaymentPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvoiceByToken();
    }
  }, [token]);

  const fetchInvoiceByToken = async () => {
    try {
      const response = await fetch(`/api/pay/${token}`);
      const data = await response.json();

      if (response.ok) {
        setInvoice(data.invoice);
      } else {
        setError(data.error || 'Invoice not found');
      }
    } catch (error) {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!invoice) return;

    setPaymentLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(`/api/pay/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: invoice.amount_due,
          payment_method: 'credit_card',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentSuccess(true);
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (error) {
      setError('Payment processing failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Link Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Please contact the company if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment of {formatCurrency(invoice!.amount_due)} for Invoice #{invoice!.invoice_number} has been processed successfully.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-green-900 mb-2">Payment Details:</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>Invoice: #{invoice!.invoice_number}</p>
                <p>Amount: {formatCurrency(invoice!.amount_due)}</p>
                <p>Date: {formatDate(new Date().toISOString())}</p>
                <p>Status: Completed</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              You will receive a confirmation email shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const isExpired = invoice.payment_link_expires_at && isPaymentLinkExpired(invoice.payment_link_expires_at);
  const isPaid = invoice.payment_status === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Payment</h1>
          <p className="text-gray-600 mt-2">Secure payment processing</p>
        </div>

        <div className="card">
          {/* Invoice Details */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-medium text-gray-900">#{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium text-gray-900">{invoice.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Date:</span>
                <span className="font-medium text-gray-900">{formatDate(invoice.invoice_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Amount Due:</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.amount_due)}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {isPaid ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-green-900">This invoice has already been paid.</span>
              </div>
            </div>
          ) : isExpired ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium text-red-900">This payment link has expired.</span>
              </div>
              <p className="text-red-700 text-sm mt-2">
                Please contact the company for a new payment link.
              </p>
            </div>
          ) : (
            <>
              {/* Payment Form */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Demo Mode:</strong> This is a demonstration. No actual payment will be processed.
                    Click "Pay Now" to simulate a successful payment.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="input-field"
                      disabled
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="input-field"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="input-field"
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="input-field"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  `Pay ${formatCurrency(invoice.amount_due)}`
                )}
              </button>
            </>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Your payment is secured with 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}