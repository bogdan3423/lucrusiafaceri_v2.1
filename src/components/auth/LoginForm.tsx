'use client';

/**
 * Login Form Component - Modern Design
 */

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('Te rog completează toate câmpurile.');
      return;
    }

    const result = await signIn(email, password);
    
    if (result.success) {
      router.push(redirectUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error message */}
      {(error || localError) && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error || localError}</span>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
          Adresa de email
        </label>
        <div className={`relative transition-all duration-200 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            placeholder="nume@exemplu.com"
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:ring-0 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
          Parolă
        </label>
        <div className={`relative transition-all duration-200 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'password' ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            placeholder="••••••••"
            className="w-full pl-12 pr-14 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:ring-0 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Forgot password link */}
      <div className="flex justify-end">
        <Link
          href="/recuperare-parola"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Ai uitat parola?
        </Link>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full group relative flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Se autentifică...</span>
          </>
        ) : (
          <>
            <span>Intră în cont</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">sau</span>
        </div>
      </div>

      {/* Register link */}
      <div className="text-center">
        <p className="text-gray-600">
          Nu ai un cont încă?{' '}
          <Link 
            href="/inregistrare" 
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors inline-flex items-center space-x-1 group"
          >
            <span>Creează cont gratuit</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </p>
      </div>
    </form>
  );
}
