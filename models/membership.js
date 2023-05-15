
const sequelize = require('../util/database');

const Membership = sequelize.define('Membership', {});

sequelize.sync()
  .then(() => {
    console.log('Database synced successfully');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

module.exports = Membership;
