// Ruby Text Renderer - content script

function processTextNode(node) {
  const text = node.textContent;
  if (!/\[.+?\]\{.+?\}/.test(text)) return;

  const parent = node.parentNode;
  if (!parent) return;

  const re = /\[([^\]]+)\]\{([^}]+)\}/g;
  let match;
  let lastIndex = 0;
  const parts = [];

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const ruby = document.createElement('ruby');
    ruby.appendChild(document.createTextNode(match[1]));
    const rt = document.createElement('rt');
    rt.textContent = match[2];
    ruby.appendChild(rt);
    parts.push(ruby);
    lastIndex = match.index + match[0].length;
  }

  if (parts.length === 0) return;
  if (lastIndex < text.length) {
    parts.push(document.createTextNode(text.slice(lastIndex)));
  }

  const fragment = document.createDocumentFragment();
  parts.forEach(p => fragment.appendChild(p));
  parent.replaceChild(fragment, node);
}

function walkTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach(processTextNode);
}

// 登録ドメインの末尾一致でサブドメインも有効にする
const hostname = location.hostname;
chrome.storage.sync.get('domains', ({ domains }) => {
  if (!domains) return;
  const matched = domains.some(d => hostname === d || hostname.endsWith('.' + d));
  if (!matched) return;
  walkTextNodes(document.body);
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) walkTextNodes(node);
        else if (node.nodeType === Node.TEXT_NODE) processTextNode(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
