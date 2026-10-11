import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { COLLECTIONS } from './constants'

/**
 * Dados de demonstracao para o catalogo.
 * Executado uma vez a partir do Painel Admin ("Carregar dados de exemplo").
 */
const DEMO_PRODUCTS = [
  {
    name: 'Revisao Completa',
    type: 'service',
    category: 'Servicos Automotivos',
    price: 249.9,
    stock: 999,
    description: 'Revisao de 20 pontos, troca de oleo e filtros.',
    imageUrl:
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=60',
  },
  {
    name: 'Alinhamento e Balanceamento',
    type: 'service',
    category: 'Servicos Automotivos',
    price: 129.0,
    stock: 999,
    description: 'Alinhamento de direcao e balanceamento das 4 rodas.',
    imageUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=60',
  },
  {
    name: 'Kit Pastilhas de Travao',
    type: 'product',
    category: 'Pecas',
    price: 189.5,
    stock: 24,
    description: 'Jogo de pastilhas dianteiras para veiculos de passeio.',
    imageUrl:
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=60',
  },
  {
    name: 'Bateria 60Ah',
    type: 'product',
    category: 'Pecas',
    price: 459.0,
    stock: 4,
    description: 'Bateria selada de 60Ah com 18 meses de garantia.',
    imageUrl:
      'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=800&q=60',
  },
  {
    name: 'Tapete Automotivo Premium',
    type: 'product',
    category: 'Acessorios',
    price: 89.9,
    stock: 40,
    description: 'Kit de 4 tapetes em borracha antiderrapante.',
    imageUrl:
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=60',
  },
  {
    name: 'Película Solar Nano',
    type: 'product',
    category: 'Acessorios',
    price: 320.0,
    stock: 12,
    description: 'Aplicacao de pelicula com protecao UV e controle termico.',
    imageUrl:
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=60',
  },
]

export async function seedDemoData() {
  const existing = await getDocs(collection(db, COLLECTIONS.products))
  if (!existing.empty) {
    throw new Error('O catalogo ja tem itens. Nada foi alterado.')
  }

  const batch = writeBatch(db)
  const now = new Date()
  DEMO_PRODUCTS.forEach((item, index) => {
    const ref = doc(collection(db, COLLECTIONS.products))
    batch.set(ref, {
      ...item,
      active: true,
      createdAt: now,
      updatedAt: now,
      sortOrder: index,
    })
  })

  const categories = [...new Set(DEMO_PRODUCTS.map((p) => p.category))]
  categories.forEach((name, index) => {
    const ref = doc(collection(db, COLLECTIONS.categories))
    batch.set(ref, { name, sortOrder: index, createdAt: now })
  })

  await batch.commit()
  return DEMO_PRODUCTS.length
}