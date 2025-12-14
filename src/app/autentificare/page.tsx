'use client';

/**
 * Login Page - Modern Design
 */

import React, { Suspense } from 'react';
import Link from 'next/link';
import { Briefcase, TrendingUp, Users, Shield, Sparkles } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';

function LoginContent() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-blue-400/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Lucru și Afaceri</span>
          </div>
          
          {/* Main message */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold leading-tight mb-4">
                Conectează-te cu<br />
                <span className="text-blue-200">oportunitățile</span> potrivite
              </h1>
              <p className="text-blue-100 text-lg max-w-md">
                Platformă de anunțuri pentru muncă, afaceri și servicii. Găsește exact ce cauți.
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-sm">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Anunțuri Verificate</h3>
                  <p className="text-blue-200 text-sm">Mii de oferte actualizate zilnic</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-sm">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Comunitate Activă</h3>
                  <p className="text-blue-200 text-sm">Conectează-te cu profesioniști</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-sm">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Sigur și Rapid</h3>
                  <p className="text-blue-200 text-sm">Datele tale sunt protejate</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <p className="text-blue-200 text-sm">
            © 2024 Lucru și Afaceri. Toate drepturile rezervate.
          </p>
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Lucru și Afaceri</h1>
          </div>
          
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Bine ai revenit!</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Autentificare
            </h2>
            <p className="text-gray-500">
              Intră în contul tău pentru a continua
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <LoginForm />
          </div>
          
          {/* Additional Links */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Continuând, ești de acord cu{' '}
              <Link href="/termeni" className="text-blue-600 hover:underline">
                Termenii
              </Link>
              {' '}și{' '}
              <Link href="/confidentialitate" className="text-blue-600 hover:underline">
                Politica de Confidențialitate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
