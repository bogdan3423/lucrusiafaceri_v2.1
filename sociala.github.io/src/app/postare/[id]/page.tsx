'use client';

/**
 * Single Post Page
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Eye, 
  Heart, 
  Share2, 
  Phone,
  Mail,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { Post, User } from '@/types';
import { fetchPost } from '@/services/postsService';
import { getUserProfile } from '@/services/usersService';
import { formatDate, formatPrice } from '@/lib/utils';
import MediaCarousel from '@/components/ui/MediaCarousel';

export default function PostPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      try {
        const postData = await fetchPost(postId);
        if (postData) {
          setPost(postData);
          
          // Fetch author
          const userId = postData.userId || postData.sellerId;
          if (userId) {
            const userData = await getUserProfile(userId);
            setAuthor(userData);
          }
        } else {
          setError('Postarea nu a fost găsită.');
        }
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Eroare la încărcarea postării.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPost();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">😔</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {error || 'Postarea nu a fost găsită'}
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

  // Prepare media
  const media = post.media && post.media.length > 0 
    ? post.media 
    : [
        ...(post.images || []).map(url => ({ url, type: 'image' as const })),
        ...(post.videos || []).map(url => ({ url, type: 'video' as const })),
      ];

  const authorName = author?.fullName || post.userName || 'Anonim';
  const authorImage = author?.profileImage || post.userImage;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Înapoi la feed</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Media */}
          {media.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <MediaCarousel media={media} aspectRatio="video" />
            </div>
          )}

          {/* Post Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Title & Price */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
              {post.price !== undefined && post.price > 0 && (
                <span className="text-2xl font-bold text-blue-600 whitespace-nowrap">
                  {formatPrice(post.price, post.currency)}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
              {post.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{post.location}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
              {post.views !== undefined && (
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{post.views} vizualizări</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Descriere</h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {post.description || 'Fără descriere'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className="w-5 h-5 text-gray-500" />
                <span>Salvează</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="w-5 h-5 text-gray-500" />
                <span>Partajează</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Author Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Postat de
            </h3>
            
            {/* Author */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden flex items-center justify-center">
                {authorImage ? (
                  <Image
                    src={authorImage}
                    alt={authorName}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl text-white font-bold">
                    {authorName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{authorName}</p>
                {author?.city && (
                  <p className="text-sm text-gray-500">{author.city}</p>
                )}
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="space-y-3">
              {author?.phone && (
                <a
                  href={`tel:${author.phone}`}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>Sună acum</span>
                </a>
              )}
              
              <a
                href={`mailto:${author?.email || post.userEmail}`}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span>Trimite email</span>
              </a>
              
              <button className="flex items-center justify-center space-x-2 w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>Trimite mesaj</span>
              </button>
            </div>

            {/* View Profile */}
            <Link
              href={`/utilizator/${post.userId || post.sellerId}`}
              className="block text-center text-blue-600 hover:text-blue-700 text-sm mt-6"
            >
              Vezi profilul complet →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
