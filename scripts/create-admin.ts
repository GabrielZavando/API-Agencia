import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const createAdminUser = async () => {
  try {
    // 1. Inicializar Firebase Admin
    const serviceAccountPath = path.join(
      __dirname,
      '..',
      'config',
      'firebase-service-account.json',
    );

    if (fs.existsSync(serviceAccountPath)) {
      const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
      const parsedContent = JSON.parse(fileContent) as Record<string, string>;
      const serviceAccount = {
        projectId: parsedContent.project_id || parsedContent.projectId,
        clientEmail: parsedContent.client_email || parsedContent.clientEmail,
        privateKey: parsedContent.private_key || parsedContent.privateKey,
      };
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });
      console.log(
        'Firebase inicializado usando archivo config/firebase-service-account.json',
      );
    } else {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
        /\\n/g,
        '\n',
      );
      if (!privateKey) throw new Error('No FIREBASE_PRIVATE_KEY found in .env');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log('Firebase inicializado usando variables de .env');
    }

    // 2. Datos del Admin
    const email = process.argv[2] || 'admin@gabrielzavando.cl';
    // Puedes cambiar esta contraseña luego si el usuario se crea desde aquí
    const password = 'AdminPassword123!';
    const displayName = 'Super Admin';

    console.log(`Buscando/Creando usuario: ${email}...`);

    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(
        'El usuario ya existe en Firebase Auth, actualizando contraseña...',
      );
      userRecord = await admin.auth().updateUser(userRecord.uid, { password });
    } catch (err) {
      const authError = err as { code?: string };
      if (authError.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName,
        });
      } else {
        throw err;
      }
    }

    const uid = userRecord.uid;
    console.log(`UID del usuario: ${uid}`);

    // 3. Setear Custom Claims (Role Admin)
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log('✅ Custom claims asignados: { role: "admin" }');

    // 4. Guardar en Firestore db
    await admin.firestore().collection('users').doc(uid).set(
      {
        uid,
        email,
        displayName,
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    console.log('✅ Documento guardado en Firestore');
    console.log('\n=======================================');
    console.log('Credenciales de acceso:');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('=======================================\n');
  } catch (error) {
    console.error('❌ Error creando admin:', error);
  } finally {
    process.exit(0);
  }
};

createAdminUser().catch(console.error);
