/**
 * Cloud Cafe PH — AI Chat Widget
 * Talks to the Django /chat/ proxy view, which forwards to the
 * enterprise-ai-agent Lambda (Amazon Bedrock Nova Lite).
 */
(function () {
  'use strict';

  // ── DOM refs ──────────────────────────────────────────────────────
  const fab         = document.getElementById('chat-fab');
  const panel       = document.getElementById('chat-panel');
  const closeBtn    = document.getElementById('chat-close-btn');
  const messages    = document.getElementById('chat-messages');
  const input       = document.getElementById('chat-input');
  const sendBtn     = document.getElementById('chat-send-btn');
  const badge       = document.getElementById('chat-fab-badge');
  const suggestions = document.getElementById('chat-suggestions');

  if (!fab || !panel) return; // widget not present on page

  // ── State ─────────────────────────────────────────────────────────
  let isOpen    = false;
  let isBusy    = false;
  let hasOpened = false; // track first open for welcome message

  // ── CSRF token (required by Django's CsrfViewMiddleware) ──────────
  function getCsrfToken() {
    // Prefer the token injected directly from the Django template (most reliable)
    if (typeof CSRF_TOKEN !== 'undefined' && CSRF_TOKEN) return CSRF_TOKEN;
    // Fallback: read from cookie
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
  }

  // ── Open / close ──────────────────────────────────────────────────
  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    fab.setAttribute('aria-expanded', 'true');
    badge.classList.remove('visible');
    input.focus();

    if (!hasOpened) {
      hasOpened = true;
      appendBotMessage(
        "Hi! I'm Brew, your Cloud Cafe PH assistant ☕\n" +
        "Ask me anything about our menu, the café, or our policies!"
      );
    }
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }

  fab.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closePanel();
  });

  // ── Suggested questions ───────────────────────────────────────────
  if (suggestions) {
    suggestions.querySelectorAll('.chat-suggestion-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = btn.textContent.trim();
        suggestions.style.display = 'none'; // hide suggestions after first use
        sendQuestion(q);
      });
    });
  }

  // ── Send on button click or Enter (Shift+Enter = newline) ─────────
  sendBtn.addEventListener('click', handleSend);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  function handleSend() {
    const q = input.value.trim();
    if (!q || isBusy) return;
    input.value = '';
    input.style.height = 'auto';
    if (suggestions) suggestions.style.display = 'none';
    sendQuestion(q);
  }

  // ── Core: send question → proxy → Lambda → render answer ─────────
  function sendQuestion(question) {
    if (isBusy) return;

    appendUserMessage(question);
    setBusy(true);
    const typingEl = appendTypingIndicator();

    fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
      },
      body: JSON.stringify({ question }),
    })
      .then((res) => res.json().then((data) => ({ status: res.status, data })))
      .then(({ status, data }) => {
        removeElement(typingEl);
        if (status === 200 && data.answer) {
          appendBotMessage(data.answer);
        } else {
          appendErrorMessage(
            data.error || 'Something went wrong. Please try again.'
          );
        }
      })
      .catch(() => {
        removeElement(typingEl);
        appendErrorMessage(
          'Could not reach the server. Check your connection and try again.'
        );
      })
      .finally(() => setBusy(false));
  }

  // ── Message rendering helpers ──────────────────────────────────────
  function nowTime() {
    return new Date().toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function appendUserMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg user';
    wrapper.innerHTML = `
      <div class="chat-bubble">${escapeHtml(text)}</div>
      <span class="chat-msg-time">${nowTime()}</span>
    `;
    messages.appendChild(wrapper);
    scrollToBottom();
  }

  function appendBotMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg bot';
    wrapper.innerHTML = `
      <div class="chat-bubble">${formatBotText(text)}</div>
      <span class="chat-msg-time">${nowTime()}</span>
    `;
    messages.appendChild(wrapper);
    scrollToBottom();

    // Show badge on FAB if panel is closed
    if (!isOpen) badge.classList.add('visible');
  }

  function appendErrorMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg bot';
    wrapper.innerHTML = `
      <div class="chat-bubble chat-error-bubble">${escapeHtml(text)}</div>
    `;
    messages.appendChild(wrapper);
    scrollToBottom();
  }

  function appendTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg bot chat-typing';
    wrapper.setAttribute('aria-label', 'Brew is typing');
    wrapper.innerHTML = `
      <div class="chat-bubble">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;
    messages.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  function removeElement(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  // ── Busy state (disables input while waiting for Lambda) ──────────
  function setBusy(busy) {
    isBusy = busy;
    sendBtn.disabled = busy;
    input.disabled   = busy;
    input.placeholder = busy ? 'Brew is thinking...' : 'Ask me anything…';
  }

  // ── Helpers ────────────────────────────────────────────────────────
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Convert plain text line breaks and basic markdown-like bold to HTML
  function formatBotText(text) {
    return escapeHtml(text)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
})();
