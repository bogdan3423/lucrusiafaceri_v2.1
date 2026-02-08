'use client';

/**
 * Register Form Component - Modern Design
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, MapPin, Loader2, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterForm() {
  const router = useRouter();
  const { signUp, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    city: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    // Validation
    if (!formData.email.trim() || !formData.password.trim() || !formData.fullName.trim()) {
      setLocalError('Te rog completează câmpurile obligatorii.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Parolele nu coincid.');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Parola trebuie să aibă minim 6 caractere.');
      return;
    }

    const result = await signUp(formData.email, formData.password, {
      fullName: formData.fullName,
      phone: formData.phone,
      city: formData.city,
    });

    if (result.success) {
      router.push('/');
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Slabă', color: 'bg-red-500' };
    if (password.length < 8) return { strength: 2, label: 'Medie', color: 'bg-yellow-500' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: 'Puternică', color: 'bg-green-500' };
    }
    return { strength: 2, label: 'Medie', color: 'bg-yellow-500' };
  };

  const passwordStrength = getPasswordStrength();

  // Render input field with modern styling
  const renderInput = (
    id: string,
    name: string,
    type: string,
    label: string,
    placeholder: string,
    icon: React.ReactNode,
    required: boolean = false,
    extraProps: Record<string, unknown> = {}
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs sm:text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-blue-500">*</span>}
      </label>
      <div className={`relative transition-all duration-200 ${focusedField === name ? 'scale-[1.02]' : ''}`}>
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          <span className={`transition-colors duration-200 ${focusedField === name ? 'text-blue-600' : 'text-gray-400'}`}>
            {icon}
          </span>
        </div>
        <input
          type={type}
          id={id}
          name={name}
          value={formData[name as keyof typeof formData]}
          onChange={handleChange}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField(null)}
          placeholder={placeholder}
          className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:ring-0 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base"
          required={required}
          {...extraProps}
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {/* Error message */}
      {(error || localError) && (
        <div className="flex items-start space-x-3 p-3 sm:p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
          <span>{error || localError}</span>
        </div>
      )}

      {/* Full Name */}
      {renderInput('fullName', 'fullName', 'text', 'Nume complet', 'Ion Popescu', <User className="h-4 w-4 sm:h-5 sm:w-5" />, true)}

      {/* Email */}
      {renderInput('email', 'email', 'email', 'Adresa de email', 'nume@exemplu.com', <Mail className="h-4 w-4 sm:h-5 sm:w-5" />, true)}

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700">
          Parolă <span className="text-blue-500">*</span>
        </label>
        <div className={`relative transition-all duration-200 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Lock className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200 ${focusedField === 'password' ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            placeholder="Minim 6 caractere"
            className="w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:ring-0 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
        {/* Password strength indicator */}
        {formData.password && (
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex space-x-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    level <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className={`text-xs font-medium ${
              passwordStrength.strength === 1 ? 'text-red-600' :
              passwordStrength.strength === 2 ? 'text-yellow-600' :
              passwordStrength.strength === 3 ? 'text-green-600' : 'text-gray-400'
            }`}>
              {passwordStrength.label}
            </span>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-gray-700">
          Confirmă parola <span className="text-blue-500">*</span>
        </label>
        <div className={`relative transition-all duration-200 ${focusedField === 'confirmPassword' ? 'scale-[1.02]' : ''}`}>
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Lock className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200 ${focusedField === 'confirmPassword' ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
            placeholder="Repetă parola"
            className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:ring-0 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base"
            required
          />
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            </div>
          )}
        </div>
      </div>

      {/* Optional Fields Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone */}
        {renderInput('phone', 'phone', 'tel', 'Telefon', '0712 345 678', <Phone className="h-4 w-4 sm:h-5 sm:w-5" />)}

        {/* City */}
        {renderInput('city', 'city', 'text', 'Oraș', 'București', <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />)}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full group relative flex items-center justify-center space-x-2 px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 text-sm sm:text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            <span>Se creează contul...</span>
          </>
        ) : (
          <>
            <span>Creează cont gratuit</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-4 sm:my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm">
          <span className="px-4 bg-white text-gray-500">sau</span>
        </div>
      </div>

      {/* Login link */}
      <div className="text-center">
        <p className="text-gray-600 text-sm sm:text-base">
          Ai deja un cont?{' '}
          <Link 
            href="/autentificare" 
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors inline-flex items-center space-x-1 group"
          >
            <span>Autentifică-te</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </p>
      </div>
    </form>
  );
}
