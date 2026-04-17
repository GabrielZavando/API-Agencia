import * as admin from 'firebase-admin';

// Initialize firebase
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function checkPosts() {
  const posts = await db.collection('posts').get();
  for (const doc of posts.docs) {
    const data = doc.data();
    console.log(`Post: ${data.title}`);
    console.log(`  excerpt: ${data.excerpt ? 'Yes' : 'No'}`);
    console.log(`  content: ${data.content ? 'Yes' : 'No'}`);
  }
}

checkPosts().catch(console.error);
