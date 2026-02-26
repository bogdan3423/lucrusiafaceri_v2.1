'use client';

/**
 * Post Card Component - Premium Instagram-style Layout
 * 
 * KEY PRINCIPLES:
 * - Instant rendering with stable layout
 * - Images load efficiently, no visible placeholders
 * - Videos show FIRST FRAME immediately (using #t=0.001)
 * - No gray boxes, no skeletons during load
 */

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Share2, MoreHorizontal, ImageOff, ChevronLeft, ChevronRight, X, Play, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { Post, MediaItem, Comment } from '@/types';
import { formatDate, formatPrice } from '@/lib/utils';
import OptimizedImage from '@/components/ui/OptimizedImage';
import LazyVideo from '@/components/ui/LazyVideo';
import { useAuth } from '@/contexts/AuthContext';
import { likePost, unlikePost, addComment, getComments, deleteComment } from '@/services/postsService';

interface PostCardProps {
  post: Post;
  priority?: boolean;
}

const PostCard = memo(function PostCard({ post, priority = false }: PostCardProps) {
  const { user } = useAuth();
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // Like state
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.uid || '') || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || post.likes?.length || 0);
  const [isLiking, setIsLiking] = useState(false);
  
  // Comment state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  
  // Share state
  const [showCopied, setShowCopied] = useState(false);
  
  // Deleting comment state
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Build media array from post data
  const media: MediaItem[] = useMemo(() => {
    if (post.media && post.media.length > 0) return post.media;
    
    const items: MediaItem[] = [];
    if (post.images?.length) {
      post.images.forEach(url => items.push({ url, type: 'image' }));
    }
    if (post.videos?.length) {
      post.videos.forEach(url => items.push({ url, type: 'video' }));
    }
    return items;
  }, [post.media, post.images, post.videos]);

  // Separate images for lightbox
  const imageMedia = useMemo(() => media.filter(m => m.type === 'image'), [media]);



  const authorName = post.userName || 'Anonim';
  const authorImage = post.userImage;

  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  }, []);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  }, []);

  const handleImageClick = useCallback((item: MediaItem) => {
    if (item.type === 'image') {
      const imageIndex = imageMedia.findIndex(img => img.url === item.url);
      if (imageIndex !== -1) {
        openLightbox(imageIndex);
      }
    }
  }, [imageMedia, openLightbox]);

  // Handle like/unlike
  const handleLike = useCallback(async () => {
    if (!user) return; // User must be logged in
    if (isLiking) return;
    
    setIsLiking(true);
    const wasLiked = isLiked;
    
    // Optimistic update
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    
    try {
      const result = wasLiked 
        ? await unlikePost(post.id, user.uid)
        : await likePost(post.id, user.uid);
      
      if (!result.success) {
        // Revert on error
        setIsLiked(wasLiked);
        setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
      }
    } catch {
      // Revert on error
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  }, [user, isLiked, isLiking, post.id]);

  // Load comments
  const loadComments = useCallback(async () => {
    if (isLoadingComments) return;
    setIsLoadingComments(true);
    try {
      const fetchedComments = await getComments(post.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [post.id, isLoadingComments]);

  // Toggle comments section
  const handleToggleComments = useCallback(() => {
    const newShowComments = !showComments;
    setShowComments(newShowComments);
    if (newShowComments && comments.length === 0) {
      loadComments();
    }
  }, [showComments, comments.length, loadComments]);

  // Submit comment
  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      const result = await addComment(
        post.id,
        user.uid,
        user.fullName || 'Anonim',
        user.profileImage,
        newComment.trim()
      );
      
      if (result.success && result.comment) {
        setComments(prev => [result.comment!, ...prev]);
        setCommentsCount(prev => prev + 1);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  }, [user, newComment, isSubmittingComment, post.id]);

  // Handle share
  const handleShare = useCallback(async () => {
    const postUrl = `${window.location.origin}/postare/${post.id}`;
    
    try {
      await navigator.clipboard.writeText(postUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  }, [post.id]);

  // Handle delete comment
  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!user || deletingCommentId) return;
    
    setDeletingCommentId(commentId);
    try {
      const result = await deleteComment(post.id, commentId);
      if (result.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setCommentsCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setDeletingCommentId(null);
    }
  }, [user, deletingCommentId, post.id]);

  // Render media item
  const renderMediaItem = useCallback((item: MediaItem, index: number) => {
    if (item.type === 'video') {
      return (
        <LazyVideo
          src={item.url}
          poster={item.thumbnailUrl}
        />
      );
    }
    
    if (imageErrors.has(index)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
          <ImageOff className="w-8 h-8" />
        </div>
      );
    }
    
    return (
      <OptimizedImage
        src={item.url}
        alt=""
        priority={priority && index === 0}
        onError={() => handleImageError(index)}
      />
    );
  }, [imageErrors, priority, handleImageError]);

  // Grid layout for media
  const renderMediaGrid = () => {
    if (media.length === 0) {
      return (
        <div className="aspect-square flex flex-col items-center justify-center bg-gray-50 text-gray-300">
          <ImageOff className="w-16 h-16 mb-3" />
          <span>Fără imagine</span>
        </div>
      );
    }

    // Single media item
    if (media.length === 1) {
      const item = media[0];
      return (
        <div 
          className={`aspect-square sm:aspect-[4/3] overflow-hidden bg-gray-50 ${item.type === 'image' ? 'cursor-pointer' : ''}`}
          onClick={() => item.type === 'image' && handleImageClick(item)}
        >
          {renderMediaItem(item, 0)}
        </div>
      );
    }

    // Two videos - swipeable carousel
    if (media.length === 2 && media.every(m => m.type === 'video')) {
      return (
        <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-gray-50">
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentVideoIndex * 100}%)` }}
          >
            {media.map((item, index) => (
              <div key={index} className="w-full h-full flex-shrink-0">
                <LazyVideo src={item.url} poster={item.thumbnailUrl} />
              </div>
            ))}
          </div>
          
          {/* Navigation */}
          {currentVideoIndex > 0 && (
            <button
              onClick={() => setCurrentVideoIndex(i => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg z-10"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
          )}
          {currentVideoIndex < media.length - 1 && (
            <button
              onClick={() => setCurrentVideoIndex(i => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg z-10"
            >
              <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>
          )}
          
          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${index === currentVideoIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </div>
      );
    }

    // Two media items - side by side
    if (media.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-0.5 aspect-[2/1]">
          {media.map((item, index) => (
            <div 
              key={index}
              className={`overflow-hidden bg-gray-50 ${item.type === 'image' ? 'cursor-pointer' : ''}`}
              onClick={() => item.type === 'image' && handleImageClick(item)}
            >
              {renderMediaItem(item, index)}
            </div>
          ))}
        </div>
      );
    }

    // Three media items
    if (media.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-0.5 aspect-square">
          <div 
            className={`row-span-2 overflow-hidden bg-gray-50 ${media[0].type === 'image' ? 'cursor-pointer' : ''}`}
            onClick={() => media[0].type === 'image' && handleImageClick(media[0])}
          >
            {renderMediaItem(media[0], 0)}
          </div>
          {media.slice(1).map((item, i) => (
            <div 
              key={i + 1}
              className={`overflow-hidden bg-gray-50 ${item.type === 'image' ? 'cursor-pointer' : ''}`}
              onClick={() => item.type === 'image' && handleImageClick(item)}
            >
              {renderMediaItem(item, i + 1)}
            </div>
          ))}
        </div>
      );
    }

    // Four media items
    if (media.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-0.5 aspect-square">
          {media.map((item, index) => (
            <div 
              key={index}
              className={`overflow-hidden bg-gray-50 ${item.type === 'image' ? 'cursor-pointer' : ''}`}
              onClick={() => item.type === 'image' && handleImageClick(item)}
            >
              {renderMediaItem(item, index)}
            </div>
          ))}
        </div>
      );
    }

    // 5+ media items - 2x2 grid with +N overlay
    const displayMedia = media.slice(0, 4);
    const remainingCount = media.length - 4;

    return (
      <div className="grid grid-cols-2 gap-0.5 aspect-square">
        {displayMedia.map((item, index) => (
          <div 
            key={index}
            className={`relative overflow-hidden bg-gray-50 ${item.type === 'image' ? 'cursor-pointer' : ''}`}
            onClick={() => item.type === 'image' && handleImageClick(item)}
          >
            {renderMediaItem(item, index)}
            {index === 3 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                <span className="text-white text-2xl sm:text-3xl font-bold">+{remainingCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <article className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 overflow-hidden md:hover:shadow-lg transition-shadow border-b-8 border-gray-100 md:border-b-0 md:mb-6">
        {/* Header */}
        <div className="px-3 py-3 md:p-4 flex items-center justify-between">
          <Link href={`/utilizator/${post.userId || post.sellerId || ''}`} className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                {authorImage ? (
                  <img
                    src={authorImage}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=3b82f6&color=fff&size=44`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{authorName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{authorName}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatDate(post.createdAt)}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    <span>{post.location}</span>
                  </>
                )}
              </div>
            </div>
          </Link>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Media Grid */}
        <div className="relative">
          {renderMediaGrid()}
          
          {/* Price Badge */}
          {post.price !== undefined && post.price > 0 && (
            <div className="absolute bottom-3 left-3 bg-white/95 px-3 py-1.5 rounded-full shadow-lg z-10">
              <span className="text-lg font-bold text-blue-600">
                {formatPrice(post.price, post.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-3 py-3 md:px-4 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button 
              onClick={handleLike}
              disabled={!user || isLiking}
              className={`flex items-center gap-1.5 transition-colors ${
                !user ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'
              } ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
              title={!user ? 'Conectează-te pentru a aprecia' : isLiked ? 'Elimină aprecierea' : 'Apreciază'}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount > 0 && (
                <span className="text-sm font-medium">{likesCount}</span>
              )}
            </button>
            
            {/* Comment Button */}
            <button 
              onClick={handleToggleComments}
              className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              {commentsCount > 0 && (
                <span className="text-sm font-medium">{commentsCount}</span>
              )}
            </button>
            
            {/* Share Button */}
            <div className="relative">
              <button 
                onClick={handleShare}
                className="text-gray-600 hover:text-green-500 transition-colors"
                title="Copiază linkul"
              >
                <Share2 className="w-6 h-6" />
              </button>
              {showCopied && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Link copiat!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-3 pb-3 md:px-4 border-t border-gray-100">
            {/* Comment Input */}
            {user ? (
              <form onSubmit={handleSubmitComment} className="flex items-center gap-2 py-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{user.fullName?.charAt(0) || 'U'}</span>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adaugă un comentariu..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-400"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className={`p-2 rounded-full transition-colors ${
                    newComment.trim() && !isSubmittingComment
                      ? 'text-blue-500 hover:bg-blue-50'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <div className="py-3 text-center text-sm text-gray-500">
                <Link href="/autentificare" className="text-blue-500 hover:underline">
                  Conectează-te
                </Link>
                {' '}pentru a comenta
              </div>
            )}

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="py-4 text-center text-gray-500 text-sm">
                Se încarcă comentariile...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 group">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      {comment.userImage ? (
                        <img src={comment.userImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-bold">{comment.userName?.charAt(0) || 'U'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{comment.userName}</span>
                          <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                        </div>
                        {user?.uid === comment.userId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                            title="Șterge comentariul"
                          >
                            {deletingCommentId === comment.id ? (
                              <span className="w-4 h-4 block border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500 text-sm">
                Nu există comentarii încă. Fii primul care comentează!
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-3 pb-3 md:px-4">
          <Link href={`/postare/${post.id}`}>
            <h3 className="font-bold text-base md:text-lg text-gray-900 hover:text-blue-600 line-clamp-2 mb-1">
              {post.title || 'Fără titlu'}
            </h3>
          </Link>
          {post.description && (
            <p className="text-gray-600 text-sm line-clamp-3 md:line-clamp-2">{post.description}</p>
          )}
        </div>

        {/* CTA */}
        <div className="px-3 pb-4 md:px-4">
          <Link
            href={`/postare/${post.id}`}
            className="block w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Vezi detalii
          </Link>
        </div>
      </article>

      {/* Lightbox Modal */}
      {lightboxOpen && imageMedia.length > 0 && (
        <ImageLightbox
          images={imageMedia}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}
    </>
  );
});

export default PostCard;

// Lightbox Component
interface ImageLightboxProps {
  images: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = React.useRef(0);
  const isDragging = React.useRef(false);

  const hasMultiple = images.length > 1;

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
    setDragOffset(0);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    setDragOffset(0);
  }, [images.length]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMultiple) goToPrev();
      if (e.key === 'ArrowRight' && hasMultiple) goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultiple, onClose, goToPrev, goToNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !hasMultiple) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const threshold = window.innerWidth * 0.2;
    
    if (dragOffset > threshold) {
      goToPrev();
    } else if (dragOffset < -threshold) {
      goToNext();
    } else {
      setDragOffset(0);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="text-white text-sm font-medium">
          {hasMultiple && `${currentIndex + 1} / ${images.length}`}
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Image Track */}
      <div 
        className="absolute inset-0 flex items-center"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
          willChange: 'transform',
        }}
      >
        {images.map((item, index) => (
          <div 
            key={index}
            className="w-full h-full flex-shrink-0 flex items-center justify-center p-4"
            style={{ minWidth: '100%' }}
          >
            <img
              src={item.url}
              alt=""
              className="max-w-full max-h-full object-contain"
              loading={Math.abs(index - currentIndex) <= 1 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors hidden sm:flex z-20"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors hidden sm:flex z-20"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {hasMultiple && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); setDragOffset(0); }}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
