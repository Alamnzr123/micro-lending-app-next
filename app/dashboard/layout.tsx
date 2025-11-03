'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Client-side authentication check
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Basic token format validation
    if (!token.includes('.') || token.split('.').length !== 3) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }

    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}