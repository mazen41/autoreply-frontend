// Website Chat Widget Script
// This script can be embedded on any website to add live chat functionality

(function() {
  // Configuration
  const WIDGET_CONFIG = {
    businessId: window.NAZ_BUSINESS_ID || 'your-business-id',
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    greeting: 'Hello! How can we help you today?',
    showWhenOnline: true,
  };

  // Create widget styles
  const styles = `
    .naz-chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .naz-chat-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${WIDGET_CONFIG.primaryColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    
    .naz-chat-button:hover {
      transform: scale(1.05);
    }
    
    .naz-chat-button svg {
      width: 30px;
      height: 30px;
      fill: white;
    }
    
    .naz-chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    
    .naz-chat-window.open {
      display: flex;
    }
    
    .naz-chat-header {
      background: ${WIDGET_CONFIG.primaryColor};
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .naz-chat-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .naz-chat-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
    }
    
    .naz-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9fafb;
    }
    
    .naz-chat-message {
      margin-bottom: 12px;
      max-width: 80%;
    }
    
    .naz-chat-message.sent {
      margin-left: auto;
    }
    
    .naz-chat-message-bubble {
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .naz-chat-message.received .naz-chat-message-bubble {
      background: white;
      border: 1px solid #e5e7eb;
      border-bottom-left-radius: 2px;
    }
    
    .naz-chat-message.sent .naz-chat-message-bubble {
      background: ${WIDGET_CONFIG.primaryColor};
      color: white;
      border-bottom-right-radius: 2px;
    }
    
    .naz-chat-input-area {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }
    
    .naz-chat-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      font-size: 14px;
      outline: none;
    }
    
    .naz-chat-input:focus {
      border-color: ${WIDGET_CONFIG.primaryColor};
    }
    
    .naz-chat-send {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${WIDGET_CONFIG.primaryColor};
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .naz-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .naz-chat-greeting {
      padding: 16px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      color: #374151;
    }
  `;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create widget HTML
  const widgetContainer = document.createElement('div');
  widgetContainer.className = 'naz-chat-widget';
  widgetContainer.innerHTML = `
    <div class="naz-chat-window" id="nazChatWindow">
      <div class="naz-chat-header">
        <h3>Chat with us</h3>
        <button class="naz-chat-close" id="nazChatClose">&times;</button>
      </div>
      <div class="naz-chat-greeting">${WIDGET_CONFIG.greeting}</div>
      <div class="naz-chat-messages" id="nazChatMessages"></div>
      <div class="naz-chat-input-area">
        <input type="text" class="naz-chat-input" id="nazChatInput" placeholder="Type a message..." />
        <button class="naz-chat-send" id="nazChatSend">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
    <button class="naz-chat-button" id="nazChatButton">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </button>
  `;
  document.body.appendChild(widgetContainer);

  // Widget functionality
  const chatWindow = document.getElementById('nazChatWindow');
  const chatButton = document.getElementById('nazChatButton');
  const chatClose = document.getElementById('nazChatClose');
  const chatInput = document.getElementById('nazChatInput');
  const chatSend = document.getElementById('nazChatSend');
  const chatMessages = document.getElementById('nazChatMessages');

  let sessionId = null;
  let messages = [];

  // Generate session ID
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Toggle chat window
  chatButton.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
    if (!sessionId) {
      sessionId = generateSessionId();
      // Initialize session with backend
      initializeSession();
    }
  });

  chatClose.addEventListener('click', () => {
    chatWindow.classList.remove('open');
  });

  // Initialize session
  async function initializeSession() {
    try {
      const response = await fetch('/api/web-chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: WIDGET_CONFIG.businessId,
          session_id: sessionId,
          page_url: window.location.href,
        }),
      });
      const data = await response.json();
      console.log('Session initialized:', data);
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  // Send message
  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add message to UI
    addMessage(message, 'sent');
    chatInput.value = '';

    try {
      const response = await fetch('/api/web-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: message,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        // Wait for response via WebSocket or polling
        pollForMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('Failed to send message. Please try again.', 'received');
    }
  }

  // Add message to UI
  function addMessage(content, direction) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `naz-chat-message ${direction}`;
    messageDiv.innerHTML = `
      <div class="naz-chat-message-bubble">${content}</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Poll for new messages
  async function pollForMessages() {
    try {
      const response = await fetch(`/api/web-chat/sessions/${sessionId}/messages`);
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach((msg) => {
          if (!messages.includes(msg.id)) {
            addMessage(msg.content, 'received');
            messages.push(msg.id);
          }
        });
      }
    } catch (error) {
      console.error('Failed to poll for messages:', error);
    }
  }

  // Event listeners
  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Poll for messages every 3 seconds when chat is open
  setInterval(() => {
    if (chatWindow.classList.contains('open')) {
      pollForMessages();
    }
  }, 3000);

  console.log('Naz Chat Widget initialized');
})();
