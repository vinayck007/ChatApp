const Message = require('../models/msg');

exports.msg = async (req, res) => {
  const { text, username } = req.body;
  try {
    const message = await Message.create({ text, username });
    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};