const { createServer } = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const Message = require('./models/msg');
const User = require('./models/user');

const userRoutes = require('./routes/user');
const msgRoutes = require('./routes/msg');

const sequelize = require('./util/database');

const cors = require('cors');
const path = require('path');
const socketio = require('socket.io');
const { userjoin, getCurrentUser} = require('./util/users')

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

io.on('connection', (socket) => {
  socket.on("login", async (email) => {
    const user = await User.findOne({ where: { email } });
    
    // If the user with the given email is found in the database
    if (user) {
      const { id, name } = user;
      const socketUser = userjoin(id, name);
  
      socket.broadcast.emit('user connected', { 
        username: socket.request.user.username 
      });
    } 
  });


  socket.on('chat message', async ({ text, username }) => {
    try {
      // Create a new message in the database
      const message = await Message.create({
        text: text,
        username: username,
      });
  
      // Broadcast the message to all connected clients
      io.emit('chat message', message.toJSON());
    } catch (err) {
      console.error(err);
    }
  });
});

  // socket.on("disconnect", () => {
  //   const disconnectedUser = onlineUsers[socket.id];
  //   delete onlineUsers[socket.id];
  //   io.emit("user disconnected", disconnectedUser);
  // });


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



sequelize.sync()
  .then(() => {
    console.log('Database synced successfully');
    server.listen(3000, () => {
      console.log('Server started on port 3000');
    });
  })
  .catch(error => console.log(error));
