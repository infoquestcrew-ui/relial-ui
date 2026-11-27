(() => {
  const channels = document.getElementById('channel-logos');

  // A second, decorative copy makes each row loop back to its first logo.
  for (const list of channels.querySelectorAll('.rpo-channel-row > ul')) {
    const repeat = list.cloneNode(true);
    repeat.setAttribute('aria-hidden', 'true');
    list.after(repeat);
  }
  channels.classList.add('can-scroll');
})();
