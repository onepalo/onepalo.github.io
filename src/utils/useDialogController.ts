import { useEffect, useEffectEvent, useRef } from 'react'

export function useDialogController<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const initialFocusRef = useRef<T>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const closeDialog = useEffectEvent(onClose)

  useEffect(() => {
    if (!isOpen) return

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    initialFocusRef.current?.focus()

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        closeDialog()
        return
      }

      if (event.key !== 'Tab') return
      const dialog = initialFocusRef.current?.closest<HTMLElement>('[role="dialog"]')
      const focusableElements = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!focusableElements?.length) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleDialogKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleDialogKeyDown, { capture: true })
      returnFocusRef.current?.focus()
      returnFocusRef.current = null
    }
  }, [isOpen])

  return initialFocusRef
}