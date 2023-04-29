const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Message = sequelize.define('Message', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  text: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

module.exports = Message;