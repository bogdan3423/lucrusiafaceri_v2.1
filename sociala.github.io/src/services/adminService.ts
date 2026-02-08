'use client';

/**
 * Admin Service
 * Handles admin-specific operations for managing posts, comments, and users
 */

import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  limit,
  orderBy,
  startAfter,
  QueryDocumentSnapshot,
  where,
  increment,
  updateDoc,
  collectionGroup,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, COLLECTIONS } from '@/lib/firebase';
import { Post, User, Comment } from '@/types';
import { timestampToDate } from '@/lib/utils';
import { postsCache } from '@/lib/cache';

const ITEMS_PER_PAGE = 20;

/**
 * Convert Firestore document to Post object (simplified for admin)
 */
function docToPost(docSnap: QueryDocumentSnapshot): Post {
  const data = docSnap.data();
  
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];
  
  if (data.images && Array.isArray(data.images)) {
    imageUrls.push(...data.images);
  }
  if (data.videos && Array.isArray(data.videos)) {
    videoUrls.push(...data.videos);
  }
  if (data.fileUrls && Array.isArray(data.fileUrls)) {
    data.fileUrls.forEach((url: string) => {
      if (url.toLowerCase().includes('video')) {
        videoUrls.push(url);
      } else {
        imageUrls.push(url);
      }
    });
  }

  return {
    id: docSnap.id,
    title: data.name || data.title || '',
    description: data.description || '',
    price: data.price,
    currency: data.currency || 'RON',
    location: data.sellerCity || data.location || '',
    category: data.category,
    images: imageUrls,
    videos: videoUrls,
    media: [],
    userId: data.sellerId || data.userId,
    sellerId: data.sellerId,
    userEmail: data.sellerEmail || data.userEmail || '',
    userName: data.sellerName || data.userName || '',
    userImage: data.sellerProfilePic || data.userImage || '',
    status: data.status || 'active',
    views: data.views || 0,
    saves: data.likeCount || data.saves || 0,
    likes: data.likes || [],
    likesCount: data.likesCount || 0,
    commentsCount: data.commentsCount || 0,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

/**
 * Convert Firestore document to User object
 */
function docToUser(docSnap: QueryDocumentSnapshot): User {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    uid: data.uid || docSnap.id,
    email: data.email || '',
    fullName: data.fullName || '',
    phone: data.phone || '',
    city: data.city || '',
    profileImage: data.profileImage || '',
    coverImage: data.coverImage || '',
    bio: data.bio || '',
    role: data.role || 'user',
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

/**
 * Fetch all posts for admin (including inactive)
 */
export async function fetchAllPostsAdmin(
  lastDoc?: QueryDocumentSnapshot | null
): Promise<{ posts: Post[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
  try {
    let postsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS),
      orderBy('createdAt', 'desc'),
      limit(ITEMS_PER_PAGE)
    );

    if (lastDoc) {
      postsQuery = query(
        collection(db, COLLECTIONS.PRODUCTS),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(ITEMS_PER_PAGE)
      );
    }

    const snapshot = await getDocs(postsQuery);
    const posts = snapshot.docs.map(docToPost);
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    return {
      posts,
      lastDoc: newLastDoc,
      hasMore: snapshot.docs.length === ITEMS_PER_PAGE,
    };
  } catch (error) {
    console.error('Error fetching all posts for admin:', error);
    return { posts: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Fetch all users for admin
 */
export async function fetchAllUsersAdmin(
  lastDoc?: QueryDocumentSnapshot | null
): Promise<{ users: User[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
  try {
    let usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      orderBy('createdAt', 'desc'),
      limit(ITEMS_PER_PAGE)
    );

    if (lastDoc) {
      usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(ITEMS_PER_PAGE)
      );
    }

    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map(docToUser);
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    return {
      users,
      lastDoc: newLastDoc,
      hasMore: snapshot.docs.length === ITEMS_PER_PAGE,
    };
  } catch (error) {
    console.error('Error fetching all users for admin:', error);
    return { users: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Fetch all comments across all posts for admin
 * Uses collectionGroup for efficient querying and parallel post title fetching
 * Sorts client-side to avoid needing a Firestore index
 */
export async function fetchAllCommentsAdmin(): Promise<{ comments: (Comment & { postTitle?: string })[]; }> {
  try {
    // Use collectionGroup to fetch all comments from all posts in a single query
    // No orderBy to avoid requiring a Firestore index
    const commentsQuery = query(
      collectionGroup(db, 'comments'),
      limit(200) // Fetch more since we'll sort client-side
    );
    
    const commentsSnapshot = await getDocs(commentsQuery);
    
    // Collect unique post IDs
    const postIds = new Set<string>();
    const commentsData: Array<{
      id: string;
      postId: string;
      data: Record<string, unknown>;
    }> = [];
    
    commentsSnapshot.docs.forEach((commentDoc) => {
      // Extract postId from the document path: products/{postId}/comments/{commentId}
      const pathParts = commentDoc.ref.path.split('/');
      const postId = pathParts[1]; // products/{postId}/comments/{commentId}
      
      postIds.add(postId);
      commentsData.push({
        id: commentDoc.id,
        postId,
        data: commentDoc.data() as Record<string, unknown>,
      });
    });
    
    // Fetch post titles in parallel (batch of 10 for Firestore 'in' query limit)
    const postTitles: Record<string, string> = {};
    const postIdsArray = Array.from(postIds);
    
    // Fetch posts in batches of 10
    const batchSize = 10;
    const batches: string[][] = [];
    for (let i = 0; i < postIdsArray.length; i += batchSize) {
      batches.push(postIdsArray.slice(i, i + batchSize));
    }
    
    await Promise.all(batches.map(async (batch) => {
      const postsQuery = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('__name__', 'in', batch)
      );
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.docs.forEach((postDoc) => {
        const data = postDoc.data();
        postTitles[postDoc.id] = data.name || data.title || 'Postare fără titlu';
      });
    }));
    
    // Build comments array with post titles
    const allComments: (Comment & { postTitle?: string })[] = commentsData.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      postTitle: postTitles[comment.postId] || 'Postare fără titlu',
      userId: comment.data.userId as string,
      userName: comment.data.userName as string,
      userImage: comment.data.userImage as string | undefined,
      text: comment.data.text as string,
      createdAt: timestampToDate(comment.data.createdAt),
    }));
    
    // Sort by createdAt descending (newest first) - client-side to avoid index requirement
    allComments.sort((a, b) => {
      const timeA = a.createdAt?.getTime() || 0;
      const timeB = b.createdAt?.getTime() || 0;
      return timeB - timeA;
    });
    
    // Return only the first 100
    return { comments: allComments.slice(0, 100) };
  } catch (error) {
    console.error('Error fetching all comments for admin:', error);
    return { comments: [] };
  }
}

/**
 * Delete a post completely (hard delete) - Admin version
 * Removes post, all media, and all comments
 */
export async function adminDeletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Postarea nu a fost găsită' };
    }

    const data = docSnap.data();
    
    // Collect all media URLs
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
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
        if (pathMatch) {
          const decodedPath = decodeURIComponent(pathMatch[1]);
          const storageRef = ref(storage, decodedPath);
          await deleteObject(storageRef);
        }
      } catch (storageError) {
        console.warn('Could not delete media file:', url, storageError);
      }
    }

    // Delete all comments in the subcollection
    const commentsRef = collection(db, COLLECTIONS.PRODUCTS, postId, 'comments');
    const commentsSnapshot = await getDocs(commentsRef);
    
    for (const commentDoc of commentsSnapshot.docs) {
      await deleteDoc(commentDoc.ref);
    }

    // Delete the post document
    await deleteDoc(docRef);

    // Invalidate cache
    postsCache.clear();

    return { success: true };
  } catch (error) {
    console.error('Error deleting post (admin):', error);
    return { success: false, error: 'Eroare la ștergerea postării' };
  }
}

/**
 * Delete a comment - Admin version
 */
export async function adminDeleteComment(
  postId: string,
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const commentRef = doc(db, COLLECTIONS.PRODUCTS, postId, 'comments', commentId);
    await deleteDoc(commentRef);

    // Update comments count on post
    const postRef = doc(db, COLLECTIONS.PRODUCTS, postId);
    await updateDoc(postRef, {
      commentsCount: increment(-1),
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting comment (admin):', error);
    return { success: false, error: 'Eroare la ștergerea comentariului' };
  }
}

/**
 * Delete a user and optionally their posts and media
 */
export async function adminDeleteUser(
  userId: string,
  deleteUserPosts: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Optionally delete user's posts
    if (deleteUserPosts) {
      // Find all posts by this user
      const sellerQuery = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('sellerId', '==', userId)
      );
      const userIdQuery = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('userId', '==', userId)
      );

      const [sellerSnapshot, userIdSnapshot] = await Promise.all([
        getDocs(sellerQuery),
        getDocs(userIdQuery),
      ]);

      // Combine and deduplicate
      const postIds = new Set<string>();
      sellerSnapshot.docs.forEach((doc) => postIds.add(doc.id));
      userIdSnapshot.docs.forEach((doc) => postIds.add(doc.id));

      // Delete each post
      for (const postId of postIds) {
        await adminDeletePost(postId);
      }
    }

    // Delete the user document from Firestore
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await deleteDoc(userRef);

    return { success: true };
  } catch (error) {
    console.error('Error deleting user (admin):', error);
    return { success: false, error: 'Eroare la ștergerea utilizatorului' };
  }
}

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      return userDoc.data().role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
