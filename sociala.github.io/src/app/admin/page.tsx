'use client';

/**
 * Admin Dashboard Page
 * Management interface for posts, comments, and users
 * Accessible only to users with role: "admin"
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FileText,
  MessageSquare,
  Users,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronDown,
  Shield,
  ImageOff,
  RefreshCw,
  Video,
} from 'lucide-react';
import AdminRoute from '@/components/auth/AdminRoute';
import { Post, User, Comment } from '@/types';
import {
  fetchAllPostsAdmin,
  fetchAllUsersAdmin,
  fetchAllCommentsAdmin,
  adminDeletePost,
  adminDeleteComment,
  adminDeleteUser,
} from '@/services/adminService';
import { formatDate } from '@/lib/utils';
import { QueryDocumentSnapshot } from 'firebase/firestore';

type TabType = 'posts' | 'comments' | 'users';

interface DeleteModalState {
  isOpen: boolean;
  type: 'post' | 'comment' | 'user' | null;
  id: string;
  secondaryId?: string; // For comments, this is the postId
  title: string;
  deleteUserPosts?: boolean;
}

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsLastDoc, setPostsLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

  // Comments state
  const [comments, setComments] = useState<(Comment & { postTitle?: string })[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersLastDoc, setUsersLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    type: null,
    id: '',
    title: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteUserPostsOption, setDeleteUserPostsOption] = useState(false);

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'comments' && comments.length === 0 && commentsLoading) {
      loadComments();
    }
    if (activeTab === 'users' && users.length === 0 && usersLoading) {
      loadUsers();
    }
  }, [activeTab, comments.length, commentsLoading, users.length, usersLoading]);

  const loadPosts = async () => {
    setPostsLoading(true);
    const result = await fetchAllPostsAdmin();
    setPosts(result.posts);
    setPostsLastDoc(result.lastDoc);
    setPostsHasMore(result.hasMore);
    setPostsLoading(false);
  };

  const loadMorePosts = async () => {
    if (!postsLastDoc || loadingMorePosts) return;
    setLoadingMorePosts(true);
    const result = await fetchAllPostsAdmin(postsLastDoc);
    setPosts([...posts, ...result.posts]);
    setPostsLastDoc(result.lastDoc);
    setPostsHasMore(result.hasMore);
    setLoadingMorePosts(false);
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    const result = await fetchAllCommentsAdmin();
    setComments(result.comments);
    setCommentsLoading(false);
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    const result = await fetchAllUsersAdmin();
    setUsers(result.users);
    setUsersLastDoc(result.lastDoc);
    setUsersHasMore(result.hasMore);
    setUsersLoading(false);
  };

  const loadMoreUsers = async () => {
    if (!usersLastDoc || loadingMoreUsers) return;
    setLoadingMoreUsers(true);
    const result = await fetchAllUsersAdmin(usersLastDoc);
    setUsers([...users, ...result.users]);
    setUsersLastDoc(result.lastDoc);
    setUsersHasMore(result.hasMore);
    setLoadingMoreUsers(false);
  };

  const openDeleteModal = (
    type: 'post' | 'comment' | 'user',
    id: string,
    title: string,
    secondaryId?: string
  ) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      title,
      secondaryId,
    });
    setDeleteError(null);
    setDeleteUserPostsOption(false);
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      type: null,
      id: '',
      title: '',
    });
    setDeleteError(null);
    setDeleteUserPostsOption(false);
  };

  const handleDelete = async () => {
    if (!deleteModal.type || !deleteModal.id) return;

    setIsDeleting(true);
    setDeleteError(null);

    let result: { success: boolean; error?: string } = { success: false };

    try {
      switch (deleteModal.type) {
        case 'post':
          result = await adminDeletePost(deleteModal.id);
          if (result.success) {
            setPosts(posts.filter((p) => p.id !== deleteModal.id));
            // Also remove comments for this post from comments list
            setComments(comments.filter((c) => c.postId !== deleteModal.id));
          }
          break;
        case 'comment':
          if (deleteModal.secondaryId) {
            result = await adminDeleteComment(deleteModal.secondaryId, deleteModal.id);
            if (result.success) {
              setComments(comments.filter((c) => c.id !== deleteModal.id));
            }
          }
          break;
        case 'user':
          result = await adminDeleteUser(deleteModal.id, deleteUserPostsOption);
          if (result.success) {
            setUsers(users.filter((u) => u.id !== deleteModal.id));
            if (deleteUserPostsOption) {
              // Also remove user's posts from posts list
              setPosts(posts.filter((p) => p.userId !== deleteModal.id && p.sellerId !== deleteModal.id));
            }
          }
          break;
      }

      if (result.success) {
        closeDeleteModal();
      } else {
        setDeleteError(result.error || 'Eroare la ștergere');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError('Eroare neașteptată la ștergere');
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshData = () => {
    if (activeTab === 'posts') {
      loadPosts();
    } else if (activeTab === 'comments') {
      loadComments();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  };

  const tabs = [
    { id: 'posts' as TabType, label: 'Postări', icon: FileText, count: posts.length },
    { id: 'comments' as TabType, label: 'Comentarii', icon: MessageSquare, count: comments.length },
    { id: 'users' as TabType, label: 'Utilizatori', icon: Users, count: users.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-1.5 sm:p-2 rounded-lg">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Panou Administrare</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Gestionează postările, comentariile și utilizatorii platformei
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 sm:mb-6">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-100">
          <button
            onClick={refreshData}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">Reîmprospătează</span>
            <span className="xs:hidden">Refresh</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-2 sm:p-4">
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div>
              {postsLoading ? (
                <LoadingState message="Se încarcă postările..." />
              ) : posts.length === 0 ? (
                <EmptyState message="Nu există postări" />
              ) : (
                <>
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <PostItem
                        key={post.id}
                        post={post}
                        onDelete={() => openDeleteModal('post', post.id, post.title)}
                      />
                    ))}
                  </div>
                  {postsHasMore && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={loadMorePosts}
                        disabled={loadingMorePosts}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {loadingMorePosts ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        Încarcă mai multe
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div>
              {commentsLoading ? (
                <LoadingState message="Se încarcă comentariile..." />
              ) : comments.length === 0 ? (
                <EmptyState message="Nu există comentarii" />
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <CommentItem
                      key={`${comment.postId}-${comment.id}`}
                      comment={comment}
                      onDelete={() =>
                        openDeleteModal(
                          'comment',
                          comment.id,
                          comment.text.substring(0, 50) + '...',
                          comment.postId
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              {usersLoading ? (
                <LoadingState message="Se încarcă utilizatorii..." />
              ) : users.length === 0 ? (
                <EmptyState message="Nu există utilizatori" />
              ) : (
                <>
                  <div className="space-y-3">
                    {users.map((user) => (
                      <UserItem
                        key={user.id}
                        user={user}
                        onDelete={() =>
                          openDeleteModal('user', user.id, user.fullName || user.email)
                        }
                      />
                    ))}
                  </div>
                  {usersHasMore && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={loadMoreUsers}
                        disabled={loadingMoreUsers}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {loadingMoreUsers ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        Încarcă mai mulți
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md p-4 sm:p-6 sm:m-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-red-100 p-1.5 sm:p-2 rounded-full">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Confirmare ștergere
              </h3>
            </div>

            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Ești sigur că vrei să ștergi{' '}
              {deleteModal.type === 'post' && 'postarea'}
              {deleteModal.type === 'comment' && 'comentariul'}
              {deleteModal.type === 'user' && 'utilizatorul'}{' '}
              <strong className="text-gray-900 break-words">&quot;{deleteModal.title}&quot;</strong>?
            </p>

            {deleteModal.type === 'post' && (
              <p className="text-xs sm:text-sm text-amber-600 bg-amber-50 p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4">
                Această acțiune va șterge permanent postarea, toate comentariile asociate și fișierele media din storage.
              </p>
            )}

            {deleteModal.type === 'user' && (
              <div className="mb-3 sm:mb-4">
                <label className="flex items-start sm:items-center gap-2 p-2.5 sm:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={deleteUserPostsOption}
                    onChange={(e) => setDeleteUserPostsOption(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 sm:mt-0"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    Șterge și toate postările utilizatorului
                  </span>
                </label>
              </div>
            )}

            {deleteError && (
              <p className="text-xs sm:text-sm text-red-600 bg-red-50 p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4">
                {deleteError}
              </p>
            )}

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Se șterge...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Șterge
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Post Item Component
function PostItem({ post, onDelete }: { post: Post; onDelete: () => void }) {
  // Helper to check if URL is a video
  const isVideoUrl = (url: string) => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || 
           lowerUrl.includes('.webm') || 
           lowerUrl.includes('.mov') ||
           lowerUrl.includes('.avi') ||
           lowerUrl.includes('video');
  };

  // Get first image URL (not video)
  const imageUrl = post.images?.find(url => !isVideoUrl(url)) || 
                   post.media?.find(m => m.type === 'image')?.url;
  
  // Check if post has videos
  const hasVideos = (post.videos && post.videos.length > 0) || 
                    post.images?.some(url => isVideoUrl(url)) ||
                    post.media?.some(m => m.type === 'video');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* Top row: Thumbnail + Info */}
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
        {/* Thumbnail */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.title}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : hasVideos ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
              <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{post.title || 'Fără titlu'}</h4>
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {post.userName || 'Utilizator necunoscut'} • {formatDate(post.createdAt)}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-1 text-[10px] sm:text-xs text-gray-400">
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full ${
              post.status === 'active' ? 'bg-green-100 text-green-700' :
              post.status === 'deleted' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {post.status}
            </span>
            <span className="hidden xs:inline sm:inline">{post.commentsCount || 0} comentarii</span>
            <span className="hidden xs:inline sm:inline">{post.likesCount || 0} aprecieri</span>
          </div>
        </div>
      </div>

      {/* Actions - full width on mobile */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 mt-1 sm:mt-0">
        <Link
          href={`/postare/${post.id}`}
          target="_blank"
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:p-2 text-xs sm:text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Vezi postarea"
        >
          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sm:hidden">Vezi</span>
        </Link>
        <button
          onClick={onDelete}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:p-2 text-xs sm:text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Șterge postarea"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sm:hidden">Șterge</span>
        </button>
      </div>
    </div>
  );
}

// Comment Item Component
function CommentItem({
  comment,
  onDelete,
}: {
  comment: Comment & { postTitle?: string };
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* Top section with avatar and content */}
      <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Avatar */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {comment.userImage ? (
            <Image
              src={comment.userImage}
              alt={comment.userName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
              {comment.userName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="font-medium text-gray-900 text-sm sm:text-base">{comment.userName}</span>
            <span className="text-xs sm:text-sm text-gray-400">•</span>
            <span className="text-xs sm:text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-sm sm:text-base text-gray-700 mt-1 break-words">{comment.text}</p>
          <Link
            href={`/postare/${comment.postId}`}
            className="text-xs sm:text-sm text-blue-600 hover:underline mt-1 inline-block truncate max-w-full"
          >
            Pe: {comment.postTitle || 'Postare'}
          </Link>
        </div>
      </div>

      {/* Delete button */}
      <div className="flex justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 mt-1 sm:mt-0">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:p-2 text-xs sm:text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          title="Șterge comentariul"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sm:hidden">Șterge</span>
        </button>
      </div>
    </div>
  );
}

// User Item Component
function UserItem({ user, onDelete }: { user: User; onDelete: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* Top section with avatar and info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Avatar */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {user.profileImage ? (
            <Image
              src={user.profileImage}
              alt={user.fullName}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm sm:text-lg font-bold">
              {user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{user.fullName || 'Fără nume'}</h4>
            {user.role === 'admin' && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] sm:text-xs rounded-full font-medium">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">
            {user.city && `${user.city} • `}
            Înregistrat: {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 mt-1 sm:mt-0">
        <Link
          href={`/utilizator/${user.id}`}
          target="_blank"
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:p-2 text-xs sm:text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Vezi profilul"
        >
          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sm:hidden">Profil</span>
        </Link>
        {user.role !== 'admin' && (
          <button
            onClick={onDelete}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:p-2 text-xs sm:text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Șterge utilizatorul"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="sm:hidden">Șterge</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Loading State Component
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <FileText className="w-12 h-12 mb-3 opacity-50" />
      <p>{message}</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
}
