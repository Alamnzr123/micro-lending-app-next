'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  email: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode token to get user info (simplified)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: payload.username, email: payload.email || '' });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">ML</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Micro Lending AR</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/invoices"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Invoices
            </Link>
            <Link
              href="/dashboard/customers"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Customers
            </Link>

            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <span className="text-gray-700">Welcome, </span>
                  <span className="font-medium text-gray-900">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}