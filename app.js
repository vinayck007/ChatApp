const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user');
const sequelize = require('./util/database');

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Define the signup route
app.use('/user', userRoutes);

// Start the server
sequelize.sync()
  .then(() => {
    console.log('Database synced successfully');
    app.listen(3000, () => {
      console.log('Server started on port 3000');
    });
  })
  .catch(error => console.log(error));