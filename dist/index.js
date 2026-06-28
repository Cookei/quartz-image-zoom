import { createRequire } from 'module';

createRequire(import.meta.url);

// node_modules/unist-util-is/lib/index.js
var convert = (
  // Note: overloads in JSDoc can’t yet use different `@template`s.
  /**
   * @type {(
   *   (<Condition extends string>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & {type: Condition}) &
   *   (<Condition extends Props>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Condition) &
   *   (<Condition extends TestFunction>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Predicate<Condition, Node>) &
   *   ((test?: null | undefined) => (node?: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node) &
   *   ((test?: Test) => Check)
   * )}
   */
  /**
   * @param {Test} [test]
   * @returns {Check}
   */
  (function(test) {
    if (test === null || test === void 0) {
      return ok;
    }
    if (typeof test === "function") {
      return castFactory(test);
    }
    if (typeof test === "object") {
      return Array.isArray(test) ? anyFactory(test) : (
        // Cast because `ReadonlyArray` goes into the above but `isArray`
        // narrows to `Array`.
        propertiesFactory(
          /** @type {Props} */
          test
        )
      );
    }
    if (typeof test === "string") {
      return typeFactory(test);
    }
    throw new Error("Expected function, string, or object as test");
  })
);
function anyFactory(tests) {
  const checks = [];
  let index = -1;
  while (++index < tests.length) {
    checks[index] = convert(tests[index]);
  }
  return castFactory(any);
  function any(...parameters) {
    let index2 = -1;
    while (++index2 < checks.length) {
      if (checks[index2].apply(this, parameters)) return true;
    }
    return false;
  }
}
function propertiesFactory(check) {
  const checkAsRecord = (
    /** @type {Record<string, unknown>} */
    check
  );
  return castFactory(all);
  function all(node) {
    const nodeAsRecord = (
      /** @type {Record<string, unknown>} */
      /** @type {unknown} */
      node
    );
    let key;
    for (key in check) {
      if (nodeAsRecord[key] !== checkAsRecord[key]) return false;
    }
    return true;
  }
}
function typeFactory(check) {
  return castFactory(type);
  function type(node) {
    return node && node.type === check;
  }
}
function castFactory(testFunction) {
  return check;
  function check(value, index, parent) {
    return Boolean(
      looksLikeANode(value) && testFunction.call(
        this,
        value,
        typeof index === "number" ? index : void 0,
        parent || void 0
      )
    );
  }
}
function ok() {
  return true;
}
function looksLikeANode(value) {
  return value !== null && typeof value === "object" && "type" in value;
}

// node_modules/unist-util-visit-parents/lib/color.node.js
function color(d) {
  return "\x1B[33m" + d + "\x1B[39m";
}

// node_modules/unist-util-visit-parents/lib/index.js
var empty = [];
var CONTINUE = true;
var EXIT = false;
var SKIP = "skip";
function visitParents(tree, test, visitor, reverse) {
  let check;
  if (typeof test === "function" && typeof visitor !== "function") {
    reverse = visitor;
    visitor = test;
  } else {
    check = test;
  }
  const is2 = convert(check);
  const step = reverse ? -1 : 1;
  factory(tree, void 0, [])();
  function factory(node, index, parents) {
    const value = (
      /** @type {Record<string, unknown>} */
      node && typeof node === "object" ? node : {}
    );
    if (typeof value.type === "string") {
      const name = (
        // `hast`
        typeof value.tagName === "string" ? value.tagName : (
          // `xast`
          typeof value.name === "string" ? value.name : void 0
        )
      );
      Object.defineProperty(visit2, "name", {
        value: "node (" + color(node.type + (name ? "<" + name + ">" : "")) + ")"
      });
    }
    return visit2;
    function visit2() {
      let result = empty;
      let subresult;
      let offset;
      let grandparents;
      if (!test || is2(node, index, parents[parents.length - 1] || void 0)) {
        result = toResult(visitor(node, parents));
        if (result[0] === EXIT) {
          return result;
        }
      }
      if ("children" in node && node.children) {
        const nodeAsParent = (
          /** @type {UnistParent} */
          node
        );
        if (nodeAsParent.children && result[0] !== SKIP) {
          offset = (reverse ? nodeAsParent.children.length : -1) + step;
          grandparents = parents.concat(nodeAsParent);
          while (offset > -1 && offset < nodeAsParent.children.length) {
            const child = nodeAsParent.children[offset];
            subresult = factory(child, offset, grandparents)();
            if (subresult[0] === EXIT) {
              return subresult;
            }
            offset = typeof subresult[1] === "number" ? subresult[1] : offset + step;
          }
        }
      }
      return result;
    }
  }
}
function toResult(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "number") {
    return [CONTINUE, value];
  }
  return value === null || value === void 0 ? empty : [value];
}

// node_modules/unist-util-visit/lib/index.js
function visit(tree, testOrVisitor, visitorOrReverse, maybeReverse) {
  let reverse;
  let test;
  let visitor;
  {
    test = testOrVisitor;
    visitor = visitorOrReverse;
    reverse = maybeReverse;
  }
  visitParents(tree, test, overload, reverse);
  function overload(node, parents) {
    const parent = parents[parents.length - 1];
    const index = parent ? parent.children.indexOf(node) : void 0;
    return visitor(node, index, parent);
  }
}

// src/transformer.ts
var rehypeLightbox = () => {
  return () => (tree, _file) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName === "img" && node.properties?.["data-lightbox-ignore"]) return;
      if (node.tagName === "img" && parent && index !== void 0) {
        const originalSrc = node.properties?.src;
        const originalAlt = node.properties?.alt || "";
        if (!originalSrc) return;
        const existing = node.properties?.className;
        const classes = Array.isArray(existing) ? existing.filter((v) => typeof v === "string") : typeof existing === "string" ? [existing] : [];
        node.properties = {
          ...node.properties,
          className: [...classes, "lightbox-image"],
          "data-src": originalSrc,
          "data-alt": originalAlt
        };
        const wrapper = {
          type: "element",
          tagName: "div",
          properties: {
            className: ["lightbox-wrapper"],
            "data-lightbox": "true"
          },
          children: [node]
        };
        parent.children[index] = wrapper;
      }
    });
  };
};
var ClickableImages = () => {
  return {
    name: "ClickableImages",
    htmlPlugins() {
      return [rehypeLightbox()];
    },
    externalResources() {
      return {
        css: [
          {
            inline: true,
            content: `
.lightbox-wrapper {
  display: inline-block;
  cursor: zoom-in;
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.lightbox-wrapper:hover {
  transform: scale(1.01);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.lightbox-image { max-width: 100%; height: auto; display: block; }
.lightbox-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  backdrop-filter: blur(4px);
}
.lightbox-modal.active { opacity: 1; visibility: visible; }
.lightbox-modal img {
  max-width: 92vw;
  max-height: 92vh;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  transition: transform 0.2s ease;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: auto;
}
.lightbox-close {
  position: absolute;
  top: 20px; right: 24px;
  font-size: 2rem;
  color: white;
  cursor: pointer;
  background: rgba(0,0,0,0.5);
  border: none;
  border-radius: 50%;
  width: 40px; height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox-close:hover { background: rgba(0,0,0,0.8); }
body.lightbox-open { overflow: hidden; }
            `
          }
        ],
        js: [
          {
            loadTime: "afterDOMReady",
            contentType: "inline",
            script: `
function initLightbox() {
  const existing = document.querySelector('.lightbox-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'lightbox-modal';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.innerHTML = '\xD7';
  closeBtn.setAttribute('aria-label', 'Close');

  const img = document.createElement('img');
  img.style.display = 'none';

  modal.appendChild(closeBtn);
  modal.appendChild(img);
  document.body.appendChild(modal);

  function open(src, alt) {
    img.src = src;
    img.alt = alt || '';
    img.style.display = 'block';
    img.style.transform = 'scale(1)';
    img.style.cursor = 'grab';
    translateX = 0;
    translateY = 0;
    scale = 1;
    modal.classList.add('active');
    document.body.classList.add('lightbox-open');
  }

  function close() {
    modal.classList.remove('active');
    document.body.classList.remove('lightbox-open');
    setTimeout(() => { img.style.display = 'none'; img.src = ''; }, 200);
  }

  // zoom & pan state
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;

  function applyTransform() {
    img.style.transform = 'scale(' + scale + ') translate(' + translateX / scale + 'px, ' + translateY / scale + 'px)';
  }

  // zoom by wheel
  img.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    scale = Math.min(Math.max(scale + delta, 0.5), 5);
    applyTransform();
  }, { passive: false });

  // pan by drag
  img.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOriginX = translateX;
    dragOriginY = translateY;
    img.style.cursor = 'grabbing';
    img.style.transition = 'none';
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = dragOriginX + (e.clientX - dragStartX);
    translateY = dragOriginY + (e.clientY - dragStartY);
    applyTransform();
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    img.style.cursor = scale > 1 ? 'grab' : 'default';
    img.style.transition = 'transform 0.2s ease';
  });

  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) close();
  });

  document.querySelectorAll('.lightbox-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', () => {
      const i = wrapper.querySelector('.lightbox-image');
      if (i) open(i.src, i.getAttribute('data-alt') || i.alt);
    });
  });

  if (window.addCleanup) {
    window.addCleanup(() => {
      modal.remove();
      document.body.classList.remove('lightbox-open');
    });
  }
}

document.addEventListener('nav', initLightbox);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLightbox);
} else {
  initLightbox();
}
            `
          }
        ],
        additionalHead: []
      };
    }
  };
};

export { ClickableImages };
