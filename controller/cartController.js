const { ObjectId } = require("mongodb");
const Cart = require("../models/cartModel");
const product = require("../models/productModel");
const user = require("../models/userModel");
const categories = require("../models/categoryModel");
const wishlist = require("../models/wishlistModel");
const coupon = require("../models/couponModel");
const UsedCoupon =require("../models/usedCouponModel")

const loadCart = async (req, res) => {
  try {
    const userData = await user.findById(req.session.user_id);

    let wishCount = await wishlist.countDocuments({ userId: userData._id });
   
    const cartData = await Cart.find({ userId: userData._id });
    
    let cartCount = cartData[0] !== undefined ?cartData[0].items.length:0
    if (cartData.length === 0) {
      return res.render("cart", {
        categories: "catData",
        proCat: "productCat",
        products: [],
        users: userData,
        wishCount,
        cartCount,
        block: false,
        coupon: null,
        cartItems: [],
      });
    }

    const cartItems = cartData[0].items;
    let couponData = null;
    if (cartData[0].couponId) {
      couponData = await coupon.findOne({ _id: cartData[0].couponId });
    }

    const proData = await Promise.all(
      cartItems.map((item) => product.findById(item.productId))
    );
    
    const validProducts = proData.map((prod) => {
      const cartItem = cartItems.find((item) => item.productId.toString() === prod._id.toString());
      prod.__v = cartItem.quantity; // Add cart quantity to product
      return prod;
    });
    

    let block = validProducts.some(
      (prod) => prod.isDelete || prod.quantity === 0
    );
      //console.log('block :'+block,'validProducts :'+validProducts,'proData'+proData);
    res.render("cart", {
      categories: "catData",
      proCat: "productCat",
      products: validProducts,
      users: userData,
      wishCount,
      cartCount,
      block,
      coupon: couponData,
      cartItems: cartData[0],
    });
  } catch (error) {
    console.log(`${error.message} here`);
  }
};


const addToCart = async (req, res) => {
  try {
    console.log(req.query);
    console.log("Wishlist flag:", req.query.wish);

    const userData = await user.findById(req.session.user_id);
    if (!userData) {
      throw new Error("User not found.");
    }

    const proId = req.query.productId;
    const quantity = parseInt(req.query.quantity) || 1;

    const productData = await product.findOne({ productId: proId });
    console.log("productData"+productData);
    if (!productData) {
      throw new Error("Product not found.");
    }

    const cartData = await Cart.find({ userId: userData._id });
    console.log("cartData"+cartData);
    // Handle wishlist deletion
    if (req.query.wish === "true") {
      const delItem = await wishlist.deleteOne({ productId: productData._id });
      console.log("Wishlist item deleted:", delItem);
     /*  const newItem = {
        productId: productData._id,
        quantity: quantity,
        price: productData.price,
      };
      console.log("New product added to cart.");

       let pro1=await Cart.updateOne({ _id: cartData[0]._id },{ $push: { items: newItem } }) */
    } 
     if (cartData.length > 0) {
      let items = cartData[0].items;
      let productExist = items.some((item) =>
        item.productId.equals(productData._id)
      )

      if (productExist) {
        // Increment quantity if product already exists in cart
        await Cart.updateOne(
          { _id: cartData[0]._id, "items.productId": productData._id },
          { $inc: { "items.$.quantity": quantity } }
        );
        console.log("Quantity incremented for existing product.");
      } else {
        // Add new product to cart
        const newItem = {
          productId: productData._id,
          quantity: quantity,
          price: productData.price,
        };
        await Cart.updateOne(
          { _id: cartData[0]._id },
          { $push: { items: newItem } }
        );
        console.log("New product added to cart.");
      }
    } else {
      // Create a new cart
      const newCart = new Cart({
        userId: userData._id,
        items: [
          {
            productId: productData._id,
            quantity: quantity,
            price: productData.price,
          },
        ],
      });
      await newCart.save();
      console.log("New cart created.");
    }

    res.redirect("/cartdata");
  } catch (error) {
    console.error("Error in addToCart:", error.message);
    //res.status(500).send("Internal Server Error");
  }
};
;

const deleteFromCart = async (req, res) => {
  try {
    console.log(req.query.cartId);
    const cartData = await Cart.find({ userId: req.session.user_id });
    const productId = new ObjectId(req.query.cartId);
    console.log(cartData[0]);
    const delItem = await Cart.updateOne(
      { _id: cartData[0]._id },
      { $pull: { items: { productId: productId } } }
    );

    res.redirect("/cartdata");
  } catch (error) {
    console.log(error.message);
  }
};
/* const updateCoupon = async (req, res) => {
  try {
    console.log(req.session);
    const couponData = await coupon.find({ code: req.body.code });
    console.log(couponData);
    const usdCopnData=await UsedCoupon.find({userId:req.session.user_id, couponId:couponData[0]._id })
    console.log("usdCopnData :"+usdCopnData);
    if(usdCopnData.status==='used'){
    }else{
      const cartUpdate = await Cart.updateOne(
        { userId: req.session.user_id },
        { $set: { couponId: couponData[0]._id } }
      );
      const couponUse=new UsedCoupon({
        userId:req.session.user_id,
        couponId:couponData[0]._id 
      })
      const usedCouponData=await couponUse.save()
      console.log('cartUpdate :'+cartUpdate,"usedCouponData :"+usedCouponData);
    }


    
    res.redirect("/cartData");
  } catch (error) {
    console.log(error.message);
  }
}; */

const updateCoupon = async (req, res) => {
  try {
    if (!req.session.user_id) {
      console.log("User not logged in");
      return res.status(401).send("User not logged in");
    }

    const couponData = await coupon.find({ code: req.body.code });
    console.log('the coupon data : '+couponData);
    if (couponData[0].status === 'pending') {
      console.log("Coupon not found");
      return res.status(404).send("Coupon not found");
    }

    const usdCopnData = await UsedCoupon.find({
      userId: req.session.user_id,
      couponId: couponData[0]._id,
    });

    if (usdCopnData.length > 0 && usdCopnData[0].status === "used") {
      console.log("Coupon already used by this user");
      return res.status(400).send("Coupon already used");
    }

    const cartUpdate = await Cart.updateOne(
      { userId: req.session.user_id },
      { $set: { couponId: couponData[0]._id } }
    );

    const couponUse = new UsedCoupon({
      userId: req.session.user_id,
      couponId: couponData[0]._id,
      status: "used", // Add status if applicable
    });

    const usedCouponData = await couponUse.save();
    console.log("Cart updated:", cartUpdate);
    console.log("Used coupon saved:", usedCouponData);

    res.redirect("/cartData");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};







/* const deleteCoupon = async (req, res) => {
  try {
    const couponData = await coupon.findById(req.query.id);
    const usdCopnData = await UsedCoupon.find({userId: req.session.user_id,couponId: couponData[0]._id});


    const cartupdate = await Cart.updateOne({ userId: req.session.user_id },{ $unset: { couponId: "" } });
    const updateusdCopnData = await UsedCoupon.deleteOne({userId: req.session.user_id,couponId: couponData[0]._id, });
    console.log('couponData :'+couponData,'usdCopnData :'+usdCopnData,'cartupdate :'+cartupdate,'updateusdCopnData :'+updateusdCopnData);
    res.redirect("/cartdata");
  } catch (error) {
    console.log(error.message);
  }
}; */

const deleteCoupon = async (req, res) => {
  try {
    const couponData = await coupon.findById(req.query.id);
    /* if (!couponData) {
      return res.status(404).send("Coupon not found.");
    } */

    const usdCopnData = await UsedCoupon.findOne({
      userId: req.session.user_id,
      couponId: couponData._id,
    });
    /* if (!usdCopnData) {
      return res.status(404).send("Used coupon not found.");
    } */

    const cartupdate = await Cart.updateOne(
      { userId: req.session.user_id },
      { $unset: { couponId: "" } }
    );

    const updateusdCopnData = await UsedCoupon.deleteOne({
      userId: req.session.user_id,
      couponId: couponData._id,
    });

   /*  console.log(
      "couponData:",
      couponData,
      "usdCopnData:",
      usdCopnData,
      "cartupdate:",
      cartupdate,
      "updateusdCopnData:",
      updateusdCopnData
    ); */

    res.redirect("/cartdata");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};





const incrementQuantity = async (req, res) => {
  try {
    console.log(req.query);
    if(req.query.qty>0){
      let productData= await product.find({_id:req.query.productId})
      console.log(productData);
      if(productData[0].quantity > req.query.qty && req.query.qty < 3 ){
        let inc = await Cart.updateOne(
          { _id: req.query.cartId, "items.productId": req.query.productId },
          { $inc: { "items.$.quantity": 1 } }
        );
      }    
    }

    res.redirect("/cartdata");
  } catch (error) {
    console.log(error.message);
  }
};


const decrementQuantity = async (req, res) => {
  try {
    console.log(req.query);
    if(req.query.qty>1){
      let productData= await product.find({_id:req.query.productId})
      if(productData[0].quantity > req.query.qty ) {
        let inc = await Cart.updateOne(
          { _id: req.query.cartId, "items.productId": req.query.productId },
          { $inc: { "items.$.quantity": -1 } }
        );
      }    
    }
    res.redirect("/cartdata");
  } catch (error) {
    console.log(error.message);
  }
};



module.exports = {
  loadCart,
  addToCart,
  deleteFromCart,
  updateCoupon,
  deleteCoupon,
  decrementQuantity,
  incrementQuantity,
};
