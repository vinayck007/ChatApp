const express = require('express');
const path = require('path');
const userController = require('../controllers/user')
const router = express.Router();

router.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/Signup/signup.html'));
});

router.get('/signup.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/Signup/sstyle.css'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/Login/login.html'));
});

router.get('/login.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/Signup/style.css'));
});

router.post('/signup', userController.signup);

router.post('/login', userController.login);

module.exports = router;
