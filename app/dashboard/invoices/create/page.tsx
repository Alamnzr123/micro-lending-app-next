'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateEmail, validateInvoiceNumber } from '@/lib/utils';

export default function CreateInvoicePage() {
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount_due: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'Invoice number is required';
    } else if (!validateInvoiceNumber(formData.invoice_number)) {
      newErrors.invoice_number = 'Invalid invoice number format';
    }

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Customer email is required';
    } else if (!validateEmail(formData.customer_email)) {
      newErrors.customer_email = 'Invalid email format';
    }

    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    } else if (new Date(formData.due_date) <= new Date(formData.invoice_date)) {
      newErrors.due_date = 'Due date must be after invoice date';
    }

    if (!formData.amount_due || parseFloat(formData.amount_due) <= 0) {
      newErrors.amount_due = 'Valid amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount_due: parseFloat(formData.amount_due),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setPaymentLink(data.paymentLink);
      } else {
        setErrors({ general: data.error || 'Failed to create invoice' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Invoice #{formData.invoice_number} has been created and a payment link has been generated.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Payment Link:</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={paymentLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(paymentLink)}
                  className="btn-secondary text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Share this link with your customer to collect payment.
              </p>
            </div>

            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => {
                  setSuccess(false);
                  setFormData({
                    invoice_number: '',
                    customer_name: '',
                    customer_email: '',
                    customer_phone: '',
                    customer_address: '',
                    invoice_date: new Date().toISOString().split('T')[0],
                    due_date: '',
                    amount_due: '',
                    notes: '',
                  });
                  setPaymentLink('');
                }}
                className="btn-secondary"
              >
                Create Another
              </button>
              <Link href="/dashboard/invoices" className="btn-primary">
                View All Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/invoices" className="hover:text-primary-600">Invoices</Link>
          <span>/</span>
          <span>Create</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="text-gray-600">Generate a new invoice and payment link for your customer.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Invoice Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  id="invoice_number"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleInputChange}
                  className={`input-field ${errors.invoice_number ? 'border-red-300' : ''}`}
                  placeholder="e.g., INV-12345"
                />
                {errors.invoice_number && (
                  <p className="text-red-600 text-sm mt-1">{errors.invoice_number}</p>
                )}
              </div>

              <div>
                <label htmlFor="amount_due" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Due *
                </label>
                <input
                  type="number"
                  id="amount_due"
                  name="amount_due"
                  value={formData.amount_due}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`input-field ${errors.amount_due ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                />
                {errors.amount_due && (
                  <p className="text-red-600 text-sm mt-1">{errors.amount_due}</p>
                )}
              </div>

              <div>
                <label htmlFor="invoice_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  id="invoice_date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleInputChange}
                  className={`input-field ${errors.invoice_date ? 'border-red-300' : ''}`}
                />
                {errors.invoice_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.invoice_date}</p>
                )}
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className={`input-field ${errors.due_date ? 'border-red-300' : ''}`}
                />
                {errors.due_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.due_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  className={`input-field ${errors.customer_name ? 'border-red-300' : ''}`}
                  placeholder="John Doe"
                />
                {errors.customer_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.customer_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Email *
                </label>
                <input
                  type="email"
                  id="customer_email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  className={`input-field ${errors.customer_email ? 'border-red-300' : ''}`}
                  placeholder="john@example.com"
                />
                {errors.customer_email && (
                  <p className="text-red-600 text-sm mt-1">{errors.customer_email}</p>
                )}
              </div>

              <div>
                <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  id="customer_phone"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="customer_address" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Address
                </label>
                <input
                  type="text"
                  id="customer_address"
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="123 Main St, City, State"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
              placeholder="Additional notes or payment terms..."
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
            <Link href="/dashboard/invoices" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}