const mongoose = require('mongoose')
const productSchema = mongoose.Schema({
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
    imageURL:[String]
    ,
    quantity:{
        type:Number,
        required : true
    },
    delete:{
        type:Boolean,
        default:false,
        required:true
    }

})