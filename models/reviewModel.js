const mongoose = require('mongoose')
const reviewSchema = mongoose.Schema({
    productId:{
        type:mongoose.Schema.ObjectId,
        ref:'product',
        required: true
    },
    userId:{
        type:mongoose.Schema.ObjectId,
        ref:'product'
    },
    name: {
        type: String
      },
    email: {
        type: String
    },
    description:{
        type:String,
        required : true
    },
    score:{
        type:Number,
        required : true
    },
    categoryId:{
        type:mongoose.Schema.ObjectId,
        ref:'category',
        required : true
    },
    createdAt: {
        type: Date,
        default:Date.now
      }

})

const product = mongoose.model("product",productSchema);
module.exports = product;
