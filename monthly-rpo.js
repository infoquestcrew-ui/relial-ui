(() => {
  const channels = document.getElementById('channel-logos');
  const toggle = document.querySelector('.rpo-channel-toggle');

  // A second, decorative copy makes each row loop back to its first logo.
  for (const list of channels.querySelectorAll('.rpo-channel-row > ul')) {
    const repeat = list.cloneNode(true);
    repeat.setAttribute('aria-hidden', 'true');
    list.after(repeat);
  }
  channels.classList.add('can-scroll');
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const paused = channels.classList.toggle('is-paused');
    toggle.textContent = paused ? '自動スクロールを再開' : '自動スクロールを一時停止';
  });
})();
