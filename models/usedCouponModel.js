const mongoose = require("mongoose");

const usedCouponSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: "User",
      required: true
     },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
    required: true,
  },
  status: { type: String,
    enum: ["used", "invalid"],
     default: "used" },
  redeemedOn: { type: Date, default: Date.now },
});
const UsedCoupon= mongoose.model("UsedCoupon", usedCouponSchema);
module.exports =UsedCoupon
