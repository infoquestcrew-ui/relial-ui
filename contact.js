(() => {
  const form = document.getElementById('contact-form');
  const category = document.getElementById('contact-type');
  const service = document.getElementById('contact-service');
  const serviceRow = document.getElementById('service-row');
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = document.getElementById('submit-label');
  const copy = document.getElementById('copy-inquiry');
  const manual = document.getElementById('manual-copy');
  const draftText = document.getElementById('draft-text');
  const manualLink = document.getElementById('manual-mail-link');
  const status = document.getElementById('contact-status');
  const error = document.getElementById('contact-error');
  const destination = new URL(form.action);
  const usesEmail = destination.protocol === 'mailto:';

  // Accept only the inquiry types declared in the form.
  const type = new URLSearchParams(window.location.search).get('type');
  const categoryOption = [...category.options].find(option => type && option.dataset.type === type);
  const serviceOption = [...service.options].find(option => type && option.dataset.type === type);
  if (!category.value) {
    if (categoryOption) category.value = categoryOption.value;
    if (serviceOption) {
      category.value = category.querySelector('[data-type="service"]').value;
      service.value = serviceOption.value;
    }
  }

  function updateService() {
    const applicable = category.selectedOptions[0]?.dataset.type === 'service';
    serviceRow.hidden = !applicable;
    service.disabled = !applicable;
  }

  updateService();
  category.addEventListener('change', updateService);
  window.addEventListener('pageshow', () => {
    updateService();
    submit.disabled = false;
    submitLabel.textContent = usesEmail ? 'メールの下書きを開く' : '内容を送信する';
  });
  copy.hidden = !usesEmail;
  document.getElementById('mail-help').hidden = !usesEmail;

  function validInquiry() {
    for (const control of form.querySelectorAll('input[type="text"][required], textarea[required]')) {
      control.setCustomValidity(control.value.trim() ? '' : 'この項目を入力してください。');
    }
    return form.reportValidity();
  }

  function mailBody() {
    const lines = [];
    for (const [name, raw] of new FormData(form)) {
      const value = raw.trim().replace(/\r\n|\r|\n/g, '\r\n');
      if (!value || name.startsWith('_')) continue;
      const label = name === 'email' ? 'メールアドレス' : name;
      lines.push(name === 'お問い合わせ内容' ? label + '：\r\n' + value : label + '：' + value);
    }
    return lines.join('\r\n\r\n');
  }

  function composeAddress() {
    const topic = !service.disabled && service.value ? service.value : category.value;
    return destination.href + '?subject=' + encodeURIComponent('【RELIAL】' + topic);
  }

  function showManualCopy(body, message) {
    draftText.value = body;
    manualLink.href = composeAddress();
    manual.hidden = false;
    status.textContent = message;
    draftText.focus();
    draftText.select();
  }

  form.addEventListener('input', event => {
    if (event.target === draftText) return;
    event.target.setCustomValidity?.('');
    status.textContent = '';
    error.hidden = true;
    manual.hidden = true;
  });

  copy.addEventListener('click', async () => {
    if (!validInquiry()) return;
    const body = mailBody();
    try {
      await navigator.clipboard.writeText(body);
      status.textContent = '入力内容をコピーしました。メール本文に貼り付けてお使いください。';
    } catch {
      showManualCopy(body, '下の本文を選択してコピーし、メールに貼り付けてください。');
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !validInquiry()) return;
    error.hidden = true;
    if (usesEmail) {
      const body = mailBody();
      const href = composeAddress() + '&body=' + encodeURIComponent(body);
      // Some mail handlers truncate long URLs. Keep the complete text available to paste.
      if (href.length > 2000) {
        showManualCopy(body, '長い本文は、下の欄からコピーしてメールに貼り付けてください。');
        return;
      }
      status.textContent = 'メールアプリで送信してください。開かない場合は、入力内容をコピーして info@relial.jp にお送りください。';
      manualLink.href = href;
      manualLink.click();
      return;
    }

    // A configured HTTPS form action accepts the inquiry before the receipt is shown.
    submit.disabled = true;
    submitLabel.textContent = '送信中…';
    try {
      const response = await fetch(destination, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
        credentials: 'omit'
      });
      if (!response.ok) throw new Error('Submission failed');
      window.location.assign('thanks.html');
    } catch {
      submit.disabled = false;
      submitLabel.textContent = '内容を送信する';
      error.hidden = false;
      error.focus();
    }
  });
})();
