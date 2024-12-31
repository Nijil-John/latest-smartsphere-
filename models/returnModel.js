const mongoose = require("mongoose");

const ReturnSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // reference to the Product collection
        required: true,
      },
    },
  ],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true },
  comment: { type: String, required: true },
  returnStatus: {
    type: String,
    enum: ["requested", "approved", "rejected"],
    default: "requested",
  },
  paymentStatus:{
    type: String,
    enum: ["pending", "refunded", "rejected"],/* "approved", */
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Return", ReturnSchema);
