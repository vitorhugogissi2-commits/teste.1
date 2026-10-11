export default function EmptyState({ icon = '🗂️', title, description, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      {description && <p className="muted">{description}</p>}
      {children}
    </div>
  )
}