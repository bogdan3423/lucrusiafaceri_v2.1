'use client';

/**
 * Register Page - Modern Design
 */

import React from 'react';
import Link from 'next/link';
import { Briefcase, CheckCircle2, Zap, Heart, Globe, Sparkles } from 'lucide-react';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const benefits = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Publică Gratuit',
      description: 'Postează anunțuri nelimitat, fără costuri',
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'Vizibilitate Maximă',
      description: 'Ajunge la mii de utilizatori zilnic',
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: 'Comunitate',
      description: 'Conectează-te cu profesioniști',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-20 w-60 h-60 bg-blue-400/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
          
          {/* Animated circles */}
          <div className="absolute top-20 right-20 w-4 h-4 bg-white/30 rounded-full animate-pulse" />
          <div className="absolute top-40 right-40 w-2 h-2 bg-white/40 rounded-full animate-pulse delay-75" />
          <div className="absolute bottom-40 left-20 w-3 h-3 bg-white/30 rounded-full animate-pulse delay-150" />
          
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
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
                Începe-ți povestea<br />
                <span className="text-blue-200">de succes</span> azi
              </h1>
              <p className="text-blue-100 text-lg max-w-md">
                Creează-ți contul gratuit și accesează cele mai bune oportunități de muncă și afaceri.
              </p>
            </div>
            
            {/* Benefits */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-sm hover:bg-white/15 transition-colors"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="text-blue-200 text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Testimonial */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-sm">
              <div className="flex items-center space-x-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-blue-100 text-sm italic mb-3">
                &ldquo;Am găsit jobul perfect în doar 2 săptămâni. Platforma e intuitivă și ușor de folosit!&rdquo;
              </p>
              <p className="text-white font-medium text-sm">— Maria D., București</p>
            </div>
          </div>
          
          {/* Footer */}
          <p className="text-blue-200 text-sm">
            © 2024 Lucru și Afaceri. Toate drepturile rezervate.
          </p>
        </div>
      </div>
      
      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
              <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Lucru și Afaceri</h1>
          </div>
          
          {/* Welcome Text */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Înregistrare gratuită</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Creează-ți contul
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Completează datele pentru a începe
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 sm:p-6 lg:p-8">
            <RegisterForm />
          </div>
          
          {/* Additional Links */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-500 text-xs sm:text-sm px-4">
              Prin crearea contului, ești de acord cu{' '}
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
