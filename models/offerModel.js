const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  offerType: {
    type: String,
    required: true,
    enum: ['product', 'category'], // You can specify the type of offer: percentage or fixed amount
  },
  typeId:{
    type: String,
    required : true
},
  discountPercentage: {
    type: Number,
    min: 1,
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['expired', 'activated','pending']//if the offer time is valid then the true become false
  } 
});

// Create Offer model
const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
