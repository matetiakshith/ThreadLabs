import { useEffect, useRef } from 'react';

/** Shared focus and dismissal behavior for the existing review/profile dialogs. */
export default function DialogFrame({ label, onClose, children, className = '' }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(ref.current?.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || []);
    (focusable()[0] || ref.current)?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0], last = elements.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('keydown', keyboard); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={`dialog-backdrop ${className}`} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>{children}</div>;
}
