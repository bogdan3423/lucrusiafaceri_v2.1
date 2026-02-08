// Quick Firebase data inspection script
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDmm0H8mpcvzt0u6uUgDit9uX0OUhZ614c",
  authDomain: "lucru-si-afaceri.firebaseapp.com",
  projectId: "lucru-si-afaceri",
  storageBucket: "lucru-si-afaceri.firebasestorage.app",
  messagingSenderId: "334361645095",
  appId: "1:334361645095:web:9305f356793cdf9fa1be02"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspect() {
  console.log('=== INSPECTING FIREBASE DATA ===\n');
  
  // Get posts
  console.log('--- POSTS (products collection) ---');
  const postsSnapshot = await getDocs(query(collection(db, 'products'), limit(2)));
  postsSnapshot.forEach(doc => {
    console.log('\nDocument ID:', doc.id);
    const data = doc.data();
    Object.entries(data).forEach(([key, value]) => {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    });
  });
  
  // Get users
  console.log('\n--- USERS ---');
  const usersSnapshot = await getDocs(query(collection(db, 'users'), limit(2)));
  usersSnapshot.forEach(doc => {
    console.log('\nDocument ID:', doc.id);
    const data = doc.data();
    Object.entries(data).forEach(([key, value]) => {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    });
  });
  
  process.exit(0);
}

inspect().catch(console.error);
