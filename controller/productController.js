const product = require("../models/productModel");
const category = require("../models/categoryModel");
const catcontroller = require("./categoryController");
const sharp = require("sharp");
const user = require("../models/userModel");
const Address = require("../models/adressModel");
const cart = require("../models/cartModel");
const order = require("../models/orderModel");
const wishlist = require("../models/wishlistModel");
const coupon = require("../models/couponModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");

var razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* products Settings */
const loadProductAdmin = async (req, res) => {
  try {
    const adminData = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Perform aggregation to join Product collection with Category collection and apply pagination
    const productsWithCategory = await product.aggregate([
      {
        $lookup: {
          from: "categories", // Name of the Category collection
          localField: "categoryId", // Field in the Product collection
          foreignField: "_id", // Field in the Category collection
          as: "category", // Name of the field to store the matched category data
        },
      },
      {
        $unwind: "$category", // Deconstruct the category array created by $lookup
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          name: 1,
          description: 1,
          price: 1,
          originalPrice:1,
          quantity: 1,
          brand:1,
          productImage: 1,
          categoryName: "$category.categoryName", // Extract the category name
          isDelete: 1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Count total products for pagination
    const totalProducts = await product.countDocuments();

    // If skip is greater than or equal to total product count, return 404
    /* if (skip >= totalProducts) {
            return res.status(404).send('Page not found');
        }
 */
    // Render the product details with category name and pagination data
    res.render("adminProduct", {
      product: productsWithCategory,
      admin: adminData,
      page,
      totalPages: Math.ceil(totalProducts / limit),
      limit,
    });
  } catch (error) {
    console.log(error.message);
    //res.status(500).json({ message: error.message })
  }
};

//edit product
const editProduct = async (req, res) => {
  try {
    const prodt = req.query._id;
    req.session.productId = prodt;
    productData = await product.findOne({ productId: prodt });
    const catData = await category.find({});
    res.render("editProduct", {
      admin: "new",
      product: productData,
      categories: catData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//const Product = require('../models/product'); // Ensure the correct path to your product model

const updateProduct = async (req, res) => {
  try {
    const {
      productId,
      brandName,
      productName,
      productPrice,
      productQuantity,
      productCategory,
      productDescription,
      existingImages,
    } = req.body;

    // Prepare the update data
    const updateData = {
      name: productName,
      brand:brandName,
      price: productPrice,
      quantity: productQuantity,
      categoryId: productCategory,
      description: productDescription,
    };

    // Handle new images
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map((file) => ({
        name: file.originalname,
        path: "productAssets/" + file.filename,
      }));
    }

    // Handle existing images
    let existingImagesArray = [];
    if (existingImages) {
      existingImagesArray = Array.isArray(existingImages)
        ? existingImages
        : [existingImages];
      existingImagesArray = existingImagesArray.map((img) => ({ path: img }));
    }

    // Combine existing and new images
    updateData.productImage = [...existingImagesArray, ...newImages];

    // Update the product
    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send("Product not found");
    }

    res.redirect("/admin/products"); // Redirect after successful update
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error"); // Handle error response
  }
};

//product block unblock
const productAction = async (req, res) => {
  try {
    const proId = req.params.id;
    console.log(proId);
    const productData = await product.findOne({ productId: proId });
    if (proId) {
      if (productData.isDelete === false) {
        const block = await product.updateOne(
          { productId: proId },
          { $set: { isDelete: true } }
        );

        console.log(block + "its blocked");
      } else {
        const unblock = await product.updateOne(
          { productId: proId },
          { $set: { isDelete: false } }
        );
        console.log(unblock + "its unblocked");
        loadProduct();
      }
    } else {
      console.log("data is not here");
    }
  } catch (error) {
    console.log(error.message + " its here");
  }
};

/* add products */
const loadAddProducts = async (req, res) => {
  try {
    const categoryData = await category.find({});
    res.render("adminAddProduct", { admin: "new", categories: categoryData });
  } catch (error) {
    console.log(error.message);
  }
};

const AddProducts = async (req, res) => {
  try {
    const uniqueId = await catcontroller.ShortUniqueId();
    console.log(uniqueId);

    let images = [];
    req.files.forEach((element) => {
      let img = {
        name: element.originalname, // Use originalname or other appropriate property
        path: element.path,
      };
      images.push(img);
    });

    const categoryData = await category.find({});
    const addProduct = new product({
      productId: uniqueId,
      name: req.body.productName,
      brand:req.body.brandName,
      description: req.body.productDescription,
      price: req.body.productPrice,
      categoryId: req.body.productCategory,
      productImage: images,
      quantity: req.body.productQuantity,
      originalPrice:req.body.productPrice
    });

    console.log(addProduct);
    const dbProduct = await addProduct.save();

    console.log(dbProduct);
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message + " here addproduct");
  }
};

const cropImage = async (req, res) => {
  try {
    await sharp("image")
      .extract({ width: 500, height: 330, left: 120, top: 70 })
      .toFile("image");
  } catch (error) {
    console.log(error.message);
  }
};

const loadProductUser = async (req, res) => {
  try {
    const productId = req.params.id; // Extract productId from the route
    const userData = await user.find({ _id: req.session.user_id });
    const productData = await product.findOne({ productId: productId });
    const catData = await category.find({});
    const cartData = await cart.find({ userId: req.session.user_id });
    let wishCount = await wishlist.countDocuments({
      userId: req.session.user_id,
    });
    let cartCount = cartData.items;
    cartCount = cartCount ? cartCount.length : 0;

    //console.log(cartData);
    let targetCategory = await catData.filter((item) =>
      item._id.equals(productData.categoryId)
    );
    //console.log(userData);
    let catValue = targetCategory[0];

    //let value = catData.filter(item=> item.productData.categoryId == '6649d0375342feb7499b8c9c')
    const userValue = userData[0];

    //console.log(userValue);
    if (!productData) {
      return res.status(404).send("Product not found");
    }

    //res.render("productPage", { categories: catData,users:userData,  product: productData });
    if (userValue !== undefined) {
      res.render("productPage", {
        categories: catData,
        proCat: catValue,
        users: userValue,
        product: productData,
        cart: cartData.length,
        cartCount,
        wishCount,
      });
    } else {
      res.render("productPage", {
        categories: catData,
        proCat: catValue,
        product: productData,
        cart: 0,
        cartCount,
        wishCount,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

const searchProduct = async (req, res) => {
  try {
    const userData = await user.find({ _id: req.session.user_id });
    const catData = await category.find();
    const { searchQuery, productCategory } = req.query;
    console.log(searchQuery, productCategory);

    let products;
    if (searchQuery && productCategory !== "all") {
      products = await product.find({
        $and: [
          { categoryId: productCategory },
          { name: { $regex: searchQuery, $options: "i" } },
          { isDelete: { $ne: "true" } },
        ],
      });
    } else if (productCategory !== "all") {
      products = await product.find({$and:[{ categoryId: productCategory },{ isDelete: { $ne: "true" } },]});
    } else if (searchQuery) {
      products = await product.find({
        $and:[ {name: { $regex: searchQuery, $options: "i" }},{ isDelete: { $ne: "true" } },]
      });
    }

    res.render("searchWise", {
      users: userData,
      categories: catData,
      product: products,
      searchQuery,
      productCategory,
      message: "based on search details",
    });
    if ((searchQuery === undefined, productCategory === "all")) {
      res.redirect("/");
    }
    //console.log(products);
  } catch (error) {
    console.log(error.message);
  }
};

const searchSort = async (req, res) => {
  try {
    // Example user data, categories, and query params
    const userData = await user.findById(req.session.user_id);
    const catData = await category.find();

    const { value, searchtext, productCategoryId } = req.query;
    // Initialize the query
    let querys = {};
    let conditions = [];

    // Add searchtext condition
    if (searchtext) {
      conditions.push({ name: { $regex: searchtext, $options: "i" } },{$and:[{ isDelete: { $ne: "true" }}] });
    }

    // Add productCategoryId condition
    if (productCategoryId) {
      if (mongoose.Types.ObjectId.isValid(productCategoryId)) {
        conditions.push({
          categoryId: new mongoose.Types.ObjectId(productCategoryId),
        });
      }
    }

    // Combine conditions with $and if both are present
    if (conditions.length > 0) {
      querys.$and = conditions; // Ensures all conditions are satisfied
    } else {
      querys = conditions;
    }

    console.log("Query:", JSON.stringify(querys, null, 2));

    let message;
    let productData;
    if (value === "1") {
      productData = await product.find(querys).sort({ price: 1 }); // Fetch paginated products
      message = "based on price low to high";
    } else if (value === "2") {
      productData = await product.find(querys).sort({ price: -1 }); // Fetch paginated products
      message = "based on price high to low";
    } else if (value === "3") {
      productData = await product.find(querys).sort({ name: 1 }); // Fetch paginated products
      message = "based on Aa to Zz";
    } else if (value === "4") {
      productData = await product.find(querys).sort({ name: -1 }); // Fetch paginated products
      message = "based on Zz to Aa";
    }

    // Initialize the query

    // Perform the query

    // Render the response
    res.render("searchWise", {
      users: userData,
      categories: catData,
      product: productData,
      searchQuery: searchtext || "",
      productCategory: productCategoryId || "",
      message: message,
    });
  } catch (error) {
    console.error("Error:", error.message);
    //res.status(500).send('An error occurred while searching for products');
  }
};

const sortProduct = async (req, res) => {
  try {
    console.log(req.query);
    if (req.query) {
      req.session.Value = req.query.value;
    }
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = parseInt(req.query.limit) || 8; // Number of items per page
    const skip = (page - 1) * limit; // Calculate the number of items to skip
    const productCount = await product.countDocuments(); // Get total product count
    const totalPages = Math.ceil(productCount / limit); // Calculate total pages
    //console.log(skip);
    let productData;
    let message;
    const catData = await category.find({});
    if (req.session.Value === "1") {
      productData = await product
        .find({$and:[{ isDelete: { $ne: "true" }}] })
        .sort({ price: 1 })
        .skip(skip)
        .limit(limit); // Fetch paginated products
      message = "based on price low to high";
    } else if (req.session.Value === "2") {
      productData = await product
        .find({$and:[{ isDelete: { $ne: "true" }}] })
        .sort({ price: -1 })
        .skip(skip)
        .limit(limit); // Fetch paginated products
      message = "based on price high to low";
    } else if (req.session.Value === "3") {
      productData = await product
        .find({$and:[{ isDelete: { $ne: "true" }}] })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit); // Fetch paginated products
      message = "based on Aa to Zz";
    } else if (req.session.Value === "4") {
      productData = await product
        .find({$and:[{ isDelete: { $ne: "true" }}] })
        .sort({ name: -1 })
        .skip(skip)
        .limit(limit); // Fetch paginated products
      message = "based on Zz to Aa";
    }
    //console.log(productData);
    res.render("sortWise", {
      categories: catData,
      product: productData,
      page,
      totalPages,
      limit,
      message,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const checkout = async (req, res) => {
  try {
    //console.log(req.params);
    const userData = await user.find({ _id: req.session.user_id });
    const addressData = await Address.find({ userId: req.session.user_id });
    const catData = await category.find({});
    const cartData = await cart.find({ userId: req.session.user_id });
    let couponData;
    if (cartData[0].couponId) {
      couponData = await coupon.findById(cartData[0].couponId);
    }
    console.log("couponData :" + couponData);
    let wishCount = await wishlist.countDocuments({
      userId: req.session.user_id,
    });
    let cartItems = cartData[0].items;
    console.log("cartItems :" + cartItems);
    let productData = [];
    for (let i = 0; i < cartItems.length; i++) {
      productData[i] = await product.findById(cartItems[i].productId);
    }
    for (let i = 0; i < cartItems.length; i++) {
      productData[i].__v = cartItems[i].quantity;
    }

    for (let i = 0; i < productData.length; i++) {
      for (let j = 0; j < cartItems.length; j++) {
        if (
          productData[i]._id.toString() === cartItems[j].productId.toString()
        ) {
          // console.log('its reached here');
          productData[i].__v = cartItems[j].quantity;
          //console.log(productData[i]);
        }
      }
    }

    console.log("productData :" + productData, "cartData :" + cartData);

    let finalTotalPrice = productData.reduce(
      (acc, product) => acc + product.price * product.__v,
      0
    );
    console.log(finalTotalPrice);
    let discountPersentageAmount;
    let finalTotal;
    if (couponData) {
      if(couponData){
        if (couponData.minPurchaseAmount < finalTotalPrice) {
          console.log("here coupon");
          if(couponData.discountType=='percentage'){
            discountPersentageAmount=(finalTotalPrice*couponData.discountValue)/100
            if(discountPersentageAmount > couponData.maxDiscountAmount){
            finalTotal = finalTotalPrice - couponData.maxDiscountAmount
            }else{
          finalTotal = finalTotalPrice - discountPersentageAmount
          couponData.maxDiscountAmount=discountPersentageAmount
            }

          }else if(couponData.discountType=='fixed-amount'){
          finalTotal = finalTotalPrice - couponData.maxDiscountAmount
          }
        } else {
          finalTotal = finalTotalPrice;
        }
      }
    } else {
      finalTotal = finalTotalPrice;
    }
    console.log("finalamount :" + finalTotal);

    res.render("checkOut", {
      categories: catData,
      proCat: "v",
      address: addressData,
      cart: cartData,
      products: productData,
      users: userData,
      total: finalTotal,
      coupon: couponData,
      wishCount,
    });
  } catch (error) {
    console.log("error message:" + error.message);
  }
};



const placeOrder = async (req, res) => {
  try {
    console.log(req.body);
    let { addressId,fullName,address,city,state,pincode,mobile,payment,products,totalAmount,couponId,couponDiscountAmount,totalOfferDiscount} = req.body;
    const userData = await user.find({ _id: req.session.user_id });
    const uniqueId = await catcontroller.ShortUniqueId();
    console.log(uniqueId);
    // Save new address if provided
    if (fullName && address && city && state && pincode && mobile) {
      const addAddress = new Address({
        userId: req.session.user_id,
        name: fullName,
        mobile: mobile,
        address: address,
        pincode: pincode,
        state: state,
        city: city,
        isDefault: false,
      });
      const savedAddress = await addAddress.save();
      addressId = savedAddress._id;
    }

    // Create new order
    const addOrder = new order({
      userId: req.session.user_id,
      orderId:uniqueId,
      items: products,
      totalAmount: totalAmount,
      paymentMethod: payment,
      address: [
        {
          shippingAddress: addressId,
          billingAddress: addressId,
        },
      ],
      couponId: couponId,
      couponDiscountAmount:couponDiscountAmount,
      offerDiscount:totalOfferDiscount
    });

    if (payment === "COD") {
      // Save order and render success page for COD
      await addOrder.save();

      // Clear cart and update product quantities
      await clearCartAndUpdateProducts(req.session.user_id, products);
      return res.render("success", { categories: "data" });
    } else if (payment === "ONLINE") {
      const amount = parseInt(totalAmount) * 100; // Convert to paise for Razorpay
      const options = {
        amount: amount,
        currency: "INR",
        receipt: `order_rcptid_${Date.now()}`,
      };

      razorpayInstance.orders.create(options, async (err, order) => {
        if (!err) {
          // Save order to database

          addOrder.paymentStatus = "failed";
          orderDB = await addOrder.save();
          console.log(orderDB);
          req.session.order_id = orderDB._id;

          res.status(200).send({
            success: true,
            msg: "Order Created",
            order_id: order.id,
            amount: amount,
            key_id: process.env.RAZORPAY_KEY_ID,
            /*  product_name: products.map(p => p.productName).join(', '), */
            contact: userData[0].mobile || "8567345632",
            name: userData[0].name || "User Name",
            email: userData[0].email || "user@example.com",
          }); 
        } else {
          res.status(500).send({
            success: false,
            msg: "Failed to create Razorpay order",
            error: err.message,
          });
        }
      });
    }

    // Clear cart and update product quantities
    await clearCartAndUpdateProducts(req.session.user_id, products);
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, msg: "Internal server error" });
  }
};

// Helper function to clear cart and update product quantities
const clearCartAndUpdateProducts = async (userId, products) => {
  const cartItems = await cart.find({ userId });
  for (const item of cartItems) {
    await cart.deleteOne({ _id: item._id });
  }

  let decreaseQuantity = []
  for (let i = 0; i < products.length; i++) {
    decreaseQuantity[i] = await product.updateOne(
      { _id: products[i].productId },
      { $inc: { quantity: -products[i].quantity,salesCount:products[i].quantity } }
    );
  }
  console.log(decreaseQuantity)
};
const success = async (req, res) => {
  try {
    const userData = await user.find({ _id: req.session.user_id });
    res.render("success", { categories: "data", users: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { payment_id, order_id, signature } = req.body;
    console.log(req.body);

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(order_id + "|" + payment_id)
      .digest("hex");

    let updatedOrder;
    if (generatedSignature === signature) {
      // Payment verified
      updatedOrder = await order.findOneAndUpdate(
        { _id: req.session.order_id },
        { paymentStatus: "paid", razorpayPaymentId: payment_id },
        { new: true }
      );

      if (updatedOrder) {
        res.status(200).send({ success: true, msg: "Payment verified" });
      } else {
        res.status(404).send({ success: false, msg: "Order not found" });
      }
    } else {
      // Invalid signature
      res
        .status(400)
        .send({ success: false, msg: "Invalid payment signature" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, msg: "Internal server error" });
  }
};






module.exports = {
  loadProductAdmin,
  loadAddProducts,
  AddProducts,
  editProduct,
  updateProduct,
  loadProductUser,
  productAction,
  searchProduct,
  searchSort,
  sortProduct,
  checkout,
  placeOrder,
  success,
  verifyPayment,
};
