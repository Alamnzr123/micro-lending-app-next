export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  invoice_date: string;
  due_date: string;
  amount_due: number;
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_link_token?: string;
  payment_link_expires_at?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  transaction_id?: string;
  status: string;
  created_at: string;
}

export interface CreateInvoiceData {
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  invoice_date: string;
  due_date: string;
  amount_due: number;
  notes?: string;
}

export interface PaymentLinkData {
  token: string;
  invoice_id: number;
  expires_at: string;
}