/**
 * Cloud Cafe PH — AI Chat Widget
 * Talks to the Django /chat/ proxy view, which forwards to the
 * enterprise-ai-agent Lambda (Amazon Bedrock Nova Lite).
 * Chat history is persisted in localStorage so it survives page refreshes.
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

  // ── localStorage key & max history ───────────────────────────────
  const STORAGE_KEY  = 'cloudcafe_chat_history';
  const MAX_MESSAGES = 100; // cap stored messages to avoid bloat

  // ── State ─────────────────────────────────────────────────────────
  let isOpen = false;
  let isBusy = false;

  // ── Persist & restore history ─────────────────────────────────────
  /**
   * history entry shape:
   * { role: 'bot'|'user'|'error', text: string, time: string }
   */
  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      // Keep only the most recent MAX_MESSAGES entries
      const trimmed = history.slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Render all stored messages on page load
  function restoreHistory() {
    const history = loadHistory();

    if (history.length === 0) {
      // First ever visit — show welcome message and suggestions
      const welcomeText =
        "Hi! I'm Brew, your Cloud Cafe PH assistant ☕\n" +
        "Ask me anything about our menu, the café, or our policies!";
      renderBotMessage(welcomeText);
      saveHistory([{ role: 'bot', text: welcomeText, time: nowTime() }]);
    } else {
      // Returning visit — rebuild messages from storage
      if (suggestions) suggestions.style.display = 'none';
      history.forEach((entry) => {
        if (entry.role === 'user')  renderUserMessage(entry.text, entry.time);
        else if (entry.role === 'bot')   renderBotMessage(entry.text, entry.time);
        else if (entry.role === 'error') renderErrorMessage(entry.text);
      });
    }

    scrollToBottom();
  }

  // ── CSRF token ────────────────────────────────────────────────────
  function getCsrfToken() {
    if (typeof CSRF_TOKEN !== 'undefined' && CSRF_TOKEN) return CSRF_TOKEN;
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
    scrollToBottom();
    input.focus();
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closePanel();
  });

  // ── Clear history button (injected into header) ───────────────────
  const clearBtn = document.createElement('button');
  clearBtn.className    = 'chat-close-btn';
  clearBtn.title        = 'Clear chat history';
  clearBtn.setAttribute('aria-label', 'Clear chat history');
  clearBtn.innerHTML    = '🗑';
  clearBtn.style.fontSize = '0.95rem';

  clearBtn.addEventListener('click', () => {
    clearHistory();
    messages.innerHTML = '';
    if (suggestions) suggestions.style.display = 'flex';
    const welcomeText =
      "Hi! I'm Brew, your Cloud Cafe PH assistant ☕\n" +
      "Ask me anything about our menu, the café, or our policies!";
    renderBotMessage(welcomeText);
    saveHistory([{ role: 'bot', text: welcomeText, time: nowTime() }]);
  });

  // Insert clear button before the close button
  closeBtn.parentNode.insertBefore(clearBtn, closeBtn);

  // ── Suggested questions ───────────────────────────────────────────
  if (suggestions) {
    suggestions.querySelectorAll('.chat-suggestion-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = btn.textContent.trim();
        suggestions.style.display = 'none';
        sendQuestion(q);
      });
    });
  }

  // ── Send on button click or Enter ─────────────────────────────────
  sendBtn.addEventListener('click', handleSend);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

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

  // ── Core: send question → proxy → Lambda → render + save ─────────
  function sendQuestion(question) {
    if (isBusy) return;

    const time = nowTime();
    renderUserMessage(question, time);
    appendToHistory({ role: 'user', text: question, time });

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
          const answerTime = nowTime();
          renderBotMessage(data.answer, answerTime);
          appendToHistory({ role: 'bot', text: data.answer, time: answerTime });
        } else {
          const errText = data.error || 'Something went wrong. Please try again.';
          renderErrorMessage(errText);
          appendToHistory({ role: 'error', text: errText, time: nowTime() });
        }
      })
      .catch(() => {
        removeElement(typingEl);
        const errText = 'Could not reach the server. Check your connection and try again.';
        renderErrorMessage(errText);
        appendToHistory({ role: 'error', text: errText, time: nowTime() });
      })
      .finally(() => setBusy(false));
  }

  // ── Append a single entry to stored history ───────────────────────
  function appendToHistory(entry) {
    const history = loadHistory();
    history.push(entry);
    saveHistory(history);
  }

  // ── Message rendering (pure DOM, no storage side-effects) ─────────
  function nowTime() {
    return new Date().toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderUserMessage(text, time) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg user';
    wrapper.innerHTML = `
      <div class="chat-bubble">${escapeHtml(text)}</div>
      <span class="chat-msg-time">${time || nowTime()}</span>
    `;
    messages.appendChild(wrapper);
    scrollToBottom();
  }

  function renderBotMessage(text, time) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg bot';
    wrapper.innerHTML = `
      <div class="chat-bubble">${formatBotText(text)}</div>
      <span class="chat-msg-time">${time || nowTime()}</span>
    `;
    messages.appendChild(wrapper);
    scrollToBottom();
    if (!isOpen) badge.classList.add('visible');
  }

  function renderErrorMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg bot';
    wrapper.innerHTML = `
      <div class="chat-bubble chat-error-bubble">${escapeHtml(text)}</div>
    `;
    messages.appendChild(wrapper);
    scrollToBottom();
  }

  // Keep old names as aliases so nothing else breaks
  const appendBotMessage   = renderBotMessage;
  const appendUserMessage  = renderUserMessage;
  const appendErrorMessage = renderErrorMessage;

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

  function setBusy(busy) {
    isBusy = busy;
    sendBtn.disabled  = busy;
    input.disabled    = busy;
    input.placeholder = busy ? 'Brew is thinking...' : 'Ask me anything…';
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatBotText(text) {
    return escapeHtml(text)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  // ── Init: restore history on every page load ──────────────────────
  restoreHistory();

})();
