const mongoose = require('mongoose')

const bannerSchema = mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    categoryId:{
        type:mongoose.Schema.ObjectId,
        ref:'category',
        required : true
    },
    bannerImage:[{
        type: String, // Assuming you store image URLs
        required: true
      }]
})
const Banner= mongoose.model('Banner',bannerSchema)
module.exports= Banner
 