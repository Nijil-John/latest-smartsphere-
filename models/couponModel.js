const mongoose=require('mongoose')
const couponScheme = new mongoose.Schema({
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    details:{
      type:String,
      required:true
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed-amount'], // percentage or fixed discount
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // null means no limit
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited uses
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending','active', 'expired'],
      default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
      }

  })
  const Coupon = mongoose.model("coupon", couponScheme);
module.exports = Coupon;
