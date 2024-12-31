const wishlist=require('../models/wishlistModel')
const product = require("../models/productModel");
const user = require("../models/userModel");
const cart = require('../models/cartModel')
const { ObjectId } = require('mongodb')

const addToWishlist = async(req,res)=>{
    try {
        //console.log(req.session.user_id);
        if(req.query.cartId){
            const cartData = await cart.find({ userId: req.session.user_id });
    const productId = new ObjectId(req.query.cartId)
    console.log(cartData[0]);
    const delItem = await cart.updateOne({ _id: cartData[0]._id }, { $pull: { items: { productId: productId } } }  )
            }
        const wishlistData=await wishlist.find({userId:req.session.user_id})
        //console.log(req.query.productId);
        if(wishlistData.length==0){
            const Wishlist=new wishlist({
                userId:req.session.user_id,
                productId:req.query.productId
            })
            const value = await Wishlist.save()
        }else{      
            const productExist= wishlistData.some(item=>item.productId.toString() ===req.query.productId) 
            //console.log(productExist);
            if(!productExist){
                const Wishlist=new wishlist({
                    userId:req.session.user_id,
                    productId:req.query.productId
                })
                const value = await Wishlist.save()
                //console.log(`${value} added`);
            }
        }
        
        

        res.redirect('/wishlist')
    } catch (error) {
        console.log(error.message);
    }
}
const loadWishlist=async(req,res)=>{
    try {
       // console.log(req.session);
        let userId=req.session.user_id
        let wishCount=await wishlist.countDocuments({userId:userId})
        let cartCt=await cart.findOne({userId:userId})
        console.log('carts :'+cartCt);

        let carts=  cartCt !== null?cartCt.items:0     



        let cartCount =  cartCt !== null?carts.length:0
        let userData=await user.find({_id:userId})
        const wishData = await wishlist.find({userId:userId})
        let productData=[]
        for(let i=0;i<wishData.length;i++){
            productData[i]=await product.find({_id:wishData[i].productId})
            productData[i].wishlistId=wishData[i]._id
        }
        let proData=productData.flat()
            for(let i=0;i<wishData.length;i++){
                proData[i].wishlistId=wishData[i]._id
            }
            //console.log(proData);
        res.render("wishlist",{
            categories: "catData",
            proCat: "productCat",
            products: proData,
            users: userData,
            cartCount,wishCount
          })

        
    } catch (error) {
        console.log(error.message+"here wishlist");
    }
}
const removeFromWishList =async(req,res)=>{
    try {
        const delItem=await wishlist.deleteOne({productId:req.query.id})
        res.redirect('/wishlist')
        
    } catch (error) {
        console.log(error.message);
    }
}








module.exports={
    addToWishlist,
    loadWishlist,
    removeFromWishList,
}