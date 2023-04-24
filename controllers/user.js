const User = require('../models/User');

exports.signup = async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  try {
    const user = await User.create({ name, email, phone, password });
    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};