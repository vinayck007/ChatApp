const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const File = sequelize.define('file', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  groupId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  path: {
    type: Sequelize.STRING,
    allowNull: true
  },
  size: {
    type: Sequelize.INTEGER,
    allowNull: true
  }
}); 

// Sync the model with the database
sequelize.sync()
  .then(() => {
    console.log('Database synced successfully');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

module.exports = File;