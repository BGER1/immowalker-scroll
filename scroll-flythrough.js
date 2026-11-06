
const CONFIG = {
  framePath: "https://bger1.github.io/immowalker-scroll/frames/f_",
  frameCount: 196,
  digits: 4,
  extension: "webp",

  // Scroll distance needed to play the entire animation
  scrollDistance: 3000,

  // Animation smoothness
  smoothing: 0.15,

  preloadAhead: 12,
  preloadBehind: 5
};

class ScrollFlythrough extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
      </style>
      <canvas></canvas>
    `;

    this.canvas = this.shadowRoot.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d", { alpha: false });

    this.frames = new Array(CONFIG.frameCount);
    this.loading = new Set();

    this.currentFrame = 0;
    this.lastDrawn = -1;
    this.lastImage = null;

    // Remember where the animation begins on the page
    this.startScroll =
      window.scrollY + this.getBoundingClientRect().top;

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);

    // Automatically handle Wix layout changes
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });

    this.resizeObserver.observe(this);

    window.addEventListener("resize", this.resize);

    this.resize();

    // Load first frame
    this.loadFrame(0);
    this.preloadAround(0);

    this.animationId = requestAnimationFrame(this.animate);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.animationId);

    window.removeEventListener("resize", this.resize);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.initialized = false;
  }

  resize() {
    const rect = this.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (
      this.canvas.width !== width ||
      this.canvas.height !== height
    ) {
      this.canvas.width = width;
      this.canvas.height = height;

      this.lastDrawn = -1;
      this.drawFrame(Math.round(this.currentFrame));
    }
  }

  getFrameURL(index) {
    const number = String(index + 1).padStart(
      CONFIG.digits,
      "0"
    );

    return (
      CONFIG.framePath +
      number +
      "." +
      CONFIG.extension
    );
  }

  loadFrame(index) {
    if (index < 0 || index >= CONFIG.frameCount) return;

    if (this.frames[index] || this.loading.has(index)) return;

    this.loading.add(index);

    const img = new Image();

    img.onload = () => {
      this.frames[index] = img;
      this.loading.delete(index);

      if (index === 0 && !this.lastImage) {
        this.drawFrame(0);
      }
    };

    img.onerror = () => {
      this.loading.delete(index);
      console.warn("Failed to load frame:", index + 1);
    };

    img.src = this.getFrameURL(index);
  }

  preloadAround(index) {
    const start = Math.max(
      0,
      index - CONFIG.preloadBehind
    );

    const end = Math.min(
      CONFIG.frameCount - 1,
      index + CONFIG.preloadAhead
    );

    for (let i = start; i <= end; i++) {
      this.loadFrame(i);
    }
  }

  getScrollProgress() {
    // Scroll position relative to where the element starts
    const scrollPosition = window.scrollY - this.startScroll;

    const progress =
      scrollPosition / CONFIG.scrollDistance;

    return Math.max(0, Math.min(1, progress));
  }

  drawFrame(index) {
    let img = this.frames[index];

    // Keep the last loaded frame visible while loading
    if (!img || !img.complete || !img.naturalWidth) {
      img = this.lastImage || this.frames[0];
    }

    if (!img || !img.naturalWidth) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Fill the screen without stretching the image
    const scale = Math.max(cw / iw, ch / ih);

    const width = iw * scale;
    const height = ih * scale;

    const x = (cw - width) / 2;
    const y = (ch - height) / 2;

    this.ctx.clearRect(0, 0, cw, ch);
    this.ctx.drawImage(img, x, y, width, height);

    this.lastImage = img;
    this.lastDrawn = index;
  }

  animate() {
    const progress = this.getScrollProgress();

    const targetFrame =
      progress * (CONFIG.frameCount - 1);

    this.currentFrame +=
      (targetFrame - this.currentFrame) * CONFIG.smoothing;

    if (Math.abs(targetFrame - this.currentFrame) < 0.01) {
      this.currentFrame = targetFrame;
    }

    const frameIndex = Math.max(
      0,
      Math.min(
        CONFIG.frameCount - 1,
        Math.round(this.currentFrame)
      )
    );

    if (frameIndex !== this.lastDrawn) {
      this.drawFrame(frameIndex);
    }

    this.preloadAround(frameIndex);

    this.animationId = requestAnimationFrame(this.animate);
  }
}

if (!customElements.get("scroll-flythrough")) {
  customElements.define(
    "scroll-flythrough",
    ScrollFlythrough
  );
}
