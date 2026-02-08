'use client';

/**
 * Settings Page
 * User overview, posts management, and account settings
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  User, 
  Lock, 
  LogOut,
  ChevronRight,
  Loader2,
  Trash2,
  X,
  Calendar,
  ImageOff,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fetchUserPosts, hardDeletePost } from '@/services/postsService';
import { Post } from '@/types';
import { formatDate } from '@/lib/utils';

function SettingsContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // User posts state
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch user posts on mount
  useEffect(() => {
    const loadUserPosts = async () => {
      if (user?.uid) {
        setLoadingPosts(true);
        try {
          const posts = await fetchUserPosts(user.uid);
          setUserPosts(posts);
        } catch (error) {
          console.error('Error loading user posts:', error);
        } finally {
          setLoadingPosts(false);
        }
      }
    };
    loadUserPosts();
  }, [user?.uid]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    router.push('/');
  };

  const openDeleteModal = (post: Post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
    setDeleteError(null);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    setDeletingPostId(postToDelete.id);
    setDeleteError(null);
    
    try {
      const result = await hardDeletePost(postToDelete.id);
      
      if (result.success) {
        setUserPosts(prev => prev.filter(p => p.id !== postToDelete.id));
        closeDeleteModal();
      } else {
        setDeleteError(result.error || 'Eroare la ștergerea postării');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setDeleteError('Eroare la ștergerea postării');
    } finally {
      setDeletingPostId(null);
    }
  };

  const settingsSections = [
    {
      title: 'Cont',
      items: [
        {
          icon: <User className="w-5 h-5" />,
          label: 'Editează profilul',
          description: 'Schimbă numele, fotografia și detaliile',
          href: '/editeaza-profil',
        },
        {
          icon: <Lock className="w-5 h-5" />,
          label: 'Schimbă parola',
          description: 'Actualizează parola contului',
          href: '/schimba-parola',
        },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Setări</h1>
        <p className="text-gray-600 mt-1">
          Gestionează contul și preferințele tale
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-4">
          {user?.profileImage ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden">
              <Image
                src={user.profileImage}
                alt={user.fullName || 'Profile'}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {user?.fullName || 'Utilizator'}
            </h2>
            <p className="text-gray-500 truncate">{user?.email}</p>
            {user?.city && (
              <p className="text-sm text-gray-400 mt-0.5">{user.city}</p>
            )}
          </div>
        </div>
      </div>

      {/* User Posts Management Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Postările Mele ({userPosts.length})
        </h3>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-500">Se încarcă postările...</span>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nu ai nicio postare încă</p>
              <button
                onClick={() => router.push('/postare-noua')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Creează prima postare
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Post Media Preview */}
                    <div className="flex-shrink-0">
                      {post.images && post.images.length > 0 ? (
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={post.images[0]}
                            alt={post.title || 'Post image'}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageOff className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {post.title || 'Fără titlu'}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {post.description || 'Fără descriere'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(post.createdAt)}</span>
                        {post.images && post.images.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{post.images.length} {post.images.length === 1 ? 'imagine' : 'imagini'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="flex-shrink-0 flex items-start">
                      <button
                        onClick={() => openDeleteModal(post)}
                        disabled={deletingPostId === post.id}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Șterge postarea"
                      >
                        {deletingPostId === post.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">
            {section.title}
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {section.items.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                  index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <div className="mt-8">
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Se deconectează...</span>
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              <span>Deconectare</span>
            </>
          )}
        </button>
      </div>

      {/* App Info */}
      <div className="mt-8 text-center text-sm text-gray-400">
        <p>Lucru si Afaceri v1.0.0</p>
        <p className="mt-1">© 2024 Toate drepturile rezervate</p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && postToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={closeDeleteModal}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
              {/* Close button */}
              <button
                onClick={closeDeleteModal}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-6">
                {/* Icon */}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-7 w-7 text-red-600" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Șterge postarea
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-500 text-center mb-4">
                  Ești sigur că vrei să ștergi această postare? Această acțiune este ireversibilă și va șterge și toate imaginile/videoclipurile asociate.
                </p>

                {/* Post preview */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex gap-3">
                    {postToDelete.images && postToDelete.images.length > 0 ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={postToDelete.images[0]}
                          alt={postToDelete.title || 'Post'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <ImageOff className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {postToDelete.title || 'Fără titlu'}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {postToDelete.description || 'Fără descriere'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {deleteError && (
                  <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">
                    {deleteError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={closeDeleteModal}
                    disabled={deletingPostId !== null}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Anulează
                  </button>
                  <button
                    onClick={handleDeletePost}
                    disabled={deletingPostId !== null}
                    className="flex-1 px-4 py-2.5 text-white bg-red-600 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deletingPostId !== null ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Se șterge...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Șterge</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
