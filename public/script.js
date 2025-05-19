// Global variables
let username = '';
let userAvatar = {
    color: '#4f46e5',
    initials: ''
};
let userStatus = 'online';
const sampleUsers = [];
const sampleMessages = [];

// DOM elements - existing elements
const connectionStatus = document.getElementById('connection-status');
const connectionText = document.getElementById('connection-text');
const userList = document.getElementById('user-list');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

// New DOM elements for modals
const loginModal = document.getElementById('login-modal');
const usernameInput = document.getElementById('username-input');
const joinChatBtn = document.getElementById('join-chat-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.querySelector('.settings-btn');
const closeSettingsBtn = document.querySelector('.close-modal-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
const settingsUsername = document.getElementById('settings-username');
const avatarPreview = document.getElementById('avatar-preview');
const searchInput = document.querySelector('.search-input');
const chatSounds = {
    message: new Audio('asset/message.mp3'), // Tecnología meme voice
    notification: new Audio('asset/ting.mp3'), // Simple notification sound
    connect: new Audio('asset/connection.mp3') // "Connected" voice or similar tone
};


// Lower the volume
Object.values(chatSounds).forEach(sound => {
    sound.volume = 0.3;
});

// Format time helper
function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
}

// Show notification
function showNotification(title, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-header">
            <h4 class="notification-title">${title}</h4>
            <button class="notification-close"><i class="fa-solid fa-times"></i></button>
        </div>
        <div class="notification-message">${message}</div>
    `;

    // Add to DOM
    document.body.appendChild(notification);

    chatSounds.notification.play().catch(e => console.log('Sound play failed:', e));

    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('active');
    }, 10);

    // Set auto-dismiss
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);

    // Handle close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('active');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

// Get user initials from name
function getInitials(name) {
    return name.split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Update avatar preview
function updateAvatarPreview() {
    avatarPreview.style.backgroundColor = userAvatar.color;
    avatarPreview.textContent = userAvatar.initials;
}

// Render users list
function renderUsers(users) {
    userList.innerHTML = '';

    // Update active count
    const activeCount = document.querySelector('.active-count');
    if (activeCount) {
        activeCount.textContent = users.length;
    }

    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user';

        // Create user avatar with initials
        const initials = user.initials || getInitials(user.name);

        userElement.innerHTML = `
            <div class="user-avatar" style="background-color: ${user.avatarColor || '#4f46e5'}">${initials}</div>
            <div class="user-info">
              <div class="user-name">${user.name}</div>
              <div class="user-status">
                <div class="user-status-dot" style="background-color: ${user.status === 'online' ? 'var(--success)' : 'var(--warning)'}"></div>
                ${user.status === 'online' ? 'Online' : 'Away'}
              </div>
            </div>
        `;

        userList.appendChild(userElement);
    });
}

// Search users
function searchUsers(query) {
    const users = document.querySelectorAll('.user');
    if (!query) {
        users.forEach(user => {
            user.style.display = 'flex';
        });
        return;
    }

    query = query.toLowerCase();
    users.forEach(user => {
        const username = user.querySelector('.user-name').textContent.toLowerCase();
        if (username.includes(query)) {
            user.style.display = 'flex';
        } else {
            user.style.display = 'none';
        }
    });
}

// Render messages
function renderMessages() {
    // First clear everything except the date divider
    const dateDiv = document.createElement('div');
    dateDiv.className = 'date-divider';
    dateDiv.innerHTML = '<span>Today</span>';

    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(dateDiv);

    // Add all messages with message IDs
    sampleMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type}`;
        messageElement.setAttribute('data-message-id', message.id);

        messageElement.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-info">
              ${message.type === 'incoming' ? `<span class="message-sender">${message.sender}</span>` : ''}
              <span class="message-time">${message.time}</span>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
    });

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message function
function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    console.log('Sending message:', content);

    // Generate a unique ID for the message
    const messageId = `${socket.id}-${Date.now()}`;

    // Clear input immediately
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // CHOOSE EITHER OPTION 1 OR OPTION 2:

    // OPTION 1: Server-driven approach - RECOMMENDED
    // Just send to server and let the server response handle UI updates
    socket.emit('chat message', {
        id: messageId,
        content: content,
        timestamp: new Date().toISOString()
    });
}

// Setup event listeners
function setupEventListeners() {
    // Handle send button click
    sendBtn.addEventListener('click', sendMessage);

    // Handle Enter key press (but allow Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea as user types
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';

        // Emit typing event to server
        socket.emit('typing');
    });

    // Login form handling
    joinChatBtn.addEventListener('click', handleLogin);
    usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    // Color selection in login modal
    document.querySelectorAll('#login-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            document.querySelectorAll('#login-modal .color-option').forEach(opt => {
                opt.classList.remove('selected');
            });

            // Add selected class to clicked option
            option.classList.add('selected');
            userAvatar.color = option.dataset.color;
        });
    });

    // Settings modal
    settingsBtn.addEventListener('click', () => {
        // Populate settings form with current values
        settingsUsername.value = username;

        // Select current color
        document.querySelectorAll('#settings-modal .color-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === userAvatar.color) {
                option.classList.add('selected');
            }
        });

        // Select current status
        document.querySelectorAll('#settings-modal .status-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.status === userStatus) {
                option.classList.add('selected');
            }
        });

        // Update avatar preview
        updateAvatarPreview();

        // Show modal
        settingsModal.classList.add('active');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    cancelSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    // Color selection in settings modal
    document.querySelectorAll('#settings-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            document.querySelectorAll('#settings-modal .color-option').forEach(opt => {
                opt.classList.remove('selected');
            });

            // Add selected class to clicked option
            option.classList.add('selected');
            userAvatar.color = option.dataset.color;
            updateAvatarPreview();
        });
    });

    // Status selection
    document.querySelectorAll('#settings-modal .status-option').forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            document.querySelectorAll('#settings-modal .status-option').forEach(opt => {
                opt.classList.remove('selected');
            });

            // Add selected class to clicked option
            option.classList.add('selected');
            userStatus = option.dataset.status;
        });
    });

    // Save settings
    saveSettingsBtn.addEventListener('click', () => {
        const newUsername = settingsUsername.value.trim();
        if (!newUsername) {
            showNotification('Error', 'Username cannot be empty');
            return;
        }

        // Update user info
        username = newUsername;
        userAvatar.initials = getInitials(username);

        // Update current user display
        document.querySelector('.current-user-avatar').textContent = userAvatar.initials;
        document.querySelector('.current-user-info h3').textContent = username;

        // Send updated info to server
        socket.emit('user_connected', {
            name: username,
            status: userStatus,
            initials: userAvatar.initials,
            avatarColor: userAvatar.color
        });

        // Close modal
        settingsModal.classList.remove('active');

        showNotification('Success', 'Profile updated successfully');
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        searchUsers(e.target.value);
    });

    // Mobile menu toggle functionality
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const mobileOverlay = document.getElementById('mobile-overlay');
  
  if (mobileToggle && sidebar && mobileOverlay) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      mobileOverlay.classList.toggle('active');
    });
    
    mobileOverlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      mobileOverlay.classList.remove('active');
    });
    
    // Close sidebar when a user is clicked (on mobile)
    document.querySelectorAll('.user').forEach(user => {
      user.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
          mobileOverlay.classList.remove('active');
        }
      });
    });
  }
}

// Add responsive check on window resize
window.addEventListener('resize', () => {
  const sidebar = document.querySelector('.sidebar');
  const mobileOverlay = document.getElementById('mobile-overlay');
  
  if (window.innerWidth > 768) {
    sidebar.classList.remove('active');
    mobileOverlay.classList.remove('active');
  }
});

// Handle login
function handleLogin() {
    const enteredName = usernameInput.value.trim();

    if (!enteredName) {
        // Show error on empty name
        usernameInput.classList.add('error');
        return;
    }

    // Set username and initials
    username = enteredName;
    userAvatar.initials = getInitials(username);

    // Get selected color
    const selectedColor = document.querySelector('#login-modal .color-option.selected');
    if (selectedColor) {
        userAvatar.color = selectedColor.dataset.color;
    }

    // Update current user display in sidebar
    document.querySelector('.current-user-avatar').textContent = userAvatar.initials;
    document.querySelector('.current-user-info h3').textContent = username;

    // Hide login modal
    loginModal.classList.remove('active');

    // Connect to socket server
    connectToSocketServer();
}

// SOCKET.IO INTEGRATION
let socket;

function connectToSocketServer() {
    // socket = io('http://localhost:3000');
    socket = io();

    // Typing indicator timeout variable
    let typingTimeout;

    // Connection events
    socket.on('connect', () => {
        console.log('Socket.io connected!');
        connectionStatus.classList.add('connected');
        connectionText.textContent = 'Connected';

        chatSounds.connect.play().catch(e => console.log('Sound play failed:', e));

        // Send user info to server
        socket.emit('user_connected', {
            name: username,
            status: userStatus,
            initials: userAvatar.initials,
            avatarColor: userAvatar.color
        });

        // Show welcome notification
        showNotification('Connected', 'Welcome to ChatConnect!');
    });

    socket.on('disconnect', () => {
        console.log('Socket.io disconnected!');
        connectionStatus.classList.remove('connected');
        connectionText.textContent = 'Disconnected';

        showNotification('Disconnected', 'Connection to server lost. Trying to reconnect...');
    });

    socket.on('connect_error', () => {
        console.log('Connection error');
        connectionStatus.classList.remove('connected');
        connectionText.textContent = 'Connection Error';

        showNotification('Error', 'Failed to connect to server. Please try again later.');
    });

    // When receiving user list from server
    socket.on('user_list', (users) => {
        console.log('Received user list:', users);
        renderUsers(users);
    });

    // Receive messages from server
    socket.on('chat_message', (message) => {
        console.log('Received message from server:', message);
    
        // Check if the message already exists in our array (by ID)
        const existingMsg = sampleMessages.find(msg => msg.id === message.id);
    
        if (existingMsg) {
            console.log('Message already exists, updating:', message.id);
            // Update the existing message instead of adding a duplicate
            existingMsg.pending = false;
            existingMsg.sender = message.sender;
            existingMsg.content = message.content;
            existingMsg.time = formatTime(new Date(message.timestamp));
            
            // Find and update the existing message in the DOM
            const existingElement = document.querySelector(`[data-message-id="${message.id}"]`);
            if (existingElement) {
                existingElement.querySelector('.message-content').textContent = message.content;
                existingElement.querySelector('.message-time').textContent = 
                    formatTime(new Date(message.timestamp));
                return; // No need to render all messages
            }
        } else {
            console.log('New message, adding:', message.id);
            // Add the new message to the array
            const newMsg = {
                id: message.id,
                sender: message.sender,
                content: message.content,
                time: formatTime(new Date(message.timestamp)),
                type: message.sender === username ? 'outgoing' : 'incoming'
            };
            sampleMessages.push(newMsg);
            
            // Play sound only for incoming messages from others
            if (message.sender !== username) {
                chatSounds.message.play().catch(e => console.log('Sound play failed:', e));
            }
            
            // Add just the new message to the DOM
            addSingleMessageToDOM(newMsg);
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            return; // No need to render all messages
        }
        
        // Only do a full render if we couldn't handle it incrementally
        renderMessages();
    });

    // Handle typing events
    socket.on('user_typing', (user) => {
        console.log('User typing:', user);
        typingIndicator.innerHTML = `${user.name} is typing<span class="loading-dots"><span></span><span></span><span></span></span>`;
        typingIndicator.classList.add('active');

        // Hide after a delay
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            typingIndicator.classList.remove('active');
        }, 3000);
    });
}

function addSingleMessageToDOM(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.type}`;
    messageElement.setAttribute('data-message-id', message.id);
    
    messageElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-info">
          ${message.type === 'incoming' ? `<span class="message-sender">${message.sender}</span>` : ''}
          <span class="message-time">${message.time}</span>
        </div>
    `;
    
    // Add it to the container
    messagesContainer.appendChild(messageElement);
}

// Initialize application
function init() {
    // Show login modal
    loginModal.classList.add('active');

    // Pre-select first color option
    const firstColorOption = document.querySelector('#login-modal .color-option');
    if (firstColorOption) {
        firstColorOption.classList.add('selected');
        userAvatar.color = firstColorOption.dataset.color;
    }

    // Focus username input
    setTimeout(() => {
        usernameInput.focus();
    }, 300);

    setupEventListeners();
}

// Initialize everything after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
});