import { memo, useCallback } from 'react';

/**
 * An <input> that React renders once but does not manage afterwards.
 *
 * React re-applies an input's `type`/`name` props on every keystroke, which would undo page code that changes
 * them imperatively (login's show/hide-password toggle sets `input.type = 'text'`). This creates the element
 * with plain DOM calls inside a `display: contents` wrapper, so layout and CSS are exactly as before.
 *
 * @param {Object<string,string>} attrs  HTML attributes, as written in the original markup
 */
function UnmanagedInput({ attrs }) {
  const mount = useCallback(
    (holder) => {
      if (!holder || holder.firstChild) return;
      const input = document.createElement('input');
      for (const [name, value] of Object.entries(attrs)) input.setAttribute(name, value);
      holder.appendChild(input);
    },
    [], // attrs never change for a given page visit
  );
  return <span ref={mount} style={{ display: 'contents' }} />;
}

export default memo(UnmanagedInput);
