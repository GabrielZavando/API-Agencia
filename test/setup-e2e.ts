import { beforeAll, beforeEach, afterAll } from 'vitest'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../src/app.module'

export let app: INestApplication

beforeAll(async () => {
  // Configurar variables de entorno para los emuladores
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
  process.env.FIREBASE_PROJECT_ID = 'demo-project'
  process.env.GCLOUD_PROJECT = 'demo-project'

  // Variables dummy para evitar fallos en constructores de servicios
  process.env.FIREBASE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDvD8zGfWp7zM7v
+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0
vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9v
D8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zG
fWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7
zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v
+zV0vD9vD8zGfWp7zM7v+zV0vD9vAgMBAAECggEBAO8PzMZ9anvMzu77NXS8P28P
zMZ9anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9
anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9anvM
zu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9anvMzu77
NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9anvMzu77NXS8
P28PzMZ9anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28B
gQDvD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9v
D8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zG
fWp7zM7v+zV0vD9vAYEA7w/Mxn1qe8zO7vs1dLw/bw/Mxn1qe8zO7vs1dLw/bw/M
xn1qe8zO7vs1dLw/bw/Mxn1qe8zO7vs1dLw/bw/Mxn1qe8zO7vs1dLw/bw/Mxn1q
e8zO7vs1dLw/bwGBAO8PzMZ9anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9
anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9anvMzu77NXS8P28PzMZ9anvM
zu77NXS8P28PzMZ9anvMzu77NXS8P28BgQDvD8zGfWp7zM7v+zV0vD9vD8zGfWp7
zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v+zV0vD9vD8zGfWp7zM7v
+zV0vD9vD8zGfWp7zM7v+zV0vD9vAYEA7w/Mxn1qe8zO7vs1dLw/bw/Mxn1qe8zO
7vs1dLw/bw/Mxn1qe8zO7vs1dLw/bw/Mxn1qe8zO7vs1dLw/bw/Mxn1qe8zO7vs1
dLw/bw/Mxn1qe8zO7vs1dLw/bw==
-----END PRIVATE KEY-----`.replace(/\n/g, '\\n')
  process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com'
  process.env.OPENAI_API_KEY = 'sk-dummy-key-for-e2e'
  process.env.RESEND_API_KEY = 're_dummy_key'

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  app = moduleFixture.createNestApplication()
  await app.init()
})

beforeEach(async () => {
  // Limpiar Firestore antes de cada test
  // Usamos fetch porque el SDK de firebase-admin no tiene una forma sencilla de limpiar todo el emulador
  try {
    const response = await fetch(
      'http://localhost:8080/emulator/v1/projects/demo-project/databases/(default)/documents',
      { method: 'DELETE' },
    )
    if (!response.ok) {
      console.warn('Failed to clear Firestore emulator data')
    }
  } catch (error) {
    console.error('Error clearing Firestore emulator:', error)
  }
})

afterAll(async () => {
  if (app) {
    await app.close()
  }
})
