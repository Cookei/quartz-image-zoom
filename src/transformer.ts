import type { PluggableList } from "unified";
import type { Root as HastRoot, Element, ElementContent } from "hast";
import type { VFile } from "vfile";
import { visit } from "unist-util-visit";
import type { QuartzTransformerPlugin } from "@quartz-community/types";

const rehypeLightbox = (): any => {
  return () => (tree: HastRoot, _file: VFile) => {
    visit(tree, "element", (node: Element, index, parent: any) => {
      if (node.tagName === "img" && node.properties?.dataLightboxIgnore) return;
      if (node.tagName === "img" && parent && index !== undefined) {
        const originalSrc = node.properties?.src;
        const originalAlt = node.properties?.alt || "";

        if (!originalSrc) return;

        const existing = node.properties?.className;
        const classes: string[] = Array.isArray(existing)
          ? existing.filter((v): v is string => typeof v === "string")
          : typeof existing === "string"
            ? [existing]
            : [];

        node.properties = {
          ...node.properties,
          className: [...classes, "lightbox-image"],
          "data-src": originalSrc,
          "data-alt": originalAlt,
        };

        const wrapper: ElementContent = {
          type: "element",
          tagName: "div",
          properties: {
            className: ["lightbox-wrapper"],
            "data-lightbox": "true",
          },
          children: [node],
        };

        parent.children[index] = wrapper;
      }
    });
  };
};

export const ClickableImages: QuartzTransformerPlugin = () => {
  return {
    name: "ClickableImages",
    htmlPlugins(): PluggableList {
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
            `,
          },
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
  closeBtn.innerHTML = '×';
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
    img.style.cursor = 'var(--grab-cursor)';
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
    img.style.cursor = 'var(--grabbing-cursor)';
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
    img.style.cursor = scale > 1 ? 'var(--grab-cursor)' : 'var(--default-cursor)';
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
            `,
          },
        ],
        additionalHead: [],
      };
    },
  };
};
