import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

/**
 * Chaves lidas do .env.local (ver .env.example).
 * O prefixo VITE_ e obrigatorio para o Vite expor a variavel ao browser.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Verdadeiro quando o .env.local foi preenchido. Permite mostrar um aviso amigavel. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
)

export const app = initializeApp(firebaseConfig)

/** Firestore com cache local: funciona offline e re-sincroniza sozinho. */
function createDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    return getFirestore(app)
  }
}

export const db = createDb()
export const auth = getAuth(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

/** Lista de e-mails com privilegio de administrador (definida no .env). */
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)