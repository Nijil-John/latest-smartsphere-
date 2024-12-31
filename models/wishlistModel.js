const mongoose = require('mongoose')
const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
        required: true
    },
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: "product"
    },
   /*  count: {
        type: Number,
        required: true
    } */
})
const wishlist=mongoose.model('Wishlist',wishlistSchema)
module.exports=wishlist