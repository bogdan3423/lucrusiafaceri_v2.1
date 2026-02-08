/**
 * Utility functions
 */

import { FirestoreTimestamp } from '@/types';

/**
 * Convert Firestore timestamp to Date
 */
export function timestampToDate(timestamp: unknown): Date | null {
  if (!timestamp) return null;
  
  // If it's already a Date
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Firestore Timestamp with toDate method
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  
  // String or number timestamp
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  // Firestore timestamp object with seconds
  const ts = timestamp as FirestoreTimestamp;
  if (typeof ts === 'object' && typeof ts.seconds === 'number') {
    return new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6);
  }
  
  return null;
}

/**
 * Get timestamp value for sorting
 */
export function getTimestampValue(timestamp: unknown): number {
  const date = timestampToDate(timestamp);
  return date ? date.getTime() : 0;
}

/**
 * Format date in Romanian locale
 */
export function formatDate(dateInput: Date | unknown): string {
  // Convert input to Date if needed
  let date: Date | null = null;
  
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (dateInput) {
    // Try to convert from Firestore timestamp or other format
    date = timestampToDate(dateInput);
  }
  
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'Acum';
  } else if (diffMin < 60) {
    return `${diffMin} min`;
  } else if (diffHour < 24) {
    return `${diffHour} ore`;
  } else if (diffDay < 7) {
    return `${diffDay} zile`;
  } else {
    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Format price with currency
 */
export function formatPrice(price?: number, currency?: string): string {
  if (price === undefined || price === null) return '';
  
  const curr = currency || 'RON';
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: curr === 'RON' ? 'RON' : curr === 'EUR' ? 'EUR' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Class names helper
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
