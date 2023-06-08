const aws = require('aws-sdk');
const { application } = require('express');
const multer = require('multer')
const multerS3 = require('multer-s3');
const path = require('path');
const File = require('../models/file')
const { v4: uuidv4 } = require('uuid');
require("dotenv").config();

aws.config.update({
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    region: 'eu-north-1',

});
const BUCKET = 'chataa';
const s3 = new aws.S3();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname); // Get the file extension
    const fileName = `${Date.now()}_${file.originalname}`; // Generate a unique file name with original name and extension
    cb(null, fileName);
  }
});

const upload = multer({ storage });

// Handle file upload
exports.fileUpload = async function (req, res) {
  upload.single('file')(req, res, async function (err) {
    if (err) {
      // Handle any upload error
      console.error('Error uploading file:', err);
      return res.status(500).json({ error: 'File upload failed.' });
    }

    const name = req.file.originalname;
    const { conversationId, groupId } = req.body;
    const fileName = req.file.filename; // Get the saved file name
    const fileUrl = path.join('/uploads', fileName); // Generate the file URL

    try {
      await File.create({
        conversationId,
        groupId,
        path: fileUrl,
        name,
        // Additional file properties
      });

      // File upload successful
      return res.json({ status: 'success', fileUrl });
    } catch (error) {
      console.error('Error creating file record:', error);
      return res.status(500).json({ error: 'Failed to create file record.' });
    }
  });
};
exports.fileDownload = async function (req, res) {
  
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
console.log(filePath)
  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Send the file to the frontend
    res.sendFile(filePath);
  } else {
    // File not found
    res.status(404).send('File not found');
  }
};