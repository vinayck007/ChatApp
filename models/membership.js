
const sequelize = require('../util/database');
const Sequelize = require('sequelize');

const Membership = sequelize.define('Membership', {
  // Other fields of the Membership model
  isAdmin: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
});

sequelize.sync()
  .then(() => {
    console.log('Database synced successfully');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

module.exports = Membership;
