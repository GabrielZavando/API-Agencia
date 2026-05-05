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
  process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCr\n-----END PRIVATE KEY-----\n'
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
