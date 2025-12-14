'use client';

/**
 * Edit Profile Page
 * Allows users to update their profile information and photos
 */

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Camera,
  Loader2,
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { updateUserProfile, uploadProfileImage, uploadCoverImage } from '@/services/usersService';

function EditProfileContent() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  
  // Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [bio, setBio] = useState(user?.bio || '');
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadType, setUploadType] = useState<'profile' | 'cover' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // File input refs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsUploading(true);
    setUploadType('profile');
    setErrorMessage(null);

    try {
      await uploadProfileImage(user.uid, file);
      await refreshUser();
      setSuccessMessage('Fotografia de profil a fost actualizată!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setErrorMessage('Eroare la încărcarea fotografiei de profil');
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsUploading(true);
    setUploadType('cover');
    setErrorMessage(null);

    try {
      await uploadCoverImage(user.uid, file);
      await refreshUser();
      setSuccessMessage('Fotografia de copertă a fost actualizată!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error uploading cover image:', error);
      setErrorMessage('Eroare la încărcarea fotografiei de copertă');
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const result = await updateUserProfile(user.uid, {
        fullName,
        phone,
        city,
        bio,
      });

      if (result.success) {
        await refreshUser();
        setSuccessMessage('Profilul a fost salvat cu succes!');
        setTimeout(() => {
          setSuccessMessage(null);
          router.push('/profil');
        }, 1500);
      } else {
        setErrorMessage(result.error || 'Eroare la salvarea profilului');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Eroare la salvarea profilului');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Editează Profilul</h1>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}

      {/* Cover & Profile Photo Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Cover Image */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-500 to-blue-600 relative">
          {user.coverImage && (
            <Image
              src={user.coverImage}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverImageChange}
            className="hidden"
          />
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isUploading && uploadType === 'cover' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Se încarcă...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Schimbă coperta</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Photo */}
        <div className="relative px-6 pb-6">
          <div className="absolute -top-12 left-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden flex items-center justify-center shadow-lg">
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={user.fullName || 'Profile'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-white font-bold">
                    {user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
              <button
                onClick={() => profileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
              >
                {isUploading && uploadType === 'profile' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-16">
            <p className="text-sm text-gray-500">
              Click pe iconița de cameră pentru a schimba fotografia de profil
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informații Personale</h2>
        
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Nume complet</span>
              </div>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Introduceți numele complet"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">Emailul nu poate fi modificat</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Telefon</span>
              </div>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Introduceți numărul de telefon"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Oraș</span>
              </div>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Introduceți orașul"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Descriere</span>
              </div>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Scrieți câteva cuvinte despre dvs."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Anulează
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Se salvează...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Salvează</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <ProtectedRoute>
      <EditProfileContent />
    </ProtectedRoute>
  );
}
