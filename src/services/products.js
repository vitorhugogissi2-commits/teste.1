import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { COLLECTIONS } from '../lib/constants'

function sanitize(payload) {
  return {
    name: payload.name?.trim() || '',
    type: payload.type || 'product',
    category: payload.category?.trim() || 'Geral',
    price: Number(payload.price) || 0,
    stock: payload.type === 'service' ? 999 : Number(payload.stock) || 0,
    description: payload.description?.trim() || '',
    imageUrl: payload.imageUrl?.trim() || '',
    active: payload.active !== false,
  }
}

export async function createProduct(payload) {
  const ref2 = await addDoc(collection(db, COLLECTIONS.products), {
    ...sanitize(payload),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref2.id
}

export async function updateProduct(id, payload) {
  await updateDoc(doc(db, COLLECTIONS.products, id), {
    ...sanitize(payload),
    updatedAt: serverTimestamp(),
  })
}

export async function removeProduct(id) {
  await deleteDoc(doc(db, COLLECTIONS.products, id))
}

/**
 * Faz upload da imagem para o Firebase Storage e devolve o URL publico.
 * onProgress recebe um numero 0..100.
 */
export function uploadProductImage(file, onProgress) {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storageRef = ref(storage, `products/${safeName}`)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
        }
      },
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref)),
    )
  })
}

export async function deleteProductImage(imageUrl) {
  if (!imageUrl || !imageUrl.includes('/o/')) return
  try {
    const path = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0])
    await deleteObject(ref(storage, path))
  } catch (error) {
    console.warn('Nao foi possivel remover a imagem:', error)
  }
}