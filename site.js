(() => {
  const header = document.getElementById('site-header');
  const nav = document.getElementById('site-nav');
  const toggle = header.querySelector('.menu-toggle');
  const small = window.matchMedia('(max-width: 1023px)');
  const hover = window.matchMedia('(hover: hover)');
  const sections = {
    about: {
      title: 'About RELIAL',
      links: [
        ['採用支援の考え方', './#why', 'meeting.webp'],
        ['私たちの支援内容', './#service', 'studio.webp']
      ]
    },
    company: {
      title: 'Company Information',
      links: [
        ['会社概要', 'company.html#profile', 'office.webp'],
        ['本社所在地', 'company.html#office', 'relial-logo.svg']
      ]
    }
  };

  let activeGroup = null;
  let pinned = false;
  let drawerOpen = false;
  let expandedAt = null;

  function closeGroup() {
    if (!activeGroup) return;
    activeGroup.button.setAttribute('aria-expanded', 'false');
    activeGroup.panel.hidden = true;
    activeGroup = null;
    pinned = false;
  }

  function showGroup(group, pin) {
    if (group !== activeGroup) closeGroup();
    group.button.setAttribute('aria-expanded', 'true');
    group.panel.hidden = false;
    activeGroup = group;
    pinned = pin;
  }

  for (const link of nav.querySelectorAll('[data-menu]')) {
    const key = link.dataset.menu;
    const section = sections[key];
    const holder = document.createElement('div');
    holder.className = 'nav-group';
    const button = document.createElement('button');
    button.className = 'group-button';
    button.type = 'button';
    button.textContent = link.textContent;
    button.setAttribute('aria-controls', 'panel-' + key);
    button.setAttribute('aria-expanded', 'false');

    const panel = document.createElement('div');
    panel.className = 'nav-panel';
    panel.id = 'panel-' + key;
    panel.hidden = true;
    const title = document.createElement('span');
    title.className = 'panel-title';
    title.lang = 'en';
    title.textContent = section.title;
    const items = document.createElement('div');
    items.className = 'panel-items';
    for (const [name, href, file] of section.links) {
      const item = document.createElement('a');
      item.href = href;
      const image = document.createElement('img');
      image.src = 'assets/' + file;
      image.alt = '';
      image.loading = 'lazy';
      if (file.endsWith('.svg')) image.className = 'panel-logo';
      const label = document.createElement('b');
      label.textContent = name;
      item.append(image, label);
      items.append(item);
    }
    panel.append(title, items);
    holder.append(button, panel);
    link.replaceWith(holder);

    const group = { button, panel };
    button.addEventListener('click', () => {
      if (activeGroup === group && pinned) closeGroup();
      else showGroup(group, true);
    });
    holder.addEventListener('pointerenter', () => {
      if (!small.matches && hover.matches && activeGroup !== group) showGroup(group, false);
    });
    holder.addEventListener('pointerleave', () => {
      if (!small.matches && activeGroup === group && !pinned && !holder.contains(document.activeElement)) closeGroup();
    });
    holder.addEventListener('focusout', event => {
      if (!small.matches && activeGroup === group && !holder.contains(event.relatedTarget)) closeGroup();
    });
  }

  function syncHeader() {
    const pastHero = window.scrollY >= window.innerHeight / 2;
    if (!pastHero || (expandedAt !== null && Math.abs(window.scrollY - expandedAt) > 140)) expandedAt = null;
    const focusedInNav = nav.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
    const compact = pastHero && !drawerOpen && expandedAt === null && !focusedInNav;
    if (compact) closeGroup();
    header.classList.toggle('is-compact', compact);
    toggle.hidden = !small.matches && !compact;
    toggle.setAttribute('aria-expanded', String(drawerOpen || (!small.matches && !compact)));
    toggle.setAttribute('aria-label', drawerOpen ? 'メニューを閉じる' : 'メニューを開く');
  }

  function setDrawer(open) {
    drawerOpen = open && small.matches;
    closeGroup();
    header.classList.toggle('is-open', drawerOpen);
    document.body.classList.toggle('menu-open', drawerOpen);
    for (const region of document.querySelectorAll('main, .site-footer')) region.inert = drawerOpen;
    syncHeader();
  }

  toggle.addEventListener('click', event => {
    if (small.matches) {
      setDrawer(!drawerOpen);
      return;
    }
    expandedAt = window.scrollY;
    syncHeader();
    if (event.detail === 0) nav.querySelector('button, a').focus({ preventScroll: true });
  });

  document.addEventListener('pointerdown', event => {
    if (header.contains(event.target)) return;
    closeGroup();
    expandedAt = null;
  });
  header.addEventListener('click', event => {
    if (event.target.closest('a')) setDrawer(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (drawerOpen) {
        setDrawer(false);
        toggle.focus({ preventScroll: true });
      } else if (activeGroup) {
        const button = activeGroup.button;
        closeGroup();
        button.focus({ preventScroll: true });
      }
    }
    if (event.key !== 'Tab' || !drawerOpen) return;
    const visible = Array.from(header.querySelectorAll('a, button')).filter(el => el.getClientRects().length);
    const first = visible[0];
    const last = visible[visible.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  let frame = null;
  window.addEventListener('scroll', () => {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      syncHeader();
    });
  }, { passive: true });
  small.addEventListener('change', () => setDrawer(false));
  window.addEventListener('pageshow', () => setDrawer(false));
  document.documentElement.classList.add('enhanced');
  syncHeader();

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.replace('awaiting', 'revealed');
        observer.unobserve(entry.target);
      }
    }, { threshold: .08 });
    for (const art of document.querySelectorAll('.story-art')) {
      art.classList.add('awaiting');
      observer.observe(art);
    }
  }
})();
