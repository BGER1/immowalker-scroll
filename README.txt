WIX STUDIO SCROLL ANIMATION

1. Create a PUBLIC GitHub repository, e.g. immowalker-scroll.
2. Upload scroll-flythrough.js and the entire frames folder, preserving filenames.
3. In Settings > Pages, choose Deploy from a branch, main, /(root). Wait for publication.
4. In Wix Studio create a section 500vh tall (or approx 5x viewport height).
5. Add a Custom Element inside the section (NOT HTML iframe embed).
6. Source: Server URL: https://YOUR-USERNAME.github.io/immowalker-scroll/scroll-flythrough.js
7. Tag name: scroll-flythrough
8. Set element width 100%, height 100vh, position Sticky, top 0.
9. Preview on the PUBLISHED website and adjust section height for scroll speed.

Note: Wix Studio may constrain section height and sticky behavior depending on layout and parent overflow. If sticky does not work, use a dedicated sticky container within the tall section. The JavaScript assumes the nearest ancestor taller than 1.5 viewports is the scroll track.
