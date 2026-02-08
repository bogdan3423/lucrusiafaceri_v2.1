'use client';

/**
 * Admin Route Component
 * Restricts access to admin users only
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        const currentPath = window.location.pathname;
        router.push(`/autentificare?redirect=${encodeURIComponent(currentPath)}`);
      } else if (user.role === 'admin') {
        // User is admin
        setIsAdmin(true);
        setIsChecking(false);
      } else {
        // User is not admin
        setIsAdmin(false);
        setIsChecking(false);
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500">Se verifică permisiunile...</p>
        </div>
      </div>
    );
  }

  // User is not logged in
  if (!user) {
    return null;
  }

  // User is not an admin - show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acces interzis
          </h1>
          <p className="text-gray-600 mb-6">
            Nu aveți permisiunea să accesați această pagină. 
            Doar administratorii pot accesa panoul de administrare.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Înapoi la pagina principală
          </button>
        </div>
      </div>
    );
  }

  // User is admin, render children
  return <>{children}</>;
}
