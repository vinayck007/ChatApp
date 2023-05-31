const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3');
require("dotenv").config();


aws.config.update({
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    region: 'eu-north-1',

});
const BUCKET = 'chataa';
const s3 = new aws.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            console.log(file);
            cb(null, file.originalname)
        }
    })
})

exports.tos3 = async function (req, res) {
  
  upload.single('file')(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.send('Successfully uploaded ' + req.file.location + ' location!');
   console.log(req.file)
  });
};