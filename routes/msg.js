const express = require('express');
const router = express.Router();
const msgController = require('../controllers/msg');
const upload = require('../controllers/upload')

router.get('/user/:conversationId', msgController.getUserMsg)

router.post('/groups', msgController.createGroup);

router.post('/groups/invite', msgController.sendInvitation);

router.get('/users/:userId/groups', msgController.getGroups);

router.get('/groups/:groupId/members', msgController.getUsersInGroup);

router.get('/members/:groupId/:userId/is-admin', msgController.isAdmin);

router.get('/groups/:groupId/messages', msgController.getGroupMessages);

router.post('/groups/invite/:id', msgController.setInvitationStatus);

router.post('/groups/removeuser', msgController.removeUser);

router.post('/groups/make-admin', msgController.makeAdmin);

router.post('/files/upload', msgController.uploadFile);

router.get('/files/download', msgController.downloadFile);

router.post('/generate-upload-url', upload.tos3);

module.exports = router;