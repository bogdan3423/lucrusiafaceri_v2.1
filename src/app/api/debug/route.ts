import { NextResponse } from 'next/server';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase';

export async function GET() {
  try {
    const result: { posts: Record<string, unknown>[]; users: Record<string, unknown>[] } = {
      posts: [],
      users: []
    };

    // Get posts
    const postsSnapshot = await getDocs(query(collection(db, COLLECTIONS.PRODUCTS), limit(3)));
    postsSnapshot.forEach(doc => {
      result.posts.push({ _id: doc.id, ...doc.data() });
    });

    // Get users
    const usersSnapshot = await getDocs(query(collection(db, COLLECTIONS.USERS), limit(3)));
    usersSnapshot.forEach(doc => {
      result.users.push({ _id: doc.id, ...doc.data() });
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
