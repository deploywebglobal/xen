document.addEventListener('DOMContentLoaded', function () {

  const chatMessages = document.getElementById('chatMessages');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const newChatBtn = document.getElementById('newChatBtn');

  const AFFILIATE_TAG = 'pcbuilderai0f-21';
  const BACKEND_URL = 'https://xen-backend.onrender.com/chat'; // update to your live Render URL

  let conversationHistory = [];

  startConversation();

  newChatBtn.addEventListener('click', function () {
    conversationHistory = [];
    chatMessages.innerHTML = '';
    startConversation();
  });

  sendBtn.addEventListener('click', handleSend);

  userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') handleSend();
  });

  function startConversation() {
    addMessage('bot', "Hi! 👋 I'm XEN, your PC Building Assistant by XENRON.AI. What will you mainly use this PC for? Gaming, Video Editing, Office Work, Programming, or something else?");
  }

  async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage('user', text);
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    conversationHistory.push({ role: 'user', content: text });

    const typingId = addTypingIndicator();

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory })
      });

      const data = await response.json();
      const reply = data.reply;

      removeTypingIndicator(typingId);

      // Look for a fenced ```json ... ``` block in the reply
      const jsonMatch = reply.match(/```json\s*([\s\S]*?)```/);

      if (jsonMatch) {
        try {
          const buildData = JSON.parse(jsonMatch[1]);
          const introText = reply.substring(0, jsonMatch.index).trim();
          renderBuildCard(buildData, introText);
        } catch (parseError) {
          console.error('Failed to parse build JSON:', parseError);
          addMessage('bot', reply); // fallback: show raw text so nothing is silently lost
        }
      } else {
        addMessage('bot', reply);
      }

      conversationHistory.push({ role: 'assistant', content: reply });

    } catch (error) {
      removeTypingIndicator(typingId);
      addMessage('bot', 'Sorry, something went wrong. Make sure your server is running.');
    } finally {
      userInput.disabled = false;
      sendBtn.disabled = false;
      userInput.focus();
    }
  }

  function addMessage(sender, text) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addTypingIndicator() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.classList.add('message', 'bot');
    div.id = id;
    div.textContent = 'Thinking...';
    div.style.opacity = '0.5';
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function renderBuildCard(data, introText) {
    if (introText) {
      const div = document.createElement('div');
      div.classList.add('message', 'bot');
      div.textContent = introText;
      chatMessages.appendChild(div);
    }

    const partKeys = ['cpu', 'gpu', 'ram', 'motherboard', 'storage', 'psu', 'case'];
    const labels = {
      cpu: 'CPU', gpu: 'GPU', ram: 'RAM', motherboard: 'MOTHERBOARD',
      storage: 'STORAGE', psu: 'PSU', case: 'CASE'
    };

    function buildShareText() {
      let shareText = 'My PC Build from XENRON.AI\n================================\n\n';
      partKeys.forEach(key => {
        const part = data[key];
        if (!part) return;
        shareText += `${labels[key]}\n${part.name} — ${part.price}\n\n`;
      });
      shareText += `================================\nTotal: ${data.total}\n\nBuilt with XENRON.AI`;
      return shareText;
    }

    const cardId = 'card-' + Date.now();

    const componentsHTML = partKeys.map(key => {
      const part = data[key];
      if (!part) return '';
      const searchQuery = encodeURIComponent(part.name);
      const affiliateUrl = `https://www.amazon.in/s?k=${searchQuery}&tag=${AFFILIATE_TAG}`;
      return `
        <div class="component-row">
          <div class="component-left">
            <span class="component-label">${labels[key]}</span>
            <span class="component-name">${part.name}</span>
            <span class="component-reason">${part.reason}</span>
          </div>
          <div class="component-right">
            <span class="component-price">${part.price}</span>
            <a href="${affiliateUrl}" target="_blank" class="buy-btn">Buy on Amazon</a>
          </div>
        </div>`;
    }).join('');

    const card = document.createElement('div');
    card.classList.add('build-card');
    card.innerHTML = `
      <div class="build-card-header">
        <span class="build-icon">🖥️</span>
        <div>
          <h3>Your Perfect PC Build</h3>
          <span class="build-total">${data.total}</span>
          <span class="price-note">⚠️ Prices are estimates — click Buy to see live Amazon price</span>
        </div>
      </div>
      <div class="build-components">${componentsHTML}</div>
      <div class="build-summary"><p>${data.summary}</p></div>
      <div class="build-actions">
        <button class="copy-btn" id="copyBtn-${cardId}">📋 Copy Build</button>
        <a class="whatsapp-btn" id="waBtn-${cardId}" href="#" target="_blank">📤 Share on WhatsApp</a>
        <span class="share-confirm" id="shareConfirm-${cardId}">✅ Copied!</span>
      </div>
    `;

    chatMessages.appendChild(card);

    document.getElementById(`copyBtn-${cardId}`).addEventListener('click', function () {
      navigator.clipboard.writeText(buildShareText()).then(() => {
        const msg = document.getElementById(`shareConfirm-${cardId}`);
        msg.style.display = 'inline';
        setTimeout(() => msg.style.display = 'none', 3000);
      });
    });

    const waUrl = `https://wa.me/?text=${encodeURIComponent(buildShareText())}`;
    document.getElementById(`waBtn-${cardId}`).href = waUrl;

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

});
