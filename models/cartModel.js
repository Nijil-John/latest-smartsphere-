const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
        required: true
    },
    /* productId: {
        type: mongoose.Schema.ObjectId,
        ref: "product"
    } */
    items: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
          },
          price: {
            type: Number,
            required: true,
          },
        },]
    
    ,
    couponId:{
        type:mongoose.Schema.ObjectId,
        ref:"coupon"
    }
})
const cart=mongoose.model('Cart',cartSchema)
module.exports=cart