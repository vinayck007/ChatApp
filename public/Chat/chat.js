const token = localStorage.getItem('token');

// Decode the token to get the user information
function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

  const decodedToken = parseJwt(token)

  // Get the username from the decoded token
  const username = decodedToken.name;
  const userListContainer = document.getElementById('user-list');
  // Connect to the WebSocket server
  const socket = io("ws://localhost:3000");

// // Listen for the 'user connected' event and add the new user to the list
socket.on('user connected', (data) => {
  const messageContainer = document.querySelector('#message-container');
  const message = document.createElement('div');
  message.classList.add('join-message');
  message.textContent = `${data.username} has joined the chat`;
  messageContainer.appendChild(message);
});

const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('msg');

// When the message form is submitted
messageForm.addEventListener('submit', (event) => {
  event.preventDefault(); // prevent the form from submitting

  // Get the message text
  const message = messageInput.value;

  // Send the message to the server
  socket.emit('chat message', { text: message, username: username });

  // Clear the input field
  messageInput.value = '';
});

socket.on('chat message', (data) => {
  const messageElement = document.createElement('div');
  messageElement.innerText = `${data.username}: ${data.text}`;
  const messageContainer = document.querySelector('#message-container');
if (messageContainer) {
  messageContainer.appendChild(messageElement);
}
});

// socket.emit('login', username);

const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', () => {
  // Perform logout actions here
  // For example, redirect to the login page
  window.location.href = '/user/login';
});
