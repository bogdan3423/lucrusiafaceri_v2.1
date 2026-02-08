'use client';

/**
 * Debug Page - FULL RAW DATA INSPECTOR
 * This page shows the EXACT structure of Firebase documents
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase';

export default function DebugPage() {
  const [rawPosts, setRawPosts] = useState<Record<string, unknown>[]>([]);
  const [rawUsers, setRawUsers] = useState<Record<string, unknown>[]>([]);
  const [urlTests, setUrlTests] = useState<{original: string, resolved: string, status: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function inspectData() {
      console.log('========== STARTING FIREBASE INSPECTION ==========');
      
      try {
        // 1. FETCH RAW POSTS
        console.log('\n--- FETCHING POSTS FROM:', COLLECTIONS.PRODUCTS, '---');
        const postsSnapshot = await getDocs(query(collection(db, COLLECTIONS.PRODUCTS), limit(3)));
        
        const posts: Record<string, unknown>[] = [];
        postsSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('\n=== POST DOCUMENT ===');
          console.log('Document ID:', doc.id);
          console.log('ALL FIELDS:', Object.keys(data));
          
          // Log each field individually
          Object.entries(data).forEach(([key, value]) => {
            console.log(`  ${key}:`, typeof value, '=', JSON.stringify(value));
          });
          
          posts.push({ _docId: doc.id, ...data });
        });
        setRawPosts(posts);
        
        // 2. FETCH RAW USERS
        console.log('\n--- FETCHING USERS FROM:', COLLECTIONS.USERS, '---');
        const usersSnapshot = await getDocs(query(collection(db, COLLECTIONS.USERS), limit(3)));
        
        const users: Record<string, unknown>[] = [];
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('\n=== USER DOCUMENT ===');
          console.log('Document ID:', doc.id);
          console.log('ALL FIELDS:', Object.keys(data));
          
          Object.entries(data).forEach(([key, value]) => {
            console.log(`  ${key}:`, typeof value, '=', JSON.stringify(value));
          });
          
          users.push({ _docId: doc.id, ...data });
        });
        setRawUsers(users);
        
        // 3. TEST URL RESOLUTION
        console.log('\n--- TESTING URL RESOLUTION ---');
        const tests: {original: string, resolved: string, status: string}[] = [];
        
        // Find media URLs to test
        for (const post of posts) {
          // Check all possible media field names
          const mediaFields = ['images', 'videos', 'media', 'imageUrl', 'image', 'video', 'photoUrl', 'photo'];
          
          for (const field of mediaFields) {
            const value = post[field];
            if (value) {
              console.log(`\nFound media field "${field}":`, value);
              
              // Handle array
              if (Array.isArray(value)) {
                for (const item of value.slice(0, 2)) {
                  const url = typeof item === 'string' ? item : (item as {url?: string})?.url;
                  if (url) {
                    const result = await testUrl(url);
                    tests.push(result);
                  }
                }
              } 
              // Handle string
              else if (typeof value === 'string') {
                const result = await testUrl(value);
                tests.push(result);
              }
            }
          }
        }
        
        // Test user profile images
        for (const user of users) {
          const profileFields = ['profileImage', 'photoURL', 'avatar', 'avatarUrl', 'image', 'photo'];
          
          for (const field of profileFields) {
            const value = user[field];
            if (value && typeof value === 'string') {
              console.log(`\nFound profile field "${field}":`, value);
              const result = await testUrl(value);
              tests.push(result);
            }
          }
        }
        
        setUrlTests(tests);
        console.log('\n========== INSPECTION COMPLETE ==========');
        
      } catch (error) {
        console.error('Inspection error:', error);
      }
      
      setLoading(false);
    }
    
    async function testUrl(url: string): Promise<{original: string, resolved: string, status: string}> {
      console.log('Testing URL:', url);
      
      // Already a full URL
      if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log('  → Already full URL, testing fetch...');
        try {
          const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
          return { original: url, resolved: url, status: 'FULL_URL' };
        } catch (e) {
          return { original: url, resolved: url, status: 'FULL_URL_FETCH_FAILED' };
        }
      }
      
      // Try as Firebase Storage path
      console.log('  → Treating as storage path, calling getDownloadURL...');
      try {
        const storageRef = ref(storage, url);
        const downloadUrl = await getDownloadURL(storageRef);
        console.log('  → Resolved to:', downloadUrl);
        return { original: url, resolved: downloadUrl, status: 'STORAGE_PATH_RESOLVED' };
      } catch (e) {
        console.error('  → getDownloadURL failed:', e);
        return { original: url, resolved: '', status: 'STORAGE_PATH_FAILED: ' + String(e) };
      }
    }
    
    inspectData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-green-400 p-8 font-mono">
        <h1 className="text-2xl mb-4">🔍 Firebase Data Inspector</h1>
        <p>Loading... Check browser console (F12) for detailed logs!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 p-8 font-mono text-sm">
      <h1 className="text-2xl mb-4 text-white">🔍 Firebase Data Inspector</h1>
      <p className="text-yellow-400 mb-6">⚠️ Open browser console (F12) to see detailed field analysis!</p>
      
      {/* POSTS */}
      <section className="mb-8">
        <h2 className="text-xl text-white mb-2">📝 RAW POSTS ({rawPosts.length})</h2>
        {rawPosts.map((post, i) => (
          <div key={i} className="bg-gray-800 p-4 rounded mb-4 overflow-auto">
            <p className="text-cyan-400 mb-2">Document ID: {String(post._docId)}</p>
            <p className="text-gray-400 mb-2">Fields: {Object.keys(post).filter(k => k !== '_docId').join(', ')}</p>
            <pre className="text-xs whitespace-pre-wrap break-all">
              {JSON.stringify(post, null, 2)}
            </pre>
          </div>
        ))}
      </section>
      
      {/* USERS */}
      <section className="mb-8">
        <h2 className="text-xl text-white mb-2">👤 RAW USERS ({rawUsers.length})</h2>
        {rawUsers.map((user, i) => (
          <div key={i} className="bg-gray-800 p-4 rounded mb-4 overflow-auto">
            <p className="text-cyan-400 mb-2">Document ID: {String(user._docId)}</p>
            <p className="text-gray-400 mb-2">Fields: {Object.keys(user).filter(k => k !== '_docId').join(', ')}</p>
            <pre className="text-xs whitespace-pre-wrap break-all">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        ))}
      </section>
      
      {/* URL TESTS */}
      <section className="mb-8">
        <h2 className="text-xl text-white mb-2">🔗 URL RESOLUTION TESTS ({urlTests.length})</h2>
        {urlTests.map((test, i) => (
          <div key={i} className={`p-4 rounded mb-2 ${test.status.includes('FAILED') ? 'bg-red-900' : 'bg-green-900'}`}>
            <p><strong>Original:</strong> {test.original}</p>
            <p><strong>Resolved:</strong> {test.resolved || 'N/A'}</p>
            <p><strong>Status:</strong> {test.status}</p>
            {test.resolved && !test.status.includes('FAILED') && (
              <img 
                src={test.resolved} 
                alt="test" 
                className="mt-2 w-24 h-24 object-cover border border-green-400"
                onLoad={() => console.log('✅ Image loaded:', test.resolved)}
                onError={() => console.error('❌ Image failed to load:', test.resolved)}
              />
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
