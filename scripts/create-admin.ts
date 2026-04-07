import * as admin from 'firebase-admin'
import * as path from 'path'
import * as fs from 'fs'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

// ============================================================
// USO:
//   pnpm ts-node scripts/create-admin.ts <email> <password> [displayName]
//
// EJEMPLOS:
//   pnpm ts-node scripts/create-admin.ts admin@gabrielzavando.cl MiClave123! "Gabriel Zavando"
//   pnpm ts-node scripts/create-admin.ts otra@cuenta.com OtraClave456#
// ============================================================

const validatePassword = (password: string): void => {
  const errors: string[] = []
  if (password.length < 8) errors.push('mínimo 8 caracteres')
  if (!/[A-Z]/.test(password)) errors.push('al menos una mayúscula')
  if (!/[a-z]/.test(password)) errors.push('al menos una minúscula')
  if (!/[0-9]/.test(password)) errors.push('al menos un número')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    errors.push('al menos un carácter especial (!@#$...)')

  if (errors.length > 0) {
    console.error('❌ La contraseña no cumple los requisitos:')
    errors.forEach((e) => console.error(`   • ${e}`))
    process.exit(1)
  }
}

const initializeFirebase = (): void => {
  const serviceAccountPath = path.join(
    process.cwd(),
    'config',
    'firebase-service-account.json',
  )

  if (fs.existsSync(serviceAccountPath)) {
    const fileContent = fs.readFileSync(serviceAccountPath, 'utf8')
    const parsed = JSON.parse(fileContent) as Record<string, string>
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: parsed.project_id || parsed.projectId,
        clientEmail: parsed.client_email || parsed.clientEmail,
        privateKey: parsed.private_key || parsed.privateKey,
      }),
    })
    console.log(
      '🔑 Firebase inicializado con config/firebase-service-account.json',
    )
  } else {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    if (!privateKey) {
      console.error('❌ No se encontró FIREBASE_PRIVATE_KEY en el archivo .env')
      process.exit(1)
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })
    console.log('🔑 Firebase inicializado con variables de entorno (.env)')
  }
}

const createAdminUser = async (): Promise<void> => {
  // ── Validar argumentos ───────────────────────────────────
  const [, , email, password, displayName] = process.argv

  if (!email || !password) {
    console.error('\n❌ Uso incorrecto.')
    console.error(
      '   pnpm ts-node scripts/create-admin.ts <email> <password> [displayName]\n',
    )
    console.error('   Ejemplo:')
    console.error(
      '   pnpm ts-node scripts/create-admin.ts admin@gabrielzavando.cl MiClave123! "Gabriel Zavando"\n',
    )
    process.exit(1)
  }

  validatePassword(password)

  const name = displayName || 'Super Admin'

  // ── Inicializar Firebase ─────────────────────────────────
  initializeFirebase()

  try {
    console.log(`\n👤 Procesando usuario: ${email}`)

    // 1. Crear o actualizar en Firebase Auth
    let userRecord: admin.auth.UserRecord
    try {
      userRecord = await admin.auth().getUserByEmail(email)
      console.log(
        '   ⚠️  El usuario ya existe en Auth. Actualizando contraseña y nombre...',
      )
      userRecord = await admin.auth().updateUser(userRecord.uid, {
        password,
        displayName: name,
      })
    } catch (err) {
      const authError = err as { code?: string }
      if (authError.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        })
        console.log('   ✅ Usuario creado en Firebase Auth')
      } else {
        throw err
      }
    }

    const uid = userRecord.uid

    // 2. Asignar Custom Claim { role: 'admin' }
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' })
    console.log('   ✅ Custom claim asignado: { role: "admin" }')

    // 3. Guardar/actualizar documento en Firestore
    const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b0464&color=fff`
    // Admin: 30 GB de almacenamiento
    const ADMIN_STORAGE_LIMIT_BYTES = 30 * 1024 * 1024 * 1024

    await admin.firestore().collection('users').doc(uid).set(
      {
        uid,
        email,
        displayName: name,
        photoURL,
        role: 'admin',
        storageLimitBytes: ADMIN_STORAGE_LIMIT_BYTES,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    console.log('   ✅ Documento guardado en Firestore')
    console.log(`   📋 Datos guardados:`)
    console.log(`      uid:               ${uid}`)
    console.log(`      email:             ${email}`)
    console.log(`      displayName:       ${name}`)
    console.log(`      role:              admin`)
    console.log(`      storageLimitBytes: ${ADMIN_STORAGE_LIMIT_BYTES} (30 GB)`)
    console.log(`      photoURL:          ${photoURL}`)

    console.log('\n======================================')
    console.log('✅ Administrador creado exitosamente')
    console.log('======================================')
    console.log(`   Email:    ${email}`)
    console.log(`   Password: ${password}`)
    console.log('======================================')
    console.log('⚠️  Cambia esta contraseña al primer inicio de sesión.\n')
  } catch (error) {
    console.error('\n❌ Error durante la creación del admin:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

createAdminUser().catch((err) => {
  console.error('❌ Error inesperado:', err)
  process.exit(1)
})
