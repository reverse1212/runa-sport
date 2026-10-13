'use client'
import { useFormState, useFormStatus } from 'react-dom'

function Submit({ children }) {
  const { pending } = useFormStatus()
  return <button className="abtn" disabled={pending}>{pending ? 'Guardando…' : children}</button>
}

export function ActionForm({ action, submit, className, confirmMsg, children }) {
  const [state, run] = useFormState(action, {})
  return (
    <form action={run} className={className} onSubmit={confirmMsg ? (e) => { if (!window.confirm(confirmMsg)) e.preventDefault() } : undefined}>
      {children}
      {state?.error && <p className="aerr" role="alert">{state.error}</p>}
      {state?.ok && <p className="aok">{state.ok}</p>}
      {submit && <Submit>{submit}</Submit>}
    </form>
  )
}

// `second`: mensaje de una segunda confirmación para acciones críticas.
export function ConfirmForm({ action, message, second, className, children }) {
  return <form action={action} className={className} onSubmit={(e) => { if (!window.confirm(message) || (second && !window.confirm(second))) e.preventDefault() }}>{children}</form>
}
