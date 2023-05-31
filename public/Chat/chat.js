
const token = localStorage.getItem('token');
let group_id, recipientId, isGroupChat=false;


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
      console.log(message)
      if (message.path) {
        // Render file messages
        const fileElement = document.createElement('div');
        const linkElement = document.createElement('a');
        linkElement.href = message.path;
        linkElement.textContent = message.name;
        console.log(message.name)
        fileElement.appendChild(linkElement);
        messageContainer.appendChild(fileElement);
      }
      else if (isInvitationLink(message)) {
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
      isGroupChat = true;
      displayMessages(groupId);
    }
  });

// Send a chat message to the server when the message form is submitted
let selectedGroupId = null; 
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('msg');

messageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const senderId = decodedToken.userId;
  const message = messageInput.value;

  const conversationId = generateConversationId(senderId, recipientId);
  if (!message.trim()) {
    // If the message is blank or contains only whitespace, do not send it
    return;
  }
  try {
    displayMessages(conversationId);
    // Emit the chat message to the socket
    socket.emit('chat message', {
      text: message,
      username: username,
      group_id: selectedGroupId,
      conversationId: conversationId,
    });
    
    // Clear the message input and file input
    messageInput.value = '';
    fileInput.value = '';
  } catch (error) {
    // Handle any errors
    console.error(error);
  }
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
  memberIds.push(userId);
  console.log(groupName)
  await axios.post('/messages/groups', {
    name: groupName,
    creatorId: userId,
    memberIds: memberIds
  });

  await axios.post('/messages/groups/invite', {
    name: groupName,
    creatorId: userId,
    userId: memberIds
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

  groups = await getUserGroups(userId);
  console.log(groups);
  // Clear the existing list
  groupList.innerHTML = '';

  // Create a list item for each group and append it to the list
  groups.data.forEach(group => {
    const listItem = document.createElement('li');
    const groupLink = document.createElement('a');
    groupLink.href = '#';
    groupLink.textContent = group.name;

    groupLink.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent the default link behavior
    
        displayGroupMessages(group.id, group.name)
      
    })
    
    if (group.isAdmin) {
      
      // The logged-in user is the admin of the group
      const editButton = document.createElement('button');
      editButton.textContent = 'Edit';

      // Event listener for the edit button
      editButton.addEventListener('click', () => {
        // Create the modal or form element
        const modal = document.createElement('div');
        modal.classList.add('modal');

        // Create the form element
        const form = document.createElement('form');

        // Create the group name input field
        const groupNameInput = document.createElement('input');
        groupNameInput.type = 'text';
        groupNameInput.value = group.name;
        form.appendChild(groupNameInput);

        // Create the users list for adding/removing users
        const usersList = document.createElement('ul');

        // Create the input field for adding users
        const addUserInput = document.createElement('input');
        addUserInput.type = 'text';
        addUserInput.placeholder = 'Enter username or email';
        form.appendChild(addUserInput);
        
        // Create a <ul> element for displaying the search results
        const searchResults = document.createElement('ul');
        form.appendChild(searchResults);
        
        addUserInput.addEventListener('input', () => {
          const query = addUserInput.value.trim();
        
          // Clear previous search results
          searchResults.innerHTML = '';
        
          if (query.length > 0) {
            // Send a request to the server to search for users based on the query
            axios.get(`/user/search-user?query=${query}`)
            .then(response => {
                const results = response.data.results;
                console.log(results);
            if (results.length > 0) {
                  // Display the search results
            results.forEach(user => {
            const listItem = document.createElement('li');
            listItem.textContent = user.name;

              const addButton = document.createElement('button');
              addButton.textContent = 'Invite';
              const creatorId = decodedToken.userId;
              const data = {
                creatorId: creatorId,
                userId: user.id,
                groupId: group.id
              };
            addButton.addEventListener('click', async () => {
              try {
              // Send a request to the server to add the user to the group
              axios.post('/messages/groups/invite', data)

              // Update the UI to reflect the addition of the user to the group
              const addedUserElement = document.createElement('li');
              addedUserElement.textContent = user.name;
              usersList.appendChild(addedUserElement);
              addButton.textContent = 'Invited';
              addButton.classList.add('added-button');
              addButton.disabled = true;
            } catch (error) {
              console.error(error);
            }
            });

            listItem.appendChild(addButton);
            searchResults.appendChild(listItem);
            });
            } else {
                  // Display a message indicating no results found
                  const listItem = document.createElement('li');
                  listItem.textContent = 'No results found';
                  searchResults.appendChild(listItem);
                }
              })
              .catch(error => {
                console.error(error);
              });
          }
        });
      
        // Add the form and users list to the modal
        modal.appendChild(form);
        modal.appendChild(usersList);
      
        // Add the modal to the page
        document.body.appendChild(modal);

        axios.get(`/messages/groups/${group.id}/members`)
        .then(response => response.data)
        .then(data => {
          const members = data.data;
          let isAdmin=null;
          // Iterate over the group members and display them as list items
          members.forEach(member => {
            if (member.id !== decodedToken.userId) {
            const listItem = document.createElement('li');
            listItem.textContent = member.name;
            axios.get(`/messages/members/${group.id}/${member.id}/is-admin`)
            .then(response => response.data)
            .then(data => {
              isAdmin = data.isAdmin;
              console.log(isAdmin);
              if (!isAdmin) {
                const makeAdmin = document.createElement('button');
                makeAdmin.textContent = 'Make Admin';
                makeAdmin.addEventListener('click', async () => {
                  try {
                    // Send a request to the backend to make the user an admin
                    axios.post('/messages/groups/make-admin', { groupId: group.id, userId: member.id })
                      .then(response => {
                        // Handle the success response if needed
                        makeAdmin.classList.add('make-admin-button');
                        makeAdmin.disabled = true;
                      })
                      .catch(error => {
                        // Handle the error if necessary
                        console.error(error);
                      });
                  } catch (error) {
                    console.error(error);
                  }
                });
                listItem.appendChild(makeAdmin);
              }
            })
            .catch(error => {
              // Handle the error if necessary
              console.error(error);
            })
            
          // Add a remove button for each member
          const removeButton = document.createElement('button');
          removeButton.textContent = 'Remove';

          removeButton.addEventListener('click', () => {
            const userId = member.id; 
            const groupId = group.id;
            axios.post('/messages/groups/removeuser', { userId, groupId })
            removeButton.textContent = 'Removed';
            removeButton.className = 'remove';
            removeButton.disabled = true
          });
          
          listItem.appendChild(removeButton);
          usersList.appendChild(listItem);
          }
        });
        // Handle the form submission or modal close event to update the group details
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const newGroupName = groupNameInput.value;
          // Handle the form submission event
          // Send a request to the server to update the group name
          // Update the UI accordingly
          // Close the modal or remove it from the page
          modal.remove();
        });
      
        // Handle the modal close event
        modal.addEventListener('click', (event) => {
          if (event.target === modal) {
            // Close the modal or remove it from the page
            modal.remove();
          }
        });
        })
    })
      listItem.appendChild(groupLink);
      listItem.appendChild(editButton);
    } else {
      listItem.appendChild(groupLink);
    }

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


const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', (e) => {
  e.preventDefault();
  const senderId = decodedToken.userId;
  let conversationId;
  console.log(isGroupChat)
  if (isGroupChat) {
     // Assuming you have the groupId for the group chat
    conversationId = generateConversationId(senderId, group_id);
  } else {
    // Assuming it's a one-on-one chat
    conversationId = generateConversationId(senderId, recipientId);
  }
  console.log(conversationId)
  const file = fileInput.files[0];


  console.log(file.name)

  let formData = new FormData()
  formData.append('file', file)

      // Upload the file to the pre-signed URL using Axios
      axios.post('/files/upload', formData, {
        headers: {
          'Content-Type': file.type,
        },
      })
        .then(uploadResponse => {
          // File upload successful
          console.log('File uploaded:', uploadResponse);
  
          // Handle any success actions
        })
        .catch(uploadError => {
          console.error('Error uploading file:', uploadError);
          // Handle any error actions
        });
    })
  





