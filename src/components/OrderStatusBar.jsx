import { ORDER_FLOW, ORDER_STATUS, ORDER_STATUS_LABEL } from '../lib/constants'

/**
 * Barra de progresso do pedido.
 * Muda sozinha quando o Admin altera o estado, porque o pedido chega por onSnapshot.
 */
export default function OrderStatusBar({ status }) {
  if (status === ORDER_STATUS.CANCELLED) {
    return (
      <div className="status-bar status-bar--cancelled">
        <span className="status-dot" /> {ORDER_STATUS_LABEL[ORDER_STATUS.CANCELLED]}
      </div>
    )
  }

  const currentIndex = Math.max(0, ORDER_FLOW.indexOf(status))

  return (
    <div className="status-bar">
      {ORDER_FLOW.map((step, index) => {
        const state =
          index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'todo'
        return (
          <div key={step} className={`status-step status-step--${state}`}>
            <span className="status-step__dot">{index < currentIndex ? '✓' : index + 1}</span>
            <span className="status-step__label">{ORDER_STATUS_LABEL[step]}</span>
          </div>
        )
      })}
    </div>
  )
}