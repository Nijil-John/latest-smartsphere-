const path =require('path')
const multer = require('multer')


const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'productAssets/')
    },
    filename:function(req,file,cb){
        let ext = path.extname(file.originalname)
        cb(null,Date.now() +ext)
    }
})


var upload =multer({
    storage:storage,
    fileFilter: function(req, file, cb) {
        if (
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg'
        ) {
            cb(null, true); // Accept the file
        } else {
            console.log('Only JPG and PNG files are supported');
            cb(null, false); // Reject the file
        }
    
        limits:{
            fileSize :1024*1024 *2
        }}
})


module.exports=upload