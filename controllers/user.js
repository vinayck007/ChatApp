const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.signup = async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, phone, password: hashedPassword });
    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};