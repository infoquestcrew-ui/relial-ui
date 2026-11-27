(() => {
  const header = document.getElementById('site-header');

  function strokeTipOutline(path, length) {
    const offset = parseFloat(getComputedStyle(path).strokeDashoffset);
    const progress = 1 - offset / path.pathLength.baseVal;
    if (!(progress > 0 && progress < 1)) return '';

    const distance = progress * length;
    // The mask runs past the flat end of the emblem. Retract the tip inside it.
    const remaining = Math.min(1, (length - distance - 48) / 65);
    if (remaining <= 0) return '';
    const size = remaining * remaining * (3 - 2 * remaining);
    const point = path.getPointAtLength(distance);
    const before = path.getPointAtLength(Math.max(0, distance - 6));
    const after = path.getPointAtLength(Math.min(length, distance + 6));
    const angle = Math.atan2(after.y - before.y, after.x - before.x);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    // Draw in the stroke's coordinates so the same gradient runs through its tip.
    const vertex = (along, across) => {
      const x = point.x + size * (along * dx - across * dy);
      const y = point.y + size * (along * dy + across * dx);
      return x.toFixed(2) + ' ' + y.toFixed(2);
    };
    return `M ${vertex(35, 0)} L ${vertex(-11, 36)} L ${vertex(0, 0)} L ${vertex(-11, -36)} Z`;
  }

  function setUpOpening() {
    const root = document.documentElement;
    if (!root.hasAttribute('data-opening')) return;

    const scene = document.querySelector('.opening-scene');
    const tips = Array.from(document.querySelectorAll('.flow-tips [data-route]'), tip => {
      const path = document.getElementById(tip.dataset.route);
      return { tip, path, length: path.getTotalLength() };
    });
    const listeners = new AbortController();
    let tipFrame;
    function followTips() {
      if (!root.hasAttribute('data-opening')) return;
      for (const { tip, path, length } of tips) {
        const outline = strokeTipOutline(path, length);
        if (tip.getAttribute('d') !== outline) tip.setAttribute('d', outline);
      }
      tipFrame = requestAnimationFrame(followTips);
    }
    followTips();
    const options = { signal: listeners.signal, passive: true };
    const finish = () => {
      root.removeAttribute('data-opening');
      cancelAnimationFrame(tipFrame);
      listeners.abort();
    };

    scene.addEventListener('animationend', event => {
      if (event.target === scene && event.animationName === 'opening-surface') finish();
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
    const motion = matchMedia('(prefers-reduced-motion: no-preference)');
    const mouse = matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const forcedColors = matchMedia('(forced-colors: active)');
    let activeGlow = null;

    function reset() {
      activeGlow?.remove();
      activeGlow = null;
    }
    motion.addEventListener('change', reset);
    forcedColors.addEventListener('change', reset);

    for (const section of document.querySelectorAll('[data-cursor-glow]')) {
      const layer = document.createElement('div');
      layer.className = 'cursor-field';
      layer.setAttribute('aria-hidden', 'true');
      section.prepend(layer);

      function showGlow(event) {
        if (!motion.matches || forcedColors.matches || activeGlow) return;
        const touchStart = event.pointerType === 'touch' && event.type === 'pointerdown' && event.isPrimary;
        const mouseMove = event.pointerType === 'mouse' && event.type === 'pointermove' && mouse.matches && !event.buttons;
        if (!touchStart && !mouseMove) return;
        layer.classList.toggle('touch-glow', touchStart);
        const bounds = layer.getBoundingClientRect();
        const bloom = document.createElement('span');
        bloom.className = 'cursor-bloom';
        bloom.style.left = (event.clientX - bounds.left) + 'px';
        bloom.style.top = (event.clientY - bounds.top) + 'px';
        activeGlow = bloom;
        const remove = () => {
          if (activeGlow === bloom) activeGlow = null;
          bloom.remove();
        };
        bloom.addEventListener('animationend', remove, { once: true });
        bloom.addEventListener('animationcancel', remove, { once: true });
        layer.append(bloom);
      }
      section.addEventListener('pointermove', showGlow, { passive: true });
      section.addEventListener('pointerdown', showGlow, { passive: true });
    }
  }

  setUpOpening();
  document.querySelectorAll('[data-motion]').forEach(setUpMotion);
  setUpNews(document.querySelector('[data-news]'));
  setUpCursorGlows();
})();
