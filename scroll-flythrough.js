
const CONFIG = {
  framePath: "https://bger1.github.io/immowalker-scroll/frames/f_",
  frameCount: 196,
  digits: 4,
  extension: "webp",
  smoothing: 0.15,
  preloadAhead: 12,
  preloadBehind: 5
};

class ScrollFlythrough extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;

    this.attachShadow({ mode: "open" });

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

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);

    // Detect Wix layout changes
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });

    this.resizeObserver.observe(this);

    window.addEventListener("resize", this.resize);

    this.resize();

    // Load first frame immediately
    this.loadFrame(0);

    // Preload nearby frames
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
    for (
      let i = Math.max(0, index - CONFIG.preloadBehind);
      i <= Math.min(CONFIG.frameCount - 1, index + CONFIG.preloadAhead);
      i++
    ) {
      this.loadFrame(i);
    }
  }

  findScrollSection() {
    let element = this.parentElement;

    while (element && element !== document.body) {
      const rect = element.getBoundingClientRect();

      if (rect.height > window.innerHeight * 1.5) {
        return element;
      }

      element = element.parentElement;
    }

    return null;
  }

  getScrollProgress() {
    const section = this.findScrollSection();

    if (!section) return 0;

    const rect = section.getBoundingClientRect();

    const scrollDistance = rect.height - window.innerHeight;

    if (scrollDistance <= 0) return 0;

    const progress = -rect.top / scrollDistance;

    return Math.max(0, Math.min(1, progress));
  }

  drawFrame(index) {
    let img = this.frames[index];

    if (!img || !img.complete || !img.naturalWidth) {
      // Keep the last loaded image visible while loading
      img = this.lastImage || this.frames[0];
    }

    if (!img || !img.naturalWidth) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover the canvas while preserving aspect ratio
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

    const targetFrame = progress * (CONFIG.frameCount - 1);

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
  customElements.define("scroll-flythrough", ScrollFlythrough);
}
