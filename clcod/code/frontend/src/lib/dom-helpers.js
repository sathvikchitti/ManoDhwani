/**
 * Ref callback for controls that start out `disabled` in the original markup and are enabled later by page code
 * (`btn.disabled = false`). Passing `disabled` as a React prop would make React keep ignoring clicks on the
 * element even after the DOM enables it, so the initial state is applied directly to the DOM instead.
 */
export function initiallyDisabled(el) {
  if (el) el.disabled = true;
}
