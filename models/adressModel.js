const mongoose = require('mongoose')

const addressSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.ObjectId,
        ref:'user',
        required : true
    },
    name:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    pincode:{
        type:Number,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    isDefault:{
        type:String,
        required:true
    }
})
const address = mongoose.model('address',addressSchema)
module.exports =address