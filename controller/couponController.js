const coupon=require('../models/couponModel')
const { logout } = require('./userController')
const UsedCoupon=require('../models/usedCouponModel')


const loadCoupon = async(req,res)=>{
    try {
       const couponData=await coupon.find({})
        let adminData= req.session.adminData
        res.render('adminCoupon',{admin:adminData,coupon:couponData} )
    } catch (error) {
        console.log(error.message);
    }
}
const couponForm=async(req,res)=>{
    try {
        let adminData= req.session.adminData
        res.render('adminAddCoupon',{admin:adminData})        
    } catch (error) {
        console.log(error.message);
    }
}
const addCoupon=async(req,res)=>{
    try {
        console.log(req.body);
        const AddCoupon=new coupon({
            code:req.body.code,
            details:req.body.details,
            discountType: req.body.discountType,
            discountValue: req.body.discountValue,
            minPurchaseAmount: req.body.minPurchaseAmount,
            maxDiscountAmount: req.body.maxDiscountAmount,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            usageLimit: req.body.usageLimit,
            status: req.body.status,
        })
        console.log(AddCoupon);        
        let saveCoupon=await AddCoupon.save()
        console.log(saveCoupon);
        res.redirect('/admin/coupon')
    } catch (error) {
        console.log(error.message);
    }
}
const updatePageLoadCoupon=async(req,res)=>{
    try {
        let adminData= req.session.adminData
        const couponData=await coupon.findById(req.query.couponId)
        console.log(couponData)


        res.render('adminEditCoupon',{admin:adminData,coupon:couponData})
    } catch (error) {
        console.log(error.message);
    }
}
const updateCoupon= async(req,res)=>{
    try {
        const couponData=await coupon.findById(req.body._id)
        const fieldsToCompare = [
            'code', 'details', 'discountType', 'discountValue', 'minPurchaseAmount',
            'maxDiscountAmount', 'startDate', 'endDate', 'usageLimit', 'usedCount', 'status'
        ];
        
        const mismatchedFields = {};
        
        const isMatch = fieldsToCompare.every((field) => {
            let isFieldMatch;
            if (field === 'startDate' || field === 'endDate') {
                isFieldMatch = new Date(couponData[field]).toISOString() === new Date(req.body[field]).toISOString();
            } else {
                isFieldMatch = couponData[field] == req.body[field];
            }
        
            // If a field doesn't match, add it to mismatchedFields
            if (!isFieldMatch) {
                mismatchedFields[field] = req.body[field]; // Store the value from req.body
            }
        
            return isFieldMatch;
        });
        
        if (isMatch) {
            console.log('here');
            res.redirect('/admin/coupon');
        } else {
            const updateFields = Object.fromEntries(
    Object.entries(mismatchedFields).map(([key, value]) => [`${key}`, value])
);
console.log(updateFields);
const updateCoupon = await coupon.updateOne(
    { _id: req.body._id },
    { $set: updateFields }
);

            console.log('Mismatched fields:', mismatchedFields,updateCoupon); // Log mismatched fields for debugging
            res.redirect('/admin/coupon');
        }
        
        
        console.log(req.body);
    } catch (error) {
        console.log(error.message);
    }
}












module.exports={
    loadCoupon,
    couponForm,
    addCoupon,
    updatePageLoadCoupon,
    updateCoupon,
   
}