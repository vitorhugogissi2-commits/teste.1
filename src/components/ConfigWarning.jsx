import { isFirebaseConfigured } from '../lib/firebase'

/** Aviso visivel quando o .env.local ainda nao foi configurado. */
export default function ConfigWarning() {
  if (isFirebaseConfigured) return null

  return (
    <div className="config-warning">
      <strong>Firebase nao configurado.</strong> Copia <code>.env.example</code> para{' '}
      <code>.env.local</code>, preenche as chaves do teu projeto e reinicia o servidor
      (<code>npm run dev</code>). Consulta o <code>README.md</code> para o passo a passo.
    </div>
  )
}