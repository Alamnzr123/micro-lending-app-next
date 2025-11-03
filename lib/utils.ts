import { v4 as uuidv4 } from 'uuid';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function generatePaymentToken(): string {
  return uuidv4();
}

export function generatePaymentLinkExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30); // 30 days from now
  return expiry;
}

export function isPaymentLinkExpired(expiryDate: string): boolean {
  return new Date() > new Date(expiryDate);
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'overdue':
      return 'text-red-600 bg-red-100';
    case 'cancelled':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateInvoiceNumber(invoiceNumber: string): boolean {
  // Invoice number should be alphanumeric and at least 3 characters
  const invoiceRegex = /^[A-Za-z0-9#-]+$/;
  return invoiceRegex.test(invoiceNumber) && invoiceNumber.length >= 3;
}