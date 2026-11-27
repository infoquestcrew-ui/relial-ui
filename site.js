(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 768px)');
  const header = document.getElementById('site-header');
  const headerInner = header.querySelector('.header-inner');
  const menu = header.querySelector('.menu-toggle');
  const menuLabel = menu.querySelector('.menu-label');
  const nav = document.getElementById('site-nav');
  const dropdowns = nav.querySelectorAll('.nav-dropdown');
  const reopen = document.createElement('button');
  reopen.type = 'button';
  reopen.className = 'header-reopen';
  reopen.setAttribute('aria-label', 'ヘッダーメニューを開く');
  reopen.setAttribute('aria-controls', nav.id);
  reopen.setAttribute('aria-expanded', 'true');
  reopen.inert = true;
  header.prepend(reopen);
  const shade = document.createElement('div');
  shade.className = 'menu-shade';
  shade.setAttribute('aria-hidden', 'true');
  shade.hidden = true;
  header.after(shade);

  if (document.querySelector('[data-former-section]')) {
    const followFormerSection = () => {
      const target = document.getElementById(location.hash.slice(1));
      if (target?.matches('a[data-former-section]')) location.replace(target.href);
    };
    followFormerSection();
    window.addEventListener('hashchange', followFormerSection);
  }

  let hoverPreview = null;
  let expandedAt = null;
  const collapseDistance = 96;

  function syncHeader() {
    const y = window.scrollY;
    if (y <= collapseDistance || (expandedAt !== null && Math.abs(y - expandedAt) >= collapseDistance)) {
      expandedAt = null;
    }
    const compact = y > collapseDistance && expandedAt === null && !header.classList.contains('is-open');
    if (compact === headerInner.inert) return;

    const hadFocus = header.contains(document.activeElement);
    if (compact) dropdowns.forEach(closeDropdown);
    header.classList.toggle('is-compact', compact);
    headerInner.inert = compact;
    reopen.inert = !compact;
    reopen.setAttribute('aria-expanded', String(!compact));
    if (hadFocus) {
      const firstControl = mobile.matches ? menu : nav.querySelector('summary');
      (compact ? reopen : firstControl).focus({ preventScroll: true });
    }
  }

  function closeDropdown(dropdown) {
    dropdown.open = false;
    if (hoverPreview === dropdown) hoverPreview = null;
  }

  for (const dropdown of dropdowns) {
    dropdown.addEventListener('pointerenter', event => {
      if (mobile.matches || event.pointerType !== 'mouse' || dropdown.open) return;
      dropdown.open = true;
      hoverPreview = dropdown;
    });
    dropdown.addEventListener('pointerleave', () => {
      if (hoverPreview === dropdown && !dropdown.contains(document.activeElement)) closeDropdown(dropdown);
    });
    dropdown.querySelector('summary').addEventListener('click', event => {
      // The first click pins a hover preview. The next click toggles it natively.
      if (hoverPreview === dropdown) {
        event.preventDefault();
        hoverPreview = null;
      }
    });
    dropdown.addEventListener('focusout', event => {
      if (!mobile.matches && !dropdown.contains(event.relatedTarget)) closeDropdown(dropdown);
    });
  }
  document.addEventListener('click', event => {
    for (const dropdown of dropdowns) {
      if (dropdown.open && !dropdown.contains(event.target)) closeDropdown(dropdown);
    }
    if (expandedAt !== null && shade.hidden && !header.contains(event.target)) {
      expandedAt = null;
      syncHeader();
    }
  });

  function setMenu(open, restoreFocus = false) {
    if (!open) {
      dropdowns.forEach(closeDropdown);
      expandedAt = null;
    }
    header.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? '閉じる' : 'メニュー';
    shade.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    for (const part of document.querySelectorAll('main, .site-footer')) part.inert = open;
    syncHeader();
    if (restoreFocus) (headerInner.inert ? reopen : menu).focus({ preventScroll: true });
  }

  menu.hidden = false;
  document.documentElement.classList.add('js');
  // Keep each masthead's background behind the header and its breadcrumbs below it.
  const crumbs = document.querySelector('.inner-main .crumbs');
  if (crumbs) {
    const space = document.createElement('div');
    space.className = 'header-space';
    space.setAttribute('aria-hidden', 'true');
    crumbs.before(space);
    const fitSpace = () => { space.style.height = header.getBoundingClientRect().bottom + 'px'; };
    fitSpace();
    if ('ResizeObserver' in window) new ResizeObserver(fitSpace).observe(header);
    else window.addEventListener('resize', fitSpace);
  }
  reopen.addEventListener('click', () => {
    expandedAt = window.scrollY;
    if (mobile.matches) setMenu(true);
    else syncHeader();
  });
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') === 'false'));
  shade.addEventListener('click', () => setMenu(false, true));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const expanded = nav.querySelector('.nav-dropdown[open]');
      if (expanded) {
        const focusInside = expanded.contains(document.activeElement);
        closeDropdown(expanded);
        if (focusInside) expanded.querySelector('summary').focus({ preventScroll: true });
        return;
      }
    }
    if (shade.hidden) {
      if (event.key === 'Escape' && expandedAt !== null) {
        expandedAt = null;
        syncHeader();
      }
      return;
    }
    if (event.key === 'Escape') {
      setMenu(false, true);
      return;
    }
    if (event.key !== 'Tab') return;
    const first = header.querySelector('.brand');
    const last = nav.lastElementChild;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  mobile.addEventListener('change', () => setMenu(false));
  window.addEventListener('pageshow', event => {
    if (event.persisted) setMenu(false);
    else syncHeader();
  });

  const video = document.querySelector('.sky-video');
  if (video && video.canPlayType('video/mp4')) {
    const control = document.querySelector('.video-toggle');
    let wantsPlayback = !reducedMotion.matches && !navigator.connection?.saveData;
    let inView = video.getBoundingClientRect().bottom > 0;
    let failed = false;

    function updateControl() {
      const playing = !video.paused;
      control.classList.toggle('is-playing', playing);
      const action = playing ? '背景動画を一時停止' : '背景動画を再生';
      control.setAttribute('aria-label', action);
      control.title = action;
    }

    function syncPlayback() {
      if (failed) return;
      if (!wantsPlayback || !inView || document.hidden) {
        video.pause();
        return;
      }
      if (!video.hasAttribute('src')) video.src = video.dataset.src;
      video.play().catch(error => {
        if (error.name === 'NotAllowedError') wantsPlayback = false;
        updateControl();
      });
    }

    control.hidden = false;
    video.muted = true;
    control.addEventListener('click', () => {
      wantsPlayback = video.paused;
      syncPlayback();
    });
    video.addEventListener('play', updateControl);
    video.addEventListener('pause', updateControl);
    video.addEventListener('error', () => {
      failed = true;
      control.hidden = true;
      video.hidden = true;
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        wantsPlayback = false;
        syncPlayback();
      }
    });
    document.addEventListener('visibilitychange', syncPlayback);
    if ('IntersectionObserver' in window) {
      const visibility = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio > 0;
        syncPlayback();
      }, { rootMargin: '-' + header.offsetHeight + 'px 0px 0px', threshold: .01 });
      visibility.observe(video);
    }
    updateControl();
    syncPlayback();
  }

  if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
  const reveals = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('is-pending');
      reveals.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -14px', threshold: 0 });
  for (const section of document.querySelectorAll('[data-reveal]')) {
    if (section.getBoundingClientRect().top < window.innerHeight) continue;
    section.classList.add('is-pending');
    reveals.observe(section);
  }

  function countUp(number) {
    const target = number.dataset.count;
    const total = Number(target);
    const decimals = (target.split('.')[1] || '').length;
    const start = performance.now();
    function frame(time) {
      const t = reducedMotion.matches ? 1 : Math.min(1, (time - start) / 1050);
      number.textContent = (total * (1 - (1 - t) ** 3)).toFixed(decimals);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const counts = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      countUp(entry.target);
      counts.unobserve(entry.target);
    }
  }, { threshold: .5 });
  for (const number of document.querySelectorAll('[data-count]')) counts.observe(number);
})();
