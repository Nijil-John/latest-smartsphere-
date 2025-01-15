const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // reference to the Product collection
        required: true,
      },
      productName: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      returnStatus: {
        type: String,
        enum: ["not-requested", "requested", "approved", "rejected"],
        default: "not-requested",
      },
      returnReason: {
        type: String,
      },
      returnAmount: {
        type: Number,
      },
    },
  ],
  couponId: {
    type: mongoose.Schema.ObjectId,
    ref: "coupon",
  },
  couponAmount: {
    type: Number,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending","confirmed","shipped","delivered","cancelled","Return-Requested","Return-Approved"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: [/* 'Credit Card', 'PayPal',  */ "ONLINE", "COD"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  address: [
    {
      shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "address", // reference to the Product collection
        /* required: true, */
      },
      billingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "address", // reference to the Product collection
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  couponDiscountAmount: {
    type: Number,
  },
  shippingCost: {
    type: Number,
    default:40,
  },
  offerDiscount: {
    type: Number,
  },
  cancellReason:{
    type:String
  }
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
