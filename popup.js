function render(domains) {
  const list = document.getElementById('domain-list');
  list.innerHTML = '';
  if (domains.length === 0) {
    list.innerHTML = '<li><span class="empty">登録済みのサイトはありません</span></li>';
    return;
  }
  domains.forEach(domain => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${domain}</span>`;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '削除';
    removeBtn.addEventListener('click', () => {
      chrome.storage.sync.get('domains', ({ domains: d }) => {
        const updated = (d || []).filter(x => x !== domain);
        chrome.storage.sync.set({ domains: updated }, () => render(updated));
      });
    });
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('domain-input');
  const addBtn = document.getElementById('add-btn');

  // 現在のタブのドメインをinputの初期値に
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    try {
      const url = new URL(tabs[0].url);
      input.value = url.hostname;
    } catch (e) {}
  });

  chrome.storage.sync.get('domains', ({ domains }) => {
    render(domains || []);
  });

  addBtn.addEventListener('click', () => {
    const domain = input.value.trim();
    if (!domain) return;
    chrome.storage.sync.get('domains', ({ domains: d }) => {
      const domains = d || [];
      if (domains.includes(domain)) return;
      const updated = [...domains, domain];
      chrome.storage.sync.set({ domains: updated }, () => {
        render(updated);
        input.value = '';
      });
    });
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') addBtn.click();
  });
});
