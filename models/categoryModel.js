const mongoose = require("mongoose")

const categoryModel = mongoose.Schema({
    categoryId:{
        type:Number,
        required: true
    },categoryName:{
        type:String,
        required: true
    },categoryDescription :{
        type:String,
        required: true
    }
})
const category=mongoose.model('category',categoryModel)
module.exports = category;