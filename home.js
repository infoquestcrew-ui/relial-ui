(() => {
  const header = document.getElementById('site-header');
  const syncHeader = () => header.classList.toggle('is-docked', window.scrollY > 65);
  window.addEventListener('scroll', syncHeader, { passive: true });
  window.addEventListener('pageshow', syncHeader);
  syncHeader();

  function setUpOpening() {
    const root = document.documentElement;
    if (!root.hasAttribute('data-opening')) return;

    const screen = document.querySelector('.opening-scene');
    const clock = screen.getAnimations?.().find(animation => animation.animationName === 'opening-surface');
    const curves = [];
    const listeners = new AbortController();
    clock?.ready.then(() => {
      if (listeners.signal.aborted || !root.hasAttribute('data-opening')) return;
      // Both strokes fold and reopen on the same timeline as the lettering and the curtain.
      const duration = clock.effect.getTiming().duration;
      for (const path of document.querySelectorAll('.flow-curve')) {
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
    }, () => {}); // Skipping before the first paint cancels the opening's ready promise.
    const options = { signal: listeners.signal, passive: true };
    const finish = () => {
      root.removeAttribute('data-opening');
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
    const controls = stage.querySelector('[data-motion-tools]');
    const control = controls.querySelector('.motion-control');
    const label = control.querySelector('.control-label');
    const bounds = stage.getBoundingClientRect();
    let requested = !preference.matches;
    let visible = bounds.bottom > 0 && bounds.top < window.innerHeight;

    function sync() {
      const playing = requested && visible && !document.hidden;
      if (playing) stage.setAttribute('data-started', '');
      stage.toggleAttribute('data-playing', playing);
      control.toggleAttribute('data-requested', requested);
      label.textContent = requested ? '一時停止' : '再生';
      control.setAttribute('aria-label', stage.dataset.motion + 'を' + label.textContent);
    }

    controls.hidden = false;
    control.addEventListener('click', () => {
      requested = !requested;
      sync();
    });
    preference.addEventListener('change', () => {
      if (preference.matches) {
        requested = false;
        stage.removeAttribute('data-started');
      }
      sync();
    });
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

  function setUpServices(browser) {
    const hover = matchMedia('(any-hover: hover)');
    const routes = Array.from(browser.querySelectorAll('[data-offer]'));
    const panels = Array.from(browser.querySelectorAll('[data-panel]'));
    const controls = browser.querySelector('.offer-controls');
    const position = browser.querySelector('.offer-position');
    const status = browser.querySelector('[data-offer-status]');
    let current = 0;

    function select(index, announce = false) {
      current = index;
      const key = routes[index].dataset.offer;
      routes.forEach(route => route.toggleAttribute('data-active', route.dataset.offer === key));
      panels.forEach(panel => { panel.hidden = panel.dataset.panel !== key; });
      position.textContent = (index + 1) + ' / ' + routes.length;
      if (announce) status.textContent = routes[index].querySelector('strong').textContent + 'の概要を表示しました。';
    }

    routes.forEach((route, index) => {
      route.addEventListener('focus', () => select(index));
      route.addEventListener('pointerenter', event => {
        if (hover.matches && event.pointerType === 'mouse' && !panels.some(panel => panel.contains(document.activeElement))) select(index);
      });
    });
    for (const button of controls.querySelectorAll('[data-step]')) {
      button.addEventListener('click', () => {
        const index = (current + Number(button.dataset.step) + routes.length) % routes.length;
        select(index, true);
      });
    }
    browser.querySelector('.offer-stage').classList.add('is-ready');
    select(0);
    controls.hidden = false;
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

  setUpOpening();
  document.querySelectorAll('[data-motion]').forEach(setUpMotion);
  setUpServices(document.querySelector('[data-services]'));
  setUpNews(document.querySelector('[data-news]'));
})();
