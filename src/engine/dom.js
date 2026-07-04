/**
 * dom.js - minimal element helper so components build real DOM nodes
 * (not innerHTML strings). Keeps event wiring safe and avoids re-parsing.
 *
 *   el('button.btn', { onclick }, ['Label'])
 *   el('div', { class: 'card', style: { color: '#111' } }, [childNode])
 */

export function el(tag, props = {}, children = []) {
  // Support "div.class1.class2#id" shorthand.
  let tagName = 'div';
  const classes = [];
  let id = null;
  tag.replace(/([.#]?[^.#]+)/g, (m) => {
    if (m[0] === '.') classes.push(m.slice(1));
    else if (m[0] === '#') id = m.slice(1);
    else tagName = m;
  });

  const node = document.createElement(tagName);
  if (id) node.id = id;
  if (classes.length) node.classList.add(...classes);

  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') node.classList.add(...String(v).split(/\s+/).filter(Boolean));
    else if (k === 'style' && typeof v === 'object') {
      // Handle CSS custom properties (--foo) which Object.assign can't set.
      for (const [prop, val] of Object.entries(v)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, val);
        else node.style[prop] = val;
      }
    }
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k in node && k !== 'list') { try { node[k] = v; } catch { node.setAttribute(k, v); } }
    else node.setAttribute(k, v);
  }

  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** Convenience: clear and set a single child. */
export function mount(container, child) {
  container.replaceChildren(child);
  return child;
}
