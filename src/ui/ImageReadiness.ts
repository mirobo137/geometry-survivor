import './image-readiness.css';

/** UI media has reserved geometry and a finite decode deadline. Readiness never
 * disables controls. Event handlers are removed on success, error or timeout. */
export const prepareImage = (image: HTMLImageElement, timeoutMs = 2500): Promise<boolean> => {
  image.loading = 'eager';
  image.dataset.artState = 'loading';
  return new Promise(resolve => {
    const requestedSrc = image.src;
    let settled = false;
    let decoding = false;
    const finish = (ready: boolean): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
      if (image.isConnected) image.dataset.artState = ready ? 'ready' : 'fallback';
      resolve(ready);
    };
    const failed = (): void => {
      // A consumer may already have replaced a failed raster with its SVG
      // fallback in an earlier error listener. Give that source the same deadline.
      if (image.src === requestedSrc) finish(false);
    };
    const loaded = async (): Promise<void> => {
      if (settled || decoding || !image.naturalWidth) return;
      decoding = true;
      const src = image.currentSrc || image.src;
      try {
        await image.decode();
        decoding = false;
        if (src === (image.currentSrc || image.src)) finish(true);
        else void loaded(); // Orientation changed during decode; keep the original deadline.
      } catch { decoding = false; finish(false); }
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    image.addEventListener('load', loaded);
    image.addEventListener('error', failed);
    if (image.complete) {
      if (image.naturalWidth) void loaded();
      else finish(false);
    }
  });
};

const observers = new WeakMap<HTMLElement, IntersectionObserver>();
type MediaImage = HTMLImageElement | SVGImageElement;
const prepareMedia = async (element: MediaImage): Promise<void> => {
  if (element.tagName.toLowerCase() === 'img') { await prepareImage(element as HTMLImageElement); return; }
  const svgImage = element as SVGImageElement;
  const image = new Image();
  image.src = svgImage.dataset.artSrc ?? svgImage.href.baseVal;
  svgImage.dataset.artState = 'loading';
  const ready = await prepareImage(image);
  if (!svgImage.isConnected) return;
  if (ready) svgImage.setAttribute('href', image.src);
  svgImage.dataset.artState = ready ? 'ready' : 'fallback';
};

/** Native lazy loading retains offscreen media. Visible cells alone get eager
 * preparation; one observer per existing collection, not one per menu visit. */
export const observeVisibleImages = (root: HTMLElement): void => {
  let observer = observers.get(root);
  if (!observer && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.target.isConnected) { observer!.unobserve(entry.target); continue; }
        if (!entry.isIntersecting) continue;
        observer!.unobserve(entry.target);
        void prepareMedia(entry.target as MediaImage);
      }
    });
    observers.set(root, observer);
  }
  for (const image of root.querySelectorAll<MediaImage>('img, svg image')) {
    if (image.dataset.artState) continue;
    if (image.tagName.toLowerCase() === 'image') {
      image.dataset.artSrc = (image as SVGImageElement).href.baseVal;
      image.removeAttribute('href'); // SVG has no native loading="lazy".
    }
    if (observer) { image.dataset.artState = 'queued'; observer.observe(image); }
    else if (image.getBoundingClientRect().height > 0) void prepareMedia(image);
  }
};

/** Dynamic hands/modals discard DOM nodes. Stop observing even never-visible
 * cells: removal alone need not cross an IntersectionObserver threshold. */
export const stopObservingImages = (root: HTMLElement): void => {
  observers.get(root)?.disconnect();
  observers.delete(root);
};

/** Decorative CSS plates already have a solid/gradient fallback. Prepare the
 * bounded act buttons only when that console opens, never at initial boot. */
export const prepareActPlates = (root: HTMLElement): void => {
  for (const button of root.querySelectorAll<HTMLElement>('.act-card-button')) {
    if (button.dataset.plateState) continue;
    const url = getComputedStyle(button, '::before').backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
    if (!url) continue;
    button.dataset.plateState = 'loading';
    const image = new Image();
    image.src = url;
    void prepareImage(image).then(ready => {
      if (button.isConnected) button.dataset.plateState = ready ? 'ready' : 'fallback';
    });
  }
};
