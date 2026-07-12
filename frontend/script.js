document.addEventListener('DOMContentLoaded', function () {

  const chatMessages = document.getElementById('chatMessages');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const newChatBtn = document.getElementById('newChatBtn');

  const AFFILIATE_TAG = 'pcbuilderai0f-21';

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
      const response = await fetch('https://xen-backend.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory })
      });

      const data = await response.json();
      const reply = data.reply;

      removeTypingIndicator(typingId);

      if (reply.includes('---BUILD READY---')) {
        renderBuildCard(reply);
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

  // ─── Extract clean product name from a component line ───
  // Input example:  "CPU: AMD Ryzen 9 7950X - $699 - Great for multitasking"
  // Output:         "AMD Ryzen 9 7950X"
  function extractProductName(componentLine) {
    // Step 1: Remove the label like "CPU:" or "GPU:" from the start
    let afterLabel = componentLine;
    const colonPos = componentLine.indexOf(':');
    if (colonPos !== -1) {
      afterLabel = componentLine.substring(colonPos + 1).trim();
    }

    // Step 2: Split by " - " and take only the first part = product name
    const parts = afterLabel.split(' - ');
    const productName = parts[0].trim();

    return productName;
  }

  function buildAffiliateUrl(componentLine) {
    const productName = extractProductName(componentLine);
    const searchQuery = encodeURIComponent(productName);
    return `https://www.amazon.in/s?k=${searchQuery}&tag=${AFFILIATE_TAG}`;
  }

  function renderBuildCard(text) {
    const buildStart = text.indexOf('---BUILD READY---');
    const buildEnd = text.indexOf('---END BUILD---');

    const beforeBuild = text.substring(0, buildStart).trim();
    const buildText = text.substring(buildStart + 17, buildEnd).trim();
    const afterBuild = text.substring(buildEnd + 15).trim();

    if (beforeBuild) {
      const div = document.createElement('div');
      div.classList.add('message', 'bot');
      div.textContent = beforeBuild;
      chatMessages.appendChild(div);
    }

    // Parse component lines, total, and summary
    const lines = buildText.split('\n').filter(line => line.trim() !== '');
    const components = [];
    let total = '';
    let summary = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('TOTAL:')) {
        total = trimmed.replace('TOTAL:', '').trim();
      } else if (trimmed.startsWith('SUMMARY:')) {
        summary = trimmed.replace('SUMMARY:', '').trim();
      } else if (trimmed.length > 0) {
        components.push(trimmed);
      }
    });

    // Build share text for copy button
   function buildShareText() {
      let shareText = '';
      shareText += 'My PC Build from XENRON.AI\n';
      shareText += '================================\n\n';
      components.forEach(comp => {
        const colonPos = comp.indexOf(':');
        const label = colonPos !== -1 ? comp.substring(0, colonPos).trim() : '';
        const rest = colonPos !== -1 ? comp.substring(colonPos + 1).trim() : comp;
        const namePart = rest.split(' - ')[0].trim();
        const pricePart = rest.split(' - ')[1] ? rest.split(' - ')[1].trim() : '';
        shareText += `${label}\n`;
        shareText += `${namePart} — ${pricePart}\n\n`;
      });
      shareText += '================================\n';
      shareText += `Total: ${total}\n\n`;
      shareText += 'Built with XENRON.AI';
      return shareText;
    }

    const cardId = 'card-' + Date.now();

    // Build component rows HTML
    const componentsHTML = components.map(comp => {
      const colonPos = comp.indexOf(':');
      const label = colonPos !== -1 ? comp.substring(0, colonPos).trim() : '';
      const rest = colonPos !== -1 ? comp.substring(colonPos + 1).trim() : comp;
      const parts = rest.split(' - ');
      const name = parts[0] ? parts[0].trim() : '';
      const price = parts[1] ? parts[1].trim() : '';
      const reason = parts[2] ? parts[2].trim() : '';
      const affiliateUrl = buildAffiliateUrl(comp);

      return `
        <div class="component-row">
          <div class="component-left">
            <span class="component-label">${label}</span>
            <span class="component-name">${name}</span>
            <span class="component-reason">${reason}</span>
          </div>
          <div class="component-right">
            <span class="component-price">${price}</span>
            <a href="${affiliateUrl}" target="_blank" class="buy-btn">
              Buy on Amazon
            </a>
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
    <span class="build-total">${total}</span>
    <span class="price-note">⚠️ Prices are estimates — click Buy to see live Amazon price</span>
  </div>
</div>
      <div class="build-components">
        ${componentsHTML}
      </div>
      <div class="build-summary">
        <p>${summary}</p>
      </div>
      <div class="build-actions">
        <button class="copy-btn" id="copyBtn-${cardId}">
          📋 Copy Build
        </button>
        <a class="whatsapp-btn" id="waBtn-${cardId}" href="#" target="_blank">
          📤 Share on WhatsApp
        </a>
        <span class="share-confirm" id="shareConfirm-${cardId}">✅ Copied!</span>
      </div>
    `;

    chatMessages.appendChild(card);

    // Copy button
    document.getElementById(`copyBtn-${cardId}`).addEventListener('click', function () {
      navigator.clipboard.writeText(buildShareText()).then(() => {
        const msg = document.getElementById(`shareConfirm-${cardId}`);
        msg.style.display = 'inline';
        setTimeout(() => msg.style.display = 'none', 3000);
      });
    });

    // WhatsApp share button
    const waUrl = `https://wa.me/?text=${encodeURIComponent(buildShareText())}`;
    document.getElementById(`waBtn-${cardId}`).href = waUrl;

    if (afterBuild) {
      const div = document.createElement('div');
      div.classList.add('message', 'bot');
      div.textContent = afterBuild;
      chatMessages.appendChild(div);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

});