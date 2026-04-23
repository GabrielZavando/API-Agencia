import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

async function deleteCollection(db: admin.firestore.Firestore, collectionPath: string, batchSize: number = 500) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db: admin.firestore.Firestore, query: admin.firestore.Query, resolve: any) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function run() {
  console.log('🚀 Iniciando limpieza de colecciones obsoletas...');
  
  const serviceAccountPath = path.join(process.cwd(), 'config', 'firebase-service-account.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ No se encontró el archivo de credenciales de Firebase.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  try {
    console.log('🗑️ Eliminando colección "prospects"...');
    await deleteCollection(db, 'prospects');
    console.log('✅ "prospects" eliminada.');

    console.log('🗑️ Eliminando colección "assessments"...');
    await deleteCollection(db, 'assessments');
    console.log('✅ "assessments" eliminada.');

    console.log('✨ Limpieza completada con éxito.');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    process.exit(0);
  }
}

run();
