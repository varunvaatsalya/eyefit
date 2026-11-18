// Keyboard-first forms: Enter moves to the next field instead of submitting.
//
// Usage: put onKeyDown={handleEnterNav} on a form/container.
//  - Fields with data-enter-skip are skipped (still reachable with Tab).
//  - When there is no next field, focus goes to [data-enter-final] (e.g. the Save button),
//    so one more Enter saves. Without a final target, the native behaviour (submit) happens.
//  - Components that handle Enter themselves (search pickers, suggestion lists) call
//    e.preventDefault(), and this helper leaves them alone.

const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"])',
  "select",
  "textarea",
]
  .map((s) => `${s}:not([disabled]):not([readonly]):not([data-enter-skip]):not([tabindex="-1"]):not([aria-hidden="true"])`)
  .join(",");

const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

export function focusNext(from, container = from?.closest("[data-enter-nav], form")) {
  if (!from || !container) return false;
  const fields = [...container.querySelectorAll(FIELD_SELECTOR)].filter(visible);
  // first field that comes after `from` in the DOM (works even if `from` itself is skipped)
  const next = fields.find((f) => f !== from && from.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING);
  if (next) {
    next.focus();
    if (typeof next.select === "function" && next.tagName === "INPUT" && next.type !== "date") next.select();
    return true;
  }
  const final = [...container.querySelectorAll("[data-enter-final]:not([disabled])")].find(visible);
  if (final) {
    final.focus();
    return true;
  }
  return false;
}

export function handleEnterNav(e) {
  if (e.key !== "Enter" || e.defaultPrevented || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.nativeEvent?.isComposing) return;
  const t = e.target;
  if (!(t instanceof HTMLElement) || !t.matches(FIELD_SELECTOR.replaceAll(":not([data-enter-skip])", ""))) return;
  if (t.tagName === "TEXTAREA") return; // Enter = new line
  if (focusNext(t, e.currentTarget)) e.preventDefault();
}
