/**
 * TypeScript Models for Lucru si Afaceri
 */

// Media types
export type MediaType = 'image' | 'video';

export interface MediaItem {
  url: string;
  type: MediaType;
  thumbnailUrl?: string;
}

// Category definitions
export type CategoryKey = 'construction' | 'auto' | 'imobiliare' | 'bazar' | 'jobs' | 'dating';

export interface Category {
  key: CategoryKey;
  label: string;
  icon: string;
}

// User model
export interface User {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  city?: string;
  profileImage?: string;
  coverImage?: string;
  bio?: string;
  role?: 'user' | 'admin';
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Post model - matches existing Firestore 'products' collection
export interface Post {
  id: string;
  title: string;
  description: string;
  price?: number;
  currency?: string;
  location?: string;
  category?: CategoryKey;
  images?: string[];
  videos?: string[];
  media?: MediaItem[];
  userId?: string;
  sellerId?: string; // Legacy field
  userEmail?: string;
  userName?: string;
  userImage?: string;
  status: 'active' | 'inactive' | 'sold' | 'deleted';
  views?: number;
  saves?: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Firestore timestamp handling
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

// Auth state
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Pagination state
export interface PaginationState {
  hasMore: boolean;
  isLoading: boolean;
  lastDoc: unknown | null;
}

// Create post form data
export interface CreatePostData {
  title: string;
  description: string;
  price?: number;
  currency?: string;
  location?: string;
  category?: CategoryKey;
}

// Categories configuration
export const CATEGORIES: Category[] = [
  { key: 'construction', label: 'Construcții', icon: 'Hammer' },
  { key: 'auto', label: 'Auto', icon: 'Car' },
  { key: 'imobiliare', label: 'Imobiliare', icon: 'Home' },
  { key: 'bazar', label: 'Bazar', icon: 'ShoppingBag' },
  { key: 'jobs', label: 'Locuri de Muncă', icon: 'Briefcase' },
  { key: 'dating', label: 'Întâlniri', icon: 'Heart' },
];

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  construction: 'Construcții',
  auto: 'Auto',
  imobiliare: 'Imobiliare',
  bazar: 'Bazar',
  jobs: 'Locuri de Muncă',
  dating: 'Întâlniri',
};
