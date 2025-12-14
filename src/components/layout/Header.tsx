'use client';

/**
 * Header Component
 * Main navigation with auth-aware menu
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  User, 
  PlusSquare, 
  Settings, 
  LogOut, 
  LogIn, 
  UserPlus,
  Menu,
  X
} from 'lucide-react';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button - Left side on mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo - Centered on mobile, left-aligned on desktop */}
          <Link href="/" className="flex items-center gap-2 md:flex-none absolute left-1/2 -translate-x-1/2 md:relative md:left-0 md:translate-x-0 group">
            <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Lucru si Afaceri
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <>
                <NavLink href="/" icon={<Home className="w-5 h-5" />}>
                  Feed
                </NavLink>
                <NavLink href="/profil" icon={<User className="w-5 h-5" />}>
                  Profilul meu
                </NavLink>
                <NavLink href="/postare-noua" icon={<PlusSquare className="w-5 h-5" />}>
                  Postare nouă
                </NavLink>
                <NavLink href="/setari" icon={<Settings className="w-5 h-5" />}>
                  Setări
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Deconectare</span>
                </button>
              </>
            ) : (
              <>
                <NavLink href="/autentificare" icon={<LogIn className="w-5 h-5" />}>
                  Autentificare
                </NavLink>
                <NavLink href="/inregistrare" icon={<UserPlus className="w-5 h-5" />} primary>
                  Înregistrare
                </NavLink>
              </>
            )}
          </nav>

          {/* Spacer for mobile to balance the layout */}
          <div className="md:hidden w-10" />
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-1">
              {loading ? (
                <div className="w-full h-10 bg-gray-200 animate-pulse rounded-lg" />
              ) : user ? (
                <>
                  <MobileNavLink href="/" icon={<Home className="w-5 h-5" />} onClick={() => setMobileMenuOpen(false)}>
                    Feed
                  </MobileNavLink>
                  <MobileNavLink href="/profil" icon={<User className="w-5 h-5" />} onClick={() => setMobileMenuOpen(false)}>
                    Profilul meu
                  </MobileNavLink>
                  <MobileNavLink href="/postare-noua" icon={<PlusSquare className="w-5 h-5" />} onClick={() => setMobileMenuOpen(false)}>
                    Postare nouă
                  </MobileNavLink>
                  <MobileNavLink href="/setari" icon={<Settings className="w-5 h-5" />} onClick={() => setMobileMenuOpen(false)}>
                    Setări
                  </MobileNavLink>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Deconectare</span>
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/autentificare" icon={<LogIn className="w-5 h-5" />} onClick={() => setMobileMenuOpen(false)}>
                    Autentificare
                  </MobileNavLink>
                  <MobileNavLink href="/inregistrare" icon={<UserPlus className="w-5 h-5" />} onClick={() => setMobileMenuOpen(false)}>
                    Înregistrare
                  </MobileNavLink>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}

function NavLink({ href, icon, children, primary }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        primary
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

interface MobileNavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}

function MobileNavLink({ href, icon, children, onClick }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
