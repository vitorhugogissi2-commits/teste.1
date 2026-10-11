/**
 * Atribui a custom claim role=admin a um utilizador do Firebase Auth.
 *
 * Uso:
 *   1) Gera uma service account: Firebase Console > Configuracoes do projeto
 *      > Contas de servico > Gerar nova chave privada.
 *   2) Guarda o ficheiro como serviceAccount.json na raiz do projeto (.gitignore ignora-o).
 *   3) npm i firebase-admin --no-save
 *      node scripts/setAdmin.mjs admin@nexusdash.com
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import admin from 'firebase-admin'

const email = process.argv[2]
if (!email) {
  console.error('Uso: node scripts/setAdmin.mjs <email>')
  process.exit(1)
}

const serviceAccount = JSON.parse(
  readFileSync(resolve(process.cwd(), 'serviceAccount.json'), 'utf8'),
)

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const user = await admin.auth().getUserByEmail(email)
await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' })
console.log(`OK: ${email} agora tem role=admin. Faz logout/login para atualizar o token.`)
process.exit(0)