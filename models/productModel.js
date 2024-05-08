const mongoose = require('mongoose')
const productSchema = mongoose.Schema({
    productId:{
        type:Number,
        required: true
    },
    name:{
        type:String,
        required : true
    },
    description:{
        type:String,
        required : true
    },
    price:{
        type:Number,
        required : true
    },
    categoryId:{
        type:mongoose.Schema.ObjectId,
        ref:'category',
        required : true
    },
    productImage:{
        type:String
    }
    ,
    quantity:{
        type:Number,
        required : true
    },
    isDelete:{
        type:Boolean,
        default:false,
        required:true
    }

})

const product = mongoose.model("product",productSchema);
module.exports = product;
