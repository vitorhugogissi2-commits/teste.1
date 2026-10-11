export default function Spinner({ label = 'A carregar...' }) {
  return (
    <div className="spinner-wrap">
      <span className="spinner" aria-hidden="true" />
      <span className="muted">{label}</span>
    </div>
  )
}