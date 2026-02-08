'use client';

/**
 * Profile Page
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Edit3, 
  Settings,
  Camera
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PostFeed from '@/components/posts/PostFeed';
import { fetchUserPosts } from '@/services/postsService';
import { formatDate } from '@/lib/utils';
import { Post } from '@/types';

function ProfileContent() {
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      if (user?.id) {
        setIsLoadingPosts(true);
        const posts = await fetchUserPosts(user.id);
        setUserPosts(posts);
        setIsLoadingPosts(false);
      }
    };
    loadPosts();
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {/* Cover Image */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-500 to-blue-600 relative">
          {user.coverImage && (
            <Image
              src={user.coverImage}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
          <button className="absolute bottom-4 right-4 p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-12 left-6">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden flex items-center justify-center">
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.fullName}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-white font-bold">
                  {user.fullName?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 space-x-3">
            <Link
              href="/setari"
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Setări</span>
            </Link>
            <Link
              href="/editeaza-profil"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editează</span>
            </Link>
          </div>

          {/* User Details */}
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {user.fullName || 'Utilizator'}
            </h1>
            {user.bio && (
              <p className="text-gray-600 mt-2">{user.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
              {user.city && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{user.city}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              {user.createdAt && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Membru din {formatDate(user.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6 pt-6 border-t border-gray-100">
            <div>
              <span className="text-2xl font-bold text-gray-900">{userPosts.length}</span>
              <span className="text-gray-500 ml-1">postări</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Postările mele</h2>
        {isLoadingPosts ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : userPosts.length > 0 ? (
          <PostFeed initialPosts={userPosts} userId={user.id} />
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nicio postare</h3>
            <p className="text-gray-500 mb-4">Nu ai publicat încă nicio postare.</p>
            <Link
              href="/postare-noua"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Creează prima postare
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
