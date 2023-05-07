const token = localStorage.getItem('token');
let group_id;

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
console.log(decodedToken)
// Connect to the WebSocket server
const socket = io("ws://localhost:3000");

// Display the current user's username on the page
const usernameElement = document.getElementById('username');
usernameElement.textContent = `Logged in as ${username}`;

// Send a login event to the server with the current user's username
socket.emit('login', { username });
console.log(username)

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

const groupsButton = document.getElementById('groups-button');
const groupList = document.getElementById('group-list');

async function displayMessages(groupId) {
  const chatInterface = document.getElementById('message-container');
  // Clear the existing chat interface
  chatInterface.innerHTML = '';
  
  try {
    const response = await axios.get(`/messages/groups/${groupId}/messages`);
    const messages = response.data.data;
    group_id = groupId;
    console.log(group_id)
    // Render the messages in the chat interface
    messages.forEach(message => {
      const messageElement = document.createElement('div');
      const messageText = `${message.username}: ${message.text}`;
      messageElement.textContent = messageText;
      chatInterface.appendChild(messageElement);
    });
  } catch (error) {
    console.error(error);
  }
}

  groupList.addEventListener('click', async (event) => {
    if (event.target.tagName === 'LI') {
      const groupId = event.target.dataset.groupId;
      
      displayMessages(groupId);
    }
  });

  console.log(group_id);

// Send a chat message to the server when the message form is submitted
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('msg');

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = messageInput.value;
  console.log(group_id)
  socket.emit('chat message', { text: message, username: username, group_id: group_id });
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

const newGroup = document.getElementById('new-group');
const createNewGroup = document.getElementById('createNewGroup');
const createGroupForm = document.getElementById('create-group-form')

newGroup.addEventListener('click', async(e) => {
  createGroupForm.style.display = 'block';

  axios.get('/user/get') // Replace with the URL of your user endpoint
    .then(response => response.data)
    .then(users => {
      const membersSelect = document.getElementById('members-list');
      users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.text = user.name;
        membersSelect.appendChild(option);
      });
    });
})

// Create a new group
async function createGroup(groupName, members) {
  const userId = decodedToken.userId;
  const response = await axios.post('/messages/groups', {
    name: groupName,
    members: members,
    creatorId: userId
  });
  alert('Group created successfully!');
}

createNewGroup.addEventListener('submit', async(e) => {
  e.preventDefault();
  const groupName = document.getElementById('group-name').value;
  
  const membersList = document.getElementById('members-list');
  const members = Array.from(membersList.options)
  .filter(option => option.selected)
  .map(option => option.textContent);
  const newGroup = await createGroup(groupName, members);
  
})

// Get a list of all groups the user is a member of
async function getUserGroups(userId) {
  try {
    const response = await axios.get(`/messages/users/${userId}/groups`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

groupsButton.addEventListener('click', async () => {
  const userId = decodedToken.userId; // Replace this with the actual logic to get the user ID

  const groups = await getUserGroups(userId);
  console.log(groups)
  // Clear the existing list
  groupList.innerHTML = '';

  // Create a list item for each group and append it to the list
  groups.data.forEach(group => {
    const listItem = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.textContent = group.name;
    anchor.href = "javascript:void(0);";
    
    // Add a click event listener to each group
    anchor.addEventListener('click', () => {
      displayMessages(group.id);
    });
    
    listItem.appendChild(anchor);
    groupList.appendChild(listItem);
  });
  
  // Show the list
  groupList.style.display = 'block';
});


