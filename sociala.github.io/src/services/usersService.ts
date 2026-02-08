'use client';

/**
 * Users Service
 * Handles user profile operations with Firestore
 */

import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  collection,
  serverTimestamp,
  documentId,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, COLLECTIONS } from '@/lib/firebase';
import { User } from '@/types';
import { timestampToDate } from '@/lib/utils';

// Cache for user profiles
const userCache = new Map<string, { data: User; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Convert Firestore document to User object
 */
function docToUser(docId: string, data: Record<string, unknown>): User {
  return {
    id: docId,
    uid: (data.uid as string) || docId,
    email: (data.email as string) || '',
    fullName: (data.fullName as string) || '',
    phone: (data.phone as string) || '',
    city: (data.city as string) || '',
    profileImage: (data.profileImage as string) || '',
    coverImage: (data.coverImage as string) || '',
    bio: (data.bio as string) || '',
    role: (data.role as 'user' | 'admin') || 'user',
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  if (!userId) return null;

  // Check cache first
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docToUser(docSnap.id, docSnap.data() as Record<string, unknown>);
      
      // Cache the result
      userCache.set(userId, {
        data: userData,
        timestamp: Date.now(),
      });
      
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get multiple user profiles
 */
export async function getUserProfiles(userIds: string[]): Promise<Record<string, User>> {
  if (!userIds || userIds.length === 0) return {};

  const result: Record<string, User> = {};
  const uncachedIds: string[] = [];

  // Check cache first
  for (const id of userIds) {
    const cached = userCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      result[id] = cached.data;
    } else {
      uncachedIds.push(id);
    }
  }

  // Fetch uncached users in batches of 10
  if (uncachedIds.length > 0) {
    const batches: string[][] = [];
    for (let i = 0; i < uncachedIds.length; i += 10) {
      batches.push(uncachedIds.slice(i, i + 10));
    }

    for (const batch of batches) {
      try {
        const usersQuery = query(
          collection(db, COLLECTIONS.USERS),
          where(documentId(), 'in', batch)
        );
        const snapshot = await getDocs(usersQuery);

        snapshot.forEach((docSnap) => {
          const userData = docToUser(docSnap.id, docSnap.data() as Record<string, unknown>);
          result[docSnap.id] = userData;
          userCache.set(docSnap.id, {
            data: userData,
            timestamp: Date.now(),
          });
        });
      } catch (error) {
        console.error('Error fetching user batch:', error);
      }
    }
  }

  return result;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Invalidate cache
    userCache.delete(userId);

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Eroare la actualizarea profilului' };
  }
}

/**
 * Upload profile image
 */
export async function uploadProfileImage(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const fileName = `profiles/${userId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, fileName);

  // Upload file
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);

  // Update user profile
  await updateUserProfile(userId, { profileImage: downloadUrl });

  if (onProgress) onProgress(100);

  return downloadUrl;
}

/**
 * Upload cover image
 */
export async function uploadCoverImage(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const fileName = `covers/${userId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, fileName);

  // Upload file
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);

  // Update user profile
  await updateUserProfile(userId, { coverImage: downloadUrl });

  if (onProgress) onProgress(100);

  return downloadUrl;
}

/**
 * Clear user cache
 */
export function clearUserCache(userId?: string): void {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}
