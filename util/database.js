const Sequelize = require('sequelize')

// Create a Sequelize instance and connect to the database
const sequelize = new Sequelize('chat_app', 'root', 'password', {
  dialect: 'mysql',
  host: 'localhost'
});

module.exports = sequelize;