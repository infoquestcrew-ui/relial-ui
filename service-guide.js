// Without scripting, each industry link leads to its fully visible section.
(() => {
  const list = document.querySelector('.industry-tabs');
  if (!list) return;
  const tabs = Array.from(list.querySelectorAll('a'));
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));

  function select(index) {
    for (const [i, tab] of tabs.entries()) {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    }
  }

  function followHash() {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    select(index === -1 ? 0 : index);
    if (index !== -1) list.scrollIntoView({block: 'start', behavior: 'instant'});
  }

  list.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    const panel = panels[index];
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    tab.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(index);
      if (location.hash !== tab.hash) history.pushState(null, '', tab.hash);
    });
    tab.addEventListener('keydown', event => {
      if (event.key === ' ') {
        event.preventDefault();
        tab.click();
        return;
      }
      let next;
      switch (event.key) {
        case 'ArrowLeft': next = (index + tabs.length - 1) % tabs.length; break;
        case 'ArrowRight': next = (index + 1) % tabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      select(next);
      tabs[next].focus();
      history.replaceState(null, '', tabs[next].hash);
    });
  });
  followHash();
  window.addEventListener('hashchange', followHash);
})();
