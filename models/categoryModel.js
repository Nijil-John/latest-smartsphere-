const mongoose = require("mongoose")

const categoryModel = mongoose.Schema({
    categoryId:{
        type:String,
        required: true
    },categoryName:{
        type:String,
        required: true
    },categoryDescription :{
        type:String,
        required: true
    }
    ,categoryIsDeleted :{
        type:Boolean,
        default:false
    }
})
const category=mongoose.model('category',categoryModel)
module.exports = category;