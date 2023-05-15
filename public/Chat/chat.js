

const token = localStorage.getItem('token');
let group_id, recipientId;

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
// Fetch online users on page load or at any desired trigger
fetchOnlineUsers();

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
const messageContainer = document.getElementById('message-container')

async function displayMessages(conversationId) {
  try {
    const response = await axios.get(`/messages/user/${conversationId}`);
    const messages = response.data.data;
    // Clear existing messages
    messageContainer.innerHTML = '';
    
    // Render the messages in the message container
    messages.forEach(message => {
      if (isInvitationLink(message)) {
        // Render the invitation link as HTML
        const messageElement = document.createElement('div');
        messageElement.innerHTML = message.text;
        messageContainer.appendChild(messageElement);

        const linkElement = messageElement.querySelector('a');

        messageElement.addEventListener('click', async (event) => {
          event.preventDefault(); // Prevent the default GET request behavior
        
            await axios.post(linkElement.href);

            await updateMembership(conversationId);
        })
          
        

      } else {
        // Render regular text messages
        const messageElement = document.createElement('div');
        messageElement.textContent = `${message.username}: ${message.text}`;
        messageContainer.appendChild(messageElement);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

async function updateMembership(conversationId) {
  try {
    const message = 'You have joined the group';
    // Send a request to the server to update the membership status
    socket.emit('chat message', { text: message, username: username, group_id: group_id, conversationId: conversationId });

    // Refresh the messages after updating the membership
    await displayMessages(conversationId);
  } catch (error) {
    console.error(error);
  }
}

function isInvitationLink(message) {
  const linkStartTag = '<a href="/messages/groups/invite/';
  const linkEndTag = '">Click here to accept</a>';
  return (
    message.text.startsWith("You have been invited to join the group") &&
    message.text.includes(linkStartTag) &&
    message.text.includes(linkEndTag)
  );
}



async function displayGroupMessages(groupId, groupName) {
  const chatInterface = document.getElementById('message-container');
  // Clear the existing chat interface
  chatInterface.innerHTML = '';
  const groupNameElement = document.getElementById('group-names');
  groupNameElement.innerHTML = `<strong>${groupName}</strong>`;
  
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

// Send a chat message to the server when the message form is submitted
let selectedGroupId = null; 
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('msg');

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const senderId = decodedToken.userId;
  const message = messageInput.value;
  
  const conversationId = generateConversationId(senderId, recipientId);
    socket.emit('chat message', { text: message, username: username, group_id: selectedGroupId, conversationId: conversationId });
    
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
logoutBtn.addEventListener('click', async () => {
  try {
    axios.post('/user/logout', null, {
      headers: {
        Authorization: token
      }
    })
  .then(response => {
    // Handle success response
    console.log(response.data);
    window.location.href = '../Login/login.html'
  })
  .catch(error => {
    // Handle error
    console.error(error);
  });
  } catch (error) {
    console.error('An error occurred during logout:', error);
  }
});

const newGroup = document.getElementById('new-group');
const createNewGroup = document.getElementById('createNewGroup');
const createGroupForm = document.getElementById('create-group-form')

newGroup.addEventListener('click', async(e) => {
  createGroupForm.style.display = 'block';

  axios.get('/user/get') 
    .then(response => {
      console.log(response.data);
      const users = response.data.data;
      const membersSelect = document.getElementById('members-list');
      users.forEach(user => {
        
        if (user.id !== decodedToken.userId) {
          const option = document.createElement('option');
          option.value = user.id;
          option.text = user.name;
          membersSelect.appendChild(option);
        }
      });
    });
});

// Create a new group
async function createGroup(groupName, members) {
  const userId = decodedToken.userId;
  const memberIds = members.map(member => member.id);
  const conversationIds = memberIds
  .filter(memberId => memberId !== userId) // Exclude the current user ID
  .map(memberId => generateConversationId(userId, memberId));
  memberIds.push(userId);
  console.log(groupName)
  await axios.post('/messages/groups', {
    name: groupName,
    creatorId: userId,
    conversationIds: conversationIds,
    memberIds: memberIds
  });

  alert('Group created successfully!');
}

createNewGroup.addEventListener('submit', async(e) => {
  e.preventDefault();
  const groupName = document.getElementById('group-name').value;
  
  const membersList = document.getElementById('members-list');
  const selectedOptions = Array.from(membersList.options).filter(option => option.selected);
  const members = selectedOptions.map(option => ({
    id: option.value,
    name: option.textContent
  }));
  console.log(groupName)
  await createGroup(groupName, members);
  
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
      selectedGroupId = group.id;
      socket.emit('joinGroupRoom', { groupId: group.id });
      
      displayGroupMessages(group.id, group.name); // Pass the group name to the displayGroupMessages function

    // const groupNameElement = document.getElementById('group-names');
    // groupNameElement.innerHTML = `<strong>${group.name}</strong>`;
    
  });
    
    listItem.appendChild(anchor);
    groupList.appendChild(listItem);
  });
  
  // Show the list
  groupList.style.display = 'block';
});

socket.on('connection', socket => {
  socket.on('joinGroupRoom', ({ groupId }) => {
    // Generate a room name specific to the group
    const groupRoom = `groupRoom_${groupId}`;
    console.log(groupRoom)
    // Join the room
    socket.join(groupRoom);
  });
});



// Assuming you have a side panel element with an ID 'online-users-panel' to display online users

const onlineUsersPanel = document.getElementById('online-users-panel');
const onlineUsersList = document.getElementById('online-users-list');

async function fetchOnlineUsers() {
  try {
    const response = await axios.get('/user/online');
    const onlineUsers = response.data.data;
    // Clear existing online users
    onlineUsersPanel.innerHTML = '';
    console.log(onlineUsers)
    // Render the online users in the side panel
    onlineUsers.forEach(user => {
      if (user.name !== username) {
        const userElement = document.createElement('li');
        userElement.textContent = user.name;
        userElement.dataset.id = user.id;
        userElement.addEventListener('click', (event) => {
          const clickedUserElement = event.target;
          
          // Find the clicked user based on the data-id attribute
          const clickedUserId = clickedUserElement.dataset.id;
          const clickedUser = onlineUsers.find(user => user.id === parseInt(clickedUserId));
          
          if (clickedUser) {
            recipientId = clickedUser.id;
            const senderId = decodedToken.userId;
            const conversationId = generateConversationId(senderId, recipientId);
            console.log(conversationId)
            displayMessages(conversationId);
          }
        });

        onlineUsersPanel.appendChild(userElement);

      }
    });
  } catch (error) {
    console.error(error);
  }
}

function generateConversationId(userId1, userId2) {
  const sortedUserIds = [userId1, userId2].sort();
  const conversationId = sortedUserIds.join('_');
  return conversationId;
}







