const mongoose = require('mongoose')
const productSchema = mongoose.Schema({
    productId:{
        type:String,
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
    price:{// the selling price of the product 
        type:Number,
        required : true
    },
    categoryId:{
        type:mongoose.Schema.ObjectId,
        ref:'category',
        required : true
    },
    productImage:[{
        name:{
            type:String,
            required:true
        },
        path:{
            type:String,
            required:true
        }
    }]
    ,
    quantity:{
        type:Number,
        required : true
    },
    isDelete:{
        type:Boolean,
        default:false,
        required:true
    },
    originalPrice:{ //the origianal price of the product which dose not change
        type:Number,
        required:true
    },
    salesCount:{
        type:Number
    }

})

const product = mongoose.model("product",productSchema);
module.exports = product;
