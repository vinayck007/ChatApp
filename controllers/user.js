const User = require('../models/User');

exports.signup = async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  try {
    const user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    await User.create({ name, email, phone, password });
    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};