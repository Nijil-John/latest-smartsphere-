const path =require('path')
const multer = require('multer')


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'productAssets/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });


  const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    },
    limits: { fileSize: 10000000 }, // 10MB file size limit
  });


module.exports=upload