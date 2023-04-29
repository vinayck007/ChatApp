const express = require('express');
const router = express.Router();
const msgController = require('../controllers/msg')

router.post('/', msgController.msg);

module.exports = router;