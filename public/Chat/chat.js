const token = localStorage.getItem('token');

// Decode the token to get the user information
function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(
    window.atob(base64)
      .split('')
      .map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  return JSON.parse(jsonPayload);
}

// Get the username from the decoded token
const decodedToken = parseJwt(token);
const username = decodedToken.name;

// Connect to the WebSocket server
const socket = io("ws://localhost:3000");

// Display the current user's username on the page
const usernameElement = document.getElementById('username');
usernameElement.textContent = `Logged in as ${username}`;

// Send a login event to the server with the current user's username
socket.emit('login', { username });

// Display the list of users on the page
const userListElement = document.getElementById('user-list');

function updateUserList(users) {
  userListElement.innerHTML = '';
  Object.values(users).forEach((user) => {
    const userElement = document.createElement('div');
    userElement.textContent = user.username;
    userListElement.appendChild(userElement);
    console.log(users)
  });
}

// Update the user list when a user logs in or logs out
socket.on('user list', (users) => {
  updateUserList(users);
});

// Update the user list when a user joins the chat
socket.on('user connected', (user) => {
  console.log(user)
  const messageElement = document.createElement('div');
  messageElement.innerText = user;
  const messageContainer = document.querySelector('#message-container');
  if (messageContainer) {
    messageContainer.appendChild(messageElement);
  }
  updateUserList(userListElement.children);
});

// Update the user list when a user leaves the chat
socket.on('user disconnected', (user) => {
  const messageElement = document.createElement('div');
  messageElement.innerText = user;
  const messageContainer = document.querySelector('#message-container');
  if (messageContainer) {
    messageContainer.appendChild(messageElement);
  }
  updateUserList(userListElement.children);
});

// Send a chat message to the server when the message form is submitted
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('msg');

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = messageInput.value;
  socket.emit('chat message', { text: message, username: username });
  messageInput.value = '';
});

// Display chat messages received from the server
socket.on('chat message', (data) => {
  const messageElement = document.createElement('div');
  messageElement.innerText = `${data.username}: ${data.text}`;
  const messageContainer = document.querySelector('#message-container');
  if (messageContainer) {
    messageContainer.appendChild(messageElement);
  }
});

// Log out the user when the logout button is clicked
const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', () => {
  window.location.href = '/user/logout';
});
