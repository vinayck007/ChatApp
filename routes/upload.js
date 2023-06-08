const express = require('express');
const router = express.Router();
const upload = require('../controllers/file');

router.post('/upload', upload.fileUpload);

router.post('/download', upload.fileDownload);

module.exports = router;