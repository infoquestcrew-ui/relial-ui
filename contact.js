(() => {
  const form = document.getElementById('contact-form');
  const category = document.getElementById('contact-type');
  const categoryRow = category.closest('.contact-row');
  const service = document.getElementById('contact-service');
  const serviceRow = document.getElementById('service-row');
  const purpose = document.getElementById('graduate-purpose');
  const purposeRow = document.getElementById('graduate-purpose-row');
  const monthlyFields = document.getElementById('monthly-fields');
  const monthlyPurpose = document.getElementById('monthly-purpose');
  const message = document.getElementById('contact-message');
  const messageLabel = document.getElementById('message-label');
  const messageBadge = document.getElementById('message-badge');
  const defaultTitle = document.title;
  const inputStep = document.getElementById('contact-input');
  const reviewStep = document.getElementById('contact-review');
  const reviewButton = document.getElementById('review-inquiry');
  const editButton = document.getElementById('edit-inquiry');
  const sendButton = document.getElementById('send-inquiry');
  const reviewValues = document.getElementById('review-values');
  const status = document.getElementById('sending-status');
  const error = document.getElementById('contact-error');
  const defaultError = error.textContent;
  const endpoint = new URL(form.action);
  endpoint.pathname = '/ajax' + endpoint.pathname;
  let reviewedData;

  const query = new URLSearchParams(window.location.search);
  const type = query.get('type');
  const categoryOption = [...category.options].find(option => type && option.dataset.type === type);
  const serviceOption = [...service.options].find(option => type && option.dataset.type === type);
  if (!category.value) {
    if (categoryOption) category.value = categoryOption.value;
    if (serviceOption) {
      category.value = category.querySelector('[data-type="service"]').value;
      service.value = serviceOption.value;
      const servicePurpose = type === 'monthly-rpo' ? monthlyPurpose : purpose;
      const initialPurpose = [...servicePurpose.options].find(option => option.dataset.intent === query.get('intent'));
      if (initialPurpose && !servicePurpose.value) servicePurpose.value = initialPurpose.value;
      if (type === 'monthly-rpo') {
        const selectedSupport = query.getAll('support');
        for (const checkbox of monthlyFields.querySelectorAll('[data-support]')) {
          if (selectedSupport.includes(checkbox.dataset.support)) checkbox.checked = true;
        }
      }
    }
  }

  function updateFields() {
    const selectedType = category.selectedOptions[0]?.dataset.type;
    const applicable = selectedType === 'service';
    service.disabled = !applicable;
    const serviceType = applicable ? service.selectedOptions[0]?.dataset.type : '';
    const isMonthly = serviceType === 'monthly-rpo';
    const dedicatedMonthly = isMonthly && type === 'monthly-rpo';
    categoryRow.hidden = dedicatedMonthly;
    serviceRow.hidden = !applicable || dedicatedMonthly;
    const isGraduateService = serviceType === 'graduate-events';
    purposeRow.hidden = !isGraduateService;
    purpose.disabled = !isGraduateService;
    monthlyFields.hidden = !isMonthly;
    monthlyFields.disabled = !isMonthly;
    for (const element of document.querySelectorAll('[data-monthly-heading]')) element.hidden = !isMonthly;
    for (const element of document.querySelectorAll('[data-general-heading]')) element.hidden = isMonthly;
    document.title = isMonthly ? '採用代行サービスの無料相談・お見積もり｜RELIAL株式会社' : defaultTitle;
    message.name = isMonthly ? 'その他相談事項' : 'お問い合わせ内容';
    messageLabel.textContent = message.name;
    message.required = !isMonthly;
    messageBadge.textContent = isMonthly ? '任意' : '必須';
    messageBadge.classList.toggle('is-required', !isMonthly);
    if (isMonthly) message.setCustomValidity('');
    for (const row of form.querySelectorAll('[data-business-only]')) {
      row.hidden = selectedType === 'careers';
      row.querySelector('input, select').disabled = row.hidden;
    }
  }

  function showInputs() {
    reviewStep.hidden = true;
    inputStep.hidden = false;
    sendButton.disabled = true;
    editButton.disabled = false;
    reviewButton.disabled = false;
    reviewValues.replaceChildren();
    reviewedData = null;
    status.textContent = '';
    error.hidden = true;
  }

  function renderReview() {
    const rows = document.createDocumentFragment();
    const fields = new FormData(form);
    fields.delete('_next'); // Only the non-JavaScript form needs a return URL.
    reviewedData = {};
    for (const name of new Set(fields.keys())) {
      const label = name.replace(/\[\]$/, '');
      reviewedData[label] = fields.getAll(name).join('、');
    }
    for (const [name, value] of Object.entries(reviewedData)) {
      if (name.startsWith('_') || (categoryRow.hidden && name === category.name)) continue;
      const row = document.createElement('div');
      const label = document.createElement('dt');
      const content = document.createElement('dd');
      label.textContent = name === 'email' ? 'メールアドレス' : name;
      content.textContent = value.trim() ? value : '未入力';
      row.append(label, content);
      rows.append(row);
    }
    reviewValues.replaceChildren(rows);
    inputStep.hidden = true;
    reviewStep.hidden = false;
    reviewButton.disabled = true;
    sendButton.disabled = false;
    document.getElementById('review-title').focus();
  }

  reviewButton.querySelector('span').textContent = '入力内容を確認する';
  updateFields();
  category.addEventListener('change', updateFields);
  service.addEventListener('change', updateFields);
  editButton.addEventListener('click', () => {
    showInputs();
    (categoryRow.hidden ? monthlyPurpose : category).focus();
  });
  window.addEventListener('pageshow', event => {
    updateFields();
    if (event.persisted) showInputs();
  });
  form.addEventListener('input', event => event.target.setCustomValidity?.(''));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (reviewStep.hidden) {
      for (const control of form.querySelectorAll('input[type="text"][required]:enabled, textarea[required]:enabled')) {
        control.setCustomValidity(control.value.trim() ? '' : 'この項目を入力してください。');
      }
      if (form.reportValidity()) renderReview();
      return;
    }
    if (sendButton.disabled) return;
    sendButton.disabled = true;
    editButton.disabled = true;
    error.hidden = true;
    error.textContent = defaultError;
    status.textContent = '送信中です。';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(reviewedData),
        credentials: 'omit',
        signal: controller.signal
      });
      const result = await response.json();
      if (/activat/i.test(result.message || '')) {
        error.textContent = '現在、フォームの受信設定を確認しています。お急ぎの方は info@relial.jp までご連絡ください。';
        throw new Error('Activation pending');
      }
      if (!response.ok || (result.success !== true && result.success !== 'true')) {
        throw new Error('Submission failed');
      }
      window.location.assign('thanks.html');
    } catch {
      sendButton.disabled = false;
      editButton.disabled = false;
      status.textContent = '';
      error.hidden = false;
      error.focus();
    } finally {
      window.clearTimeout(timeout);
    }
  });
})();
