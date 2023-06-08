const cron = require('node-cron');
const Message = require('../models/msg');

cron.schedule('0 0 * * *', async () => {
  try {
    // Find conversations older than a day that are not already archived
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const conversationsToUpdate = await Message.findAll({
      where: {
        archived: false,
        createdAt: {
          [Op.lt]: oneDayAgo,
        },
      },
    });

     // Update the conversations to set the "archived" flag to true
     await Message.update(
      { archived: true },
      {
        where: {
          id: conversationsToUpdate.map((conversation) => conversation.id),
        },
      }
    );

    await Message.destroy({
      where: {
        createdAt: {
          [Op.lt]: oneDayAgo,
        },
      },
    });

    console.log('Chat conversations moved to archive.');
  } catch (error) {
    console.error('Error moving chat conversations to archive:', error);
  }
});