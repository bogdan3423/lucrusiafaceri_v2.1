'use client';

/**
 * User Profile Page (Public)
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Loader2
} from 'lucide-react';
import { User, Post } from '@/types';
import { getUserProfile } from '@/services/usersService';
import { fetchUserPosts } from '@/services/postsService';
import { formatDate } from '@/lib/utils';
import PostFeed from '@/components/posts/PostFeed';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [userData, userPosts] = await Promise.all([
          getUserProfile(userId),
          fetchUserPosts(userId),
        ]);
        
        if (userData) {
          setUser(userData);
          setPosts(userPosts);
        } else {
          setError('Utilizatorul nu a fost găsit.');
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Eroare la încărcarea profilului.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">😔</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {error || 'Utilizatorul nu a fost găsit'}
        </h1>
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Înapoi la feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="md:max-w-2xl lg:max-w-4xl md:mx-auto md:px-6 lg:px-8 md:py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 px-3 py-3 md:px-0 md:mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Înapoi la feed</span>
        </Link>

        {/* Profile Header - Full-width on mobile */}
        <div className="bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-100 overflow-hidden mb-2 md:mb-8">
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
        </div>

        {/* Profile Info */}
        <div className="relative px-4 pb-4 md:px-6 md:pb-6">
          {/* Avatar */}
          <div className="absolute -top-10 md:-top-12 left-4 md:left-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden flex items-center justify-center">
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

          {/* User Details */}
          <div className="pt-12 md:pt-16">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
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
              <span className="text-2xl font-bold text-gray-900">{posts.length}</span>
              <span className="text-gray-500 ml-1">postări</span>
            </div>
          </div>
        </div>
      </div>

        {/* User Posts */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 px-3 py-3 md:px-0 md:mb-6">Postări</h2>
          {posts.length > 0 ? (
            <PostFeed initialPosts={posts} userId={userId} />
          ) : (
            <div className="text-center py-12 bg-white md:rounded-xl md:border md:border-gray-100 mx-3 md:mx-0">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📭</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nicio postare</h3>
              <p className="text-gray-500">Acest utilizator nu are postări.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
