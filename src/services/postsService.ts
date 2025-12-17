'use client';

/**
 * Posts Service
 * Handles all post-related operations with Firestore
 */

import {
  collection,
  query,
  where,
  limit,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentSnapshot,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, COLLECTIONS } from '@/lib/firebase';
import { Post, MediaItem, CategoryKey, CreatePostData } from '@/types';
import { timestampToDate, getTimestampValue } from '@/lib/utils';

const POSTS_PER_PAGE = 15;

// Cache for posts - including 'all' feed
const postsCache = new Map<string, { posts: Post[]; lastDoc: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes for faster updates

// Clear cache on page visibility change (when user comes back to tab)
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Clear stale cache entries when user returns
      const now = Date.now();
      postsCache.forEach((value, key) => {
        if (now - value.timestamp > CACHE_TTL) {
          postsCache.delete(key);
        }
      });
    }
  });
}

// Export function to manually clear cache if needed
export function clearPostsCache() {
  postsCache.clear();
}

/**
 * Convert Firestore document to Post object
 * REAL FIELD MAPPING based on actual Firebase data:
 * - name -> title
 * - fileUrls -> images (array of full URLs)
 * - sellerId -> userId
 * - sellerName -> userName
 * - sellerProfilePic -> userImage
 * - sellerCity -> location
 */
function docToPost(doc: QueryDocumentSnapshot | DocumentSnapshot): Post {
  const data = doc.data();
  if (!data) {
    throw new Error('Document data is undefined');
  }

  // Check for images in multiple field formats (new and legacy)
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];
  
  // Helper to check if URL is a video
  const isVideoUrl = (url: string) => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || 
           lowerUrl.includes('.webm') || 
           lowerUrl.includes('.mov') ||
           lowerUrl.includes('.avi') ||
           lowerUrl.includes('video');
  };
  
  // New format: images and videos arrays (only if they have content)
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    imageUrls.push(...data.images);
  }
  if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
    videoUrls.push(...data.videos);
  }
  
  // Legacy format: fileUrls, fileUrl, imageUrl (only if no images/videos found)
  if (imageUrls.length === 0 && videoUrls.length === 0) {
    if (data.fileUrls && Array.isArray(data.fileUrls) && data.fileUrls.length > 0) {
      // Separate videos and images based on URL or fileType
      data.fileUrls.forEach((url: string) => {
        if (data.fileType?.includes('video') || isVideoUrl(url)) {
          videoUrls.push(url);
        } else {
          imageUrls.push(url);
        }
      });
    } else if (data.fileUrl && typeof data.fileUrl === 'string') {
      if (data.fileType?.includes('video') || isVideoUrl(data.fileUrl)) {
        videoUrls.push(data.fileUrl);
      } else {
        imageUrls.push(data.fileUrl);
      }
    } else if (data.imageUrl && typeof data.imageUrl === 'string') {
      imageUrls.push(data.imageUrl);
    }
  }
  
  // Build media array from images and videos
  const media: MediaItem[] = [
    ...imageUrls.map((url: string) => ({
      url,
      type: 'image' as const,
    })),
    ...videoUrls.map((url: string) => ({
      url,
      type: 'video' as const,
    })),
  ];

  return {
    id: doc.id,
    title: data.name || data.title || '', // REAL field is 'name'
    description: data.description || '',
    price: data.price,
    currency: data.currency || 'RON',
    location: data.sellerCity || data.location || '', // REAL field is 'sellerCity'
    category: data.category,
    images: imageUrls, // Use extracted image URLs
    videos: videoUrls, // Use extracted video URLs
    media,
    userId: data.sellerId || data.userId, // REAL field is 'sellerId'
    sellerId: data.sellerId,
    userEmail: data.sellerEmail || data.userEmail || '',
    userName: data.sellerName || data.userName || '', // REAL field is 'sellerName'
    userImage: data.sellerProfilePic || data.userImage || '', // REAL field is 'sellerProfilePic'
    status: data.status || 'active',
    views: data.views || 0,
    saves: data.likeCount || data.saves || 0, // REAL field is 'likeCount'
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

/**
 * Fetch posts with pagination
 */
export async function fetchPosts(
  category?: CategoryKey | string | null,
  lastDoc?: QueryDocumentSnapshot | null
): Promise<{ posts: Post[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
  try {
    // Check cache for first page (including 'all' feed)
    const cacheKey = category || 'all';
    if (!lastDoc) {
      const cached = postsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return {
          posts: cached.posts,
          lastDoc: cached.lastDoc,
          hasMore: cached.posts.length >= POSTS_PER_PAGE,
        };
      }
    }

    // Build query - fetch enough to ensure we have posts after filtering
    const queryLimit = 50; // Balance between speed and having enough posts
    let postsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS),
      limit(queryLimit)
    );

    if (lastDoc) {
      postsQuery = query(
        collection(db, COLLECTIONS.PRODUCTS),
        startAfter(lastDoc),
        limit(queryLimit)
      );
    }

    const snapshot = await getDocs(postsQuery);
    // Filter out inactive posts client-side (allow posts without status or with active status)
    let posts = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        return !data.status || data.status === 'active';
      })
      .map(docToPost);

    // Filter by category client-side
    if (category && category !== 'all') {
      const otherCategories: CategoryKey[] = ['auto', 'imobiliare', 'bazar', 'jobs', 'dating'];
      
      if (category === 'construction') {
        // Construction: posts without category or with category 'construction'
        posts = posts.filter(post => {
          const cat = post.category;
          return !cat || cat === 'construction' || !otherCategories.includes(cat);
        });
      } else {
        posts = posts.filter(post => post.category === category);
      }
    }

    // Sort by createdAt descending (newest first)
    posts.sort((a, b) => {
      const timeA = getTimestampValue(a.createdAt);
      const timeB = getTimestampValue(b.createdAt);
      return timeB - timeA;
    });

    // Paginate
    const paginatedPosts = posts.slice(0, POSTS_PER_PAGE);
    const hasMore = posts.length > POSTS_PER_PAGE;
    const newLastDoc = snapshot.docs[Math.min(POSTS_PER_PAGE - 1, snapshot.docs.length - 1)] || null;

    // Cache first page (including 'all' feed)
    if (!lastDoc) {
      postsCache.set(cacheKey, {
        posts: paginatedPosts,
        lastDoc: newLastDoc,
        timestamp: Date.now(),
      });
    }

    return {
      posts: paginatedPosts,
      lastDoc: newLastDoc,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

/**
 * Fetch all posts (for feed page)
 */
export async function fetchAllPosts(
  lastDoc?: QueryDocumentSnapshot | null
): Promise<{ posts: Post[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
  return fetchPosts(null, lastDoc);
}

/**
 * Fetch a single post by ID
 */
export async function fetchPost(postId: string): Promise<Post | null> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docToPost(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * Fetch posts by user ID
 */
export async function fetchUserPosts(userId: string): Promise<Post[]> {
  try {
    // Try with sellerId first (legacy field)
    let postsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('sellerId', '==', userId),
      limit(100)
    );

    let snapshot = await getDocs(postsQuery);

    // If no results, try with userId
    if (snapshot.empty) {
      postsQuery = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('userId', '==', userId),
        limit(100)
      );
      snapshot = await getDocs(postsQuery);
    }

    let posts = snapshot.docs.map(docToPost);
    
    // Filter active and sort
    posts = posts
      .filter(post => post.status === 'active')
      .sort((a, b) => {
        const timeA = getTimestampValue(a.createdAt);
        const timeB = getTimestampValue(b.createdAt);
        return timeB - timeA;
      })
      .slice(0, 50);

    return posts;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
}

/**
 * Create a new post
 */
export async function createPost(
  postData: CreatePostData,
  userId: string,
  userEmail: string,
  userName: string,
  userImage: string,
  mediaFiles: File[]
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Upload media files
    const images: string[] = [];
    const videos: string[] = [];

    for (const file of mediaFiles) {
      const isVideo = file.type.startsWith('video/');
      const folder = isVideo ? 'videos' : 'images';
      const fileName = `${folder}/${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      if (isVideo) {
        videos.push(downloadUrl);
      } else {
        images.push(downloadUrl);
      }
    }

    // Create post document
    const post = {
      ...postData,
      images,
      videos,
      userId,
      sellerId: userId, // Keep for compatibility
      userEmail,
      userName,
      userImage,
      status: 'active',
      views: 0,
      saves: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), post);

    // Invalidate cache
    if (postData.category) {
      postsCache.delete(postData.category);
    }
    postsCache.delete('all');

    return { success: true, postId: docRef.id };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: 'Eroare la crearea anunțului' };
  }
}

/**
 * Update a post
 */
export async function updatePost(
  postId: string,
  updates: Partial<Post>
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, postId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Invalidate cache
    postsCache.clear();

    return { success: true };
  } catch (error) {
    console.error('Error updating post:', error);
    return { success: false, error: 'Eroare la actualizarea anunțului' };
  }
}

/**
 * Delete a post (soft delete)
 */
export async function deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, postId);
    await updateDoc(docRef, {
      status: 'deleted',
      updatedAt: serverTimestamp(),
    });

    // Invalidate cache
    postsCache.clear();

    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error: 'Eroare la ștergerea anunțului' };
  }
}

/**
 * Hard delete a post - removes from Firestore and deletes media from Storage
 */
export async function hardDeletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First, fetch the post to get media URLs
    const docRef = doc(db, COLLECTIONS.PRODUCTS, postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Postarea nu a fost găsită' };
    }

    const data = docSnap.data();
    
    // Collect all media URLs from various possible fields
    const mediaUrls: string[] = [];
    
    if (data.fileUrls && Array.isArray(data.fileUrls)) {
      mediaUrls.push(...data.fileUrls);
    }
    if (data.fileUrl && typeof data.fileUrl === 'string') {
      mediaUrls.push(data.fileUrl);
    }
    if (data.imageUrl && typeof data.imageUrl === 'string') {
      mediaUrls.push(data.imageUrl);
    }
    if (data.images && Array.isArray(data.images)) {
      mediaUrls.push(...data.images);
    }
    if (data.videos && Array.isArray(data.videos)) {
      mediaUrls.push(...data.videos);
    }

    // Delete media files from Firebase Storage
    for (const url of mediaUrls) {
      try {
        // Extract path from Firebase Storage URL
        // URLs look like: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?...
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
        if (pathMatch) {
          const decodedPath = decodeURIComponent(pathMatch[1]);
          const storageRef = ref(storage, decodedPath);
          await deleteObject(storageRef);
        }
      } catch (storageError) {
        // Log but continue - file might already be deleted or URL format different
        console.warn('Could not delete media file:', url, storageError);
      }
    }

    // Delete the document from Firestore
    await deleteDoc(docRef);

    // Invalidate cache
    postsCache.clear();

    return { success: true };
  } catch (error) {
    console.error('Error hard deleting post:', error);
    return { success: false, error: 'Eroare la ștergerea anunțului' };
  }
}

/**
 * Search posts by query
 */
export async function searchPosts(searchQuery: string, posts: Post[]): Promise<Post[]> {
  const query = searchQuery.toLowerCase().trim();
  
  if (!query) return posts;

  return posts.filter(post => {
    const title = (post.title || '').toLowerCase();
    const description = (post.description || '').toLowerCase();
    const location = (post.location || '').toLowerCase();
    
    return (
      title.includes(query) ||
      description.includes(query) ||
      location.includes(query)
    );
  });
}
