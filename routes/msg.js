const express = require('express');
const router = express.Router();
const msgController = require('../controllers/msg')

router.post('/groups', msgController.createGroup);

router.get('/users/:userId/groups', msgController.getGroups);

router.get('/groups/:groupId/members', msgController.getUsersInGroup);

router.get('/groups/:groupId/messages', msgController.getGroupMessages);

module.exports = router;