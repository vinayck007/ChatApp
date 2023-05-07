const { createServer } = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const Message = require('./models/msg');
const User = require('./models/user');
const Group = require('./models/group');
const Membership = require('./models/membership')

const userRoutes = require('./routes/user');
const msgRoutes = require('./routes/msg');

const sequelize = require('./util/database');

const cors = require('cors');
const path = require('path');
const socketio = require('socket.io');
const { userJoin, userLeft} = require('./util/users')

const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = createServer(app);

const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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

Group.belongsToMany(User, { through: Membership });
User.belongsToMany(Group, { through: Membership });

Group.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
User.hasMany(Group, { as: 'createdGroups', foreignKey: 'creatorId' });



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
  
  socket.on('chat message', async ({ text, username, group_id}) => {
    console.log(text)
    try {
      // Create a new message in the database
      const message = await Message.create({
        text: text,
        username: username,
        groupId: group_id
      });
  
      // Broadcast the message to all connected clients
      io.emit('chat message', message.toJSON());
    } catch (err) {
      console.error(err);
    }
  });
});

sequelize.sync()
  .then(() => {
    console.log('Database synced successfully');
    server.listen(3000, () => {
      console.log('Server started on port 3000');
    });
  })
  .catch(error => console.log(error));
