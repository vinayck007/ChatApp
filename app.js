const { createServer } = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const Message = require('./models/msg');
const User = require('./models/user');
const Group = require('./models/group');
const Membership = require('./models/membership');
const Invitation = require('./models/Invitation')

const userRoutes = require('./routes/user');
const msgRoutes = require('./routes/msg');
const uploadRoutes = require('./routes/upload')

const sequelize = require('./util/database');

const cors = require('cors');
const path = require('path');
const socketio = require('socket.io');
const { userJoin, userLeft} = require('./util/users')

const dotenv = require('dotenv');
const { start } = require('repl');
dotenv.config();

const app = express();
const server = createServer(app);

const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: "*",
  method: ["GET", "POST"]
}))

app.get("/", (req, res) => {
  res.sendFile(__dirname + "./public/Login/login.html");
});

// Define the signup route
app.use('/user', userRoutes);
app.use('/messages', msgRoutes);
app.use('/files', uploadRoutes);

Group.belongsToMany(User, { through: Membership });
User.belongsToMany(Group, { through: Membership });

Group.belongsToMany(User, { through: 'GroupAdmins', foreignKey: 'groupId', as: 'admins' });
User.belongsToMany(Group, { through: 'GroupAdmins', foreignKey: 'userId', as: 'adminOfGroups' });


User.hasMany(Invitation, { foreignKey: 'UserId', as: 'invitations' });
Invitation.belongsTo(User, { foreignKey: 'UserId', as: 'user' });

require('./util/corn');

io.on('connection', (socket) => {

  // When a user logs in, set their username in the connected users object
  socket.on('login', ({username}) => {
    const user = userJoin(socket.id, username);
    console.log(user)
    socket.broadcast.emit('user connected', `${user.name} has joined the chat`);
  });

   // Handle the disconnection event
  socket.on('disconnect', () => {
    const user = userLeft(socket.id);
    
    if(user) {
      socket.broadcast.emit('user disconnected', `${user.name} has left the chat`);
    }
  });


  
  socket.on('chat message', (message) => {
    if (message.type === 'group') {
      // Handle group message
      console.log(message.groupId)
      handleGroupMessage(socket, message.groupId, message.text, message.username);
    } else if (message.type === 'individual') {
      // Handle individual message
      handleIndividualMessage(socket, message.conversationId, message.text, message.username);
    }
  });

});

  async function handleIndividualMessage(socket, conversationId, text, username) {
    // Process the individual chat message
    console.log('Received individual message:', text);
    // ...
  
    // Create a new message entry in the database
    const message = await Message.create({
      text: text,
      username: username,
      groupId: null, // Set groupId as null for individual messages
      conversationId: conversationId
    });
  
    // Send a response to the client (if needed)
    
    socket.emit('chat message', message);
  }

  async function handleGroupMessage(socket, groupId, text, username) {
    // Process the group chat message
    console.log('Received group message:', text);
    // ...
  console.log(groupId)
    // Create a new message entry in the database
    const message = await Message.create({
      text: text,
      username: username,
      groupId: groupId,
      conversationId: null // Set conversationId as null for group messages
    });
  
    // Send a response to the client (if needed)
    
    socket.emit('chat message', message);
  }

sequelize.sync()
  .then(() => {
    console.log('Database synced successfully');
    server.listen(3000, () => {
      console.log('Server started on port 3000');
    });
  })
  .catch(error => console.log(error));
