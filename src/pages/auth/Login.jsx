import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/'

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(action) {
    setError('')
    setBusy(true)
    try {
      await action()
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const map = {
        'auth/invalid-credential': 'E-mail ou palavra-passe incorretos.',
        'auth/invalid-email': 'E-mail invalido.',
        'auth/email-already-in-use': 'Este e-mail ja esta registado.',
        'auth/weak-password': 'A palavra-passe deve ter pelo menos 6 caracteres.',
        'auth/popup-closed-by-user': 'Janela do Google fechada antes de concluir.',
      }
      setError(map[err.code] || err.message || 'Falha na autenticacao.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand brand--center">
          <img src="/nexus.svg" alt="" width="38" height="38" />
          <span>
            Nexus <strong>Dash &amp; Store</strong>
          </span>
        </Link>

        <div className="tabs">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => setMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => setMode('register')}
          >
            Criar conta
          </button>
        </div>

        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault()
            run(() =>
              mode === 'login'
                ? login(form.email, form.password)
                : register(form.name, form.email, form.password),
            )
          }}
        >
          {mode === 'register' && (
            <label className="field">
              Nome completo
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="O teu nome"
              />
            </label>
          )}

          <label className="field">
            E-mail
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="tu@email.com"
            />
          </label>

          <label className="field">
            Palavra-passe
            <input
              required
              type="password"
              minLength="6"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="••••••••"
            />
          </label>

          {error && <p className="alert alert--error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div className="divider">
          <span>ou</span>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-block"
          disabled={busy}
          onClick={() => run(loginWithGoogle)}
        >
          Continuar com Google
        </button>

        <p className="muted center">
          <Link to="/">← Voltar a loja</Link>
        </p>

        <p className="muted center small">
          Para aceder ao painel, o teu e-mail deve constar em <code>VITE_ADMIN_EMAILS</code>{' '}
          ou ter a claim <code>role=admin</code>. O 2FA aplica-se quando ativado no
          Firebase Authentication.
        </p>
      </div>
    </div>
  )
}