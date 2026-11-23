(() => {
  const header = document.getElementById('site-header');
  const syncHeader = () => header.classList.toggle('is-docked', window.scrollY > 65);
  window.addEventListener('scroll', syncHeader, { passive: true });
  window.addEventListener('pageshow', syncHeader);
  syncHeader();

  function strokeTipOutline(path) {
    // The leading edge of the visible dash travels along the changing curve.
    const offset = parseFloat(getComputedStyle(path).strokeDashoffset);
    const progress = 1 - offset / path.pathLength.baseVal;
    if (!(progress > 0)) return '';

    const length = path.getTotalLength();
    const distance = Math.min(progress, 1) * length;
    const point = path.getPointAtLength(distance);
    const before = path.getPointAtLength(Math.max(0, distance - 1));
    const after = path.getPointAtLength(Math.min(length, distance + 1));
    const angle = Math.atan2(after.y - before.y, after.x - before.x);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    // Draw in the stroke's coordinates so the same gradient runs through its tip.
    const vertex = (along, across) => {
      const x = point.x + along * dx - across * dy;
      const y = point.y + along * dy + across * dx;
      return x.toFixed(2) + ' ' + y.toFixed(2);
    };
    return `M ${vertex(35, 0)} L ${vertex(-11, 36)} L ${vertex(0, 0)} L ${vertex(-11, -36)} Z`;
  }

  function setUpOpening() {
    const root = document.documentElement;
    if (!root.hasAttribute('data-opening')) return;

    const screen = document.querySelector('.opening-scene');
    const clock = screen.getAnimations?.().find(animation => animation.animationName === 'opening-surface');
    const paths = Array.from(document.querySelectorAll('.flow-curve'));
    const curves = [];
    const listeners = new AbortController();
    let tipFrame;
    function followTips() {
      if (!root.hasAttribute('data-opening')) return;
      const outlines = paths.map(strokeTipOutline);
      paths.forEach((path, index) => {
        const tip = path.nextElementSibling;
        if (tip.getAttribute('d') !== outlines[index]) tip.setAttribute('d', outlines[index]);
      });
      tipFrame = requestAnimationFrame(followTips);
    }
    clock?.ready.then(() => {
      if (listeners.signal.aborted || !root.hasAttribute('data-opening')) return;
      // Both strokes fold and reopen on the same timeline as the lettering and the curtain.
      const duration = clock.effect.getTiming().duration;
      for (const path of paths) {
        const morph = document.createElementNS(path.namespaceURI, 'animate');
        if (typeof morph.beginElementAt !== 'function') continue;
        const open = path.getAttribute('d');
        const folded = path.dataset.fold;
        morph.setAttribute('attributeName', 'd');
        morph.setAttribute('values', [open, folded, folded, path.dataset.land].join(';'));
        morph.setAttribute('keyTimes', '0;.37;.49;1');
        morph.setAttribute('calcMode', 'spline');
        morph.setAttribute('keySplines', '.52 0 .3 1;0 0 1 1;.15 .79 .22 1');
        morph.setAttribute('begin', 'indefinite');
        morph.setAttribute('fill', 'freeze');
        morph.setAttribute('dur', duration * .245 + 'ms');
        path.append(morph);
        morph.beginElementAt((duration * .66 - clock.currentTime) / 1000);
        curves.push(morph);
      }
      tipFrame = requestAnimationFrame(followTips);
    }, () => {}); // Skipping before the first paint cancels the opening's ready promise.
    const options = { signal: listeners.signal, passive: true };
    const finish = () => {
      root.removeAttribute('data-opening');
      cancelAnimationFrame(tipFrame);
      curves.forEach(morph => morph.remove());
      listeners.abort();
    };

    screen.addEventListener('animationend', event => {
      if (event.target === screen && event.animationName === 'opening-surface') finish();
    }, options);
    window.addEventListener('keydown', finish, options);
    window.addEventListener('pointerdown', finish, options);
    window.addEventListener('wheel', finish, options);
    window.addEventListener('scroll', () => { if (scrollY > 1) finish(); }, options);
    window.addEventListener('pagehide', finish, options);
    matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').addEventListener('change', finish, options);
  }

  function setUpMotion(stage) {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const bounds = stage.getBoundingClientRect();
    let visible = bounds.bottom > 0 && bounds.top < window.innerHeight;

    function sync() {
      const playing = !preference.matches && visible && !document.hidden;
      if (playing) stage.setAttribute('data-started', '');
      if (preference.matches) stage.removeAttribute('data-started');
      stage.toggleAttribute('data-playing', playing);
    }

    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pageshow', sync);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio > 0;
        sync();
      }, { rootMargin: '-' + header.offsetHeight + 'px 0px 0px', threshold: .01 });
      observer.observe(stage);
    }
    sync();
  }

  function setUpNews(section) {
    const controls = section.querySelector('.news-filters');
    const buttons = controls.querySelectorAll('[data-filter]');
    const grid = section.querySelector('.press-grid');
    const groups = grid.querySelectorAll('[data-category]');
    const status = section.querySelector('[data-news-status]');

    for (const button of buttons) {
      button.addEventListener('click', () => {
        const category = button.dataset.filter;
        grid.dataset.view = category;
        buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        let count = 0;
        for (const group of groups) {
          group.hidden = category !== 'all' && category !== group.dataset.category;
          if (!group.hidden) count += group.querySelectorAll('a').length;
        }
        status.textContent = button.textContent + '、' + count + '件を表示しています。';
      });
    }
    controls.hidden = false;
  }

  function setUpCursorGlows() {
    const enabled = matchMedia('(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)');
    const forcedColors = matchMedia('(forced-colors: active)');
    // Share the spacing and the two-glow limit across adjacent sections.
    const activeGlows = new Set();
    let lastGlow = null;

    function reset() {
      for (const glow of activeGlows) glow.remove();
      activeGlows.clear();
      lastGlow = null;
    }
    enabled.addEventListener('change', reset);
    forcedColors.addEventListener('change', reset);

    for (const section of document.querySelectorAll('[data-cursor-glow]')) {
      const layer = document.createElement('div');
      layer.className = 'cursor-field';
      layer.setAttribute('aria-hidden', 'true');
      section.prepend(layer);

      section.addEventListener('pointermove', event => {
        if (!enabled.matches || forcedColors.matches || event.pointerType !== 'mouse' || event.buttons) return;
        if (activeGlows.size >= 2) return;
        const now = performance.now();
        if (lastGlow && (now - lastGlow.time < 1800 ||
            Math.hypot(event.pageX - lastGlow.x, event.pageY - lastGlow.y) < 120)) return;

        const bounds = layer.getBoundingClientRect();
        const bloom = document.createElement('span');
        bloom.className = 'cursor-bloom';
        bloom.style.left = (event.clientX - bounds.left) + 'px';
        bloom.style.top = (event.clientY - bounds.top) + 'px';
        lastGlow = { time: now, x: event.pageX, y: event.pageY };
        activeGlows.add(bloom);
        const remove = () => {
          activeGlows.delete(bloom);
          bloom.remove();
        };
        bloom.addEventListener('animationend', remove, { once: true });
        bloom.addEventListener('animationcancel', remove, { once: true });
        layer.append(bloom);
      }, { passive: true });
    }
  }

  setUpOpening();
  document.querySelectorAll('[data-motion]').forEach(setUpMotion);
  setUpNews(document.querySelector('[data-news]'));
  setUpCursorGlows();
})();
