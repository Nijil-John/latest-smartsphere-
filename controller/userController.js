const User = require("../models/userModel");
const otpUser = require("../models/otpModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const address = require("../models/adressModel");
//const { render } = require('../routes/userRoute')
const category = require("../models/categoryModel");
const product = require("../models/productModel");
require("dotenv").config();
const auth = require("../middleware/oAuth");
const cart = require("../models/cartModel");
const wishlist = require("../models/wishlistModel");
const Order = require("../models/orderModel");
const coupon = require("../models/couponModel");
const OrderReturn = require("../models/returnModel");
const usedCoupon = require("../models/usedCouponModel");
const wallet = require("../models/walletModel");
const offer = require("../models/offerModel");
const Razorpay = require("razorpay");
const crypto = require('crypto')
const PDFDocument= require('pdfkit')



var razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const loadhome = async (req, res) => {
  try {
    //console.log(req.session);
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = parseInt(req.query.limit) || 8; // Number of items per page
    const skip = (page - 1) * limit; // Calculate the number of items to skip

    //managing the offer card in the homepage
    const offerData = await offer.find({ status: "activated" });
    //console.log(offerData);

    let smallDate = 'no data';

    if (offerData && offerData.length > 0) {
      // Check if offerData exists and is not empty
      smallDate =
        offerData[0].endDate !== undefined
          ? offerData[0].endDate
          : new Date("December 17, 2024 23:59:59");

      for (let i = 1; i < offerData.length; i++) {
        if (new Date(offerData[i].endDate) < new Date(smallDate)) {
          smallDate = offerData[i].endDate;
        }
      }

     // console.log("Smallest endDate:", smallDate);
    }
   // console.log(smallDate);

    const productCount = await product.countDocuments(); // Get total product count
    const totalPages = Math.ceil(productCount / limit); // Calculate total pages

    const catData = await category.find({});
    const productData = await product
      .find({ isDelete: { $ne: "true" }, quantity: { $gte: 1 } })
      .skip(skip)
      .limit(limit); // Fetch paginated products

    if (req.session.user_id) {
      let userData = await User.findOne({ _id: req.session.user_id });
      const cartCt = await cart.find({ userId: userData._id });
      //console.log(cartCt);
      let cartCount = cartCt.length > 0 ? cartCt[0].items : 0;
      cartCount = cartCount ? cartCount.length : 0;
      let wishData = await wishlist.find({ userId: req.session.user_id });
      let wishLength = wishData.length;

      res.render("home", {
        wishlist: wishLength,
        Cart: cartCount,
        users: userData,
        categories: catData,
        product: productData,
        totalPages,
        limit,
        page,
        smallDate: smallDate,
        offerData,
      });
    } else {
      res.render("home", {
        /* users: userData, */
        categories: catData,
        product: productData,
        totalPages,
        limit,
        page,
        smallDate: smallDate,
        offerData,
      });
    }
  } catch (error) {
    // Pass the error to the error handling middleware
    console.log(error.message + " 20");
  }
};

const offercheck = async () => {
  try {
    const offerData = await offer.find({ status: "activated" });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    const catData = await category.find({});
    res.render("userLogin", { categories: catData });
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const userRegister = async (req, res) => {
  try {
    res.render("userRegister", { message: "" });
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message + " 10");
    next(error); // Pass the error to the error handling middleware
  }
};

//verify mail
const sendOtpMail = async (name, email, mobile, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_CODE,
      },
      secure: true, // Set secure to true for a secure connection
      requireTLS: true, // Require TLS for the connection
    });
    const mailOptions = {
      from: "importantOtp@gmail.com",
      to: email,
      subject: `Verification mail`,
      html: `<p>Hello ${name},this is your OTP: ${otp}.,mobile no:${mobile},Please do not share it with anyone.</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message + " - Error occurred while sending email."); // Print error message if sending email fails
      } else {
        console.log(`Email has been sent: ${info.response}`); // Print success message if email is sent successfully
      }
    });
  } catch (error) {
    console.log(error.message + " - Error occurred."); // Print error message if any other error occurs
    next(error); // Pass the error to the error handling middleware
  }
};

const otpGenarator = async (mail) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    //console.log(otp);
    const newOtp = new otpUser({
      email: mail,
      otp: otp,
    });
    const otpData = await newOtp.save();
    return otpData;
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    //console.log(req.body);
    const secureUserPasswd = await securePassword(req.body.password);
    const otpData = await otpGenarator(req.body.email);
    const existingUserEmail = await User.findOne({ email: req.body.email });
    const existingUserMobile = await User.findOne({ mobile: req.body.mobile });
    if (existingUserEmail) {
     // console.log("its here");

      return res.render("userRegister", { message: "email is already in use" });
    }
    if (existingUserMobile) {
      return res.render("userRegister", {
        message: "mobile is already in use ",
      });
    }
    req.session.userData = {
      name: req.body.name,
      phone: req.body.mobile,
      email: req.body.email,
      password: secureUserPasswd,
    };
    //console.log(req.session.userData);
    /* */
    //console.log(otpData);
    //const otpData = await newOtp.save();
    console.log(otpData);
    if (req.session.userData) {
      sendOtpMail(req.body.name, req.body.email, req.body.mobile, otpData.otp);
      res.render("otpVerify");
    } else {
      res.render("userRegister", { message: "failed to save the data" });
    }
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const loadOtp = async (req, res) => {
  try {
    res.render("otpVerify");
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const confirmOtp = async (req, res) => {
  try {
    const sUser = req.session.userData;
    console.log(sUser.email);
    savedOtp = await otpUser.findOne({ email: sUser.email });
    console.log(savedOtp.otp);
    enteredOtp = req.body.otp;
    console.log(enteredOtp);
    if (savedOtp.otp === enteredOtp) {
      const newUser = new User({
        name: sUser.name,
        email: sUser.email,
        mobile: sUser.phone,
        password: sUser.password,
        isVerified: true,
        isAdmin: false,
      });
      const userData = await newUser.save();
      res.redirect("/login");
    } else {
      res.render("otpVerify", { message: "wrong otp" });
    }
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
    console.log(error.message + "otp101");
  }
};

const resendOtp = async (req, res) => {
  try {
    const sUser = req.session.userData;
    savedOtp = await otpUser.findOne({ email: sUser.email });
    if (sUser) {
      sendOtpMail(sUser.name, sUser.email, sUser.phone, savedOtp.otp);
      res.render("otpVerify", { message: "Opt resend confirmed" });
    }
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const verifyUserLogin = async (req, res) => {
  try {
    console.log(req.body);
    const catData = await category.find({});
    const email = req.body.email;
    const password = req.body.password;
    const loginUserData = await User.findOne({ email: email });
    const productData = await product.find({});

    if (loginUserData) {
      const passwordCheck = await bcrypt.compare(
        password,
        loginUserData.password
      );
      if (passwordCheck) {
        if (loginUserData.isVerified === false) {
          res.render("otpVerify", { message: "please verify with OTP" });
        } else {
          req.session.user_id = loginUserData._id;
          res.redirect("/");
          //console.log(req.session);
        }
      } else {
        res.render("userLogin", {
          categories: catData,
          message: "login credentials are incorrect",
        });
      }
    } else {
      res.render("userLogin", {
        categories: catData,
        message: "login credentials are incorrect",
      });
    }
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};
const userProfile = async (req, res) => {
  try {
    const _id = req.session.user_id;
    const userData = await User.findOne({ _id: _id });
    //console.log(userData);
    res.render("userProfile", { users: userData });
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const loadeditUserData = async (req, res) => {
  try {
    const _id = req.session.user_id;
    const userData = await User.findOne({ _id: _id });
    res.render("editUser", { users: userData });
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const saveUserData = async (req, res) => {
  try {
   // console.log(req.session);
   // console.log(req.body);
    const id = req.session.user_id;
   // console.log(id);
    const userData = await User.findOne({ _id: id });
   // console.log(userData);
    //const userEmail= await otpUser.findOne({email:userData.email})
    //console.log(userEmail.otp);
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    //console.log(name,email,mobile);
    if (userData) {
      /* sendOtpMail(req.body.name,req.body.email,req.body.mobile,userData._id,userEmail.otp);
      res.render("otpVerify", { message: "your registration is successfull" });
       */
      const updateInfo = await User.updateOne(
        { _id: id },
        { $set: { name: name, email: email, mobile: mobile } }
      );
      console.log(updateInfo);
      res.redirect("/profile");
    } else {
      res.render("editUser", { message: "failed to save the data" });
    }
    /* if(flag=1){
      
    const userNewData= await User.findOne({_id:_id})
    res.render('home',{users:userNewData})
    } */
  } catch (error) {
    console.log(error.message + "10010");
    next(error); // Pass the error to the error handling middleware
  }
};

/* user Address */
const userAdress = async (req, res) => {
  try {
   // console.log(req.session);
    const addressData = await address.find({ userId: req.session.user_id });
    const userData = await User.findOne({ _id: req.session.user_id });
    res.render("userAddress", { users: userData, address: addressData });
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const loadAddAddress = async (req, res) => {
  try {
    if (req.session.user_id) {
      const userData = await User.findOne({ _id: req.session.user_id });
      res.render("addAddress", { users: userData });
    } else {
    }
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const saveAddress = async (req, res) => {
  try {
   // console.log(req.body);
    if (req.session.user_id) {
      const addressData = new address({
        userId: req.session.user_id,
        name: req.body.name,
        mobile: req.body.mobile,
        address: req.body.address,
        pincode: req.body.pincode,
        state: req.body.state,
        city: req.body.city,
        isDefault: false,
      });
      const savedAddress = await addressData.save();
      console.log(savedAddress);
      res.redirect("/address");
    }
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const addId = req.query._id;
    if (addId) {
      addressData = await address.findById({ _id: addId });
      userData = await User.findById({ _id: addressData.userId });
      res.render("editAddress", { users: userData, address: addressData });
    }
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const updateAddress = async (req, res) => {
  try {
    const addId = req.query._id;
    console.log(addId + " hits here");
    if (addId) {
      addressData = await address.findById({ _id: addId });
      userData = await User.findById({ _id: addressData.userId });
      console.log(req.body.name + "hit user");
      console.log(addressData + "hit address");
      const addUp = await address.updateOne(
        { _id: addId }, // Use catId obtained from req.query._id
        {
          $set: {
            name: req.body.name,
            mobile: req.body.mobile,
            address: req.body.address,
            pincode: req.body.pincode,
            state: req.body.state,
            city: req.body.city,
          },
        }
      );
      console.log(addUp);
      res.redirect("/address");
    }
  } catch (error) {
    console.log(error.message + "error here");
    next(error); // Pass the error to the error handling middleware
  }
};
const deleteAddress = async (req, res) => {
  try {
    const addId = req.params.id;
    console.log(addId + " address id");
    const check = await address.deleteOne({ _id: addId });
    console.log(check + " here 339");

    res.redirect("/address");
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};

const changePassword = async (req, res) => {
  try {
    const _id = req.session.user_id;
    const userData = await User.findOne({ _id: _id });
    res.render("changePassword", { users: userData });
  } catch (error) {
    console.log(error.message);
    next(error); // Pass the error to the error handling middleware
  }
};
const updatePassword = async (req, res) => {
  try {
    console.log(req.body);
    const oldpassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const secureUserPasswd = await securePassword(newPassword);
    const _id = req.session.user_id;
    const userData = await User.findOne({ _id: _id });
    console.log(userData);
    if (userData) {
      const oldCheck = await bcrypt.compare(oldpassword, userData.password);
      console.log(oldCheck);
      if (oldCheck) {
        const upPass = await User.updateOne(
          { _id: _id },
          { $set: { password: secureUserPasswd } }
        );
        console.log(upPass);
        res.redirect("/profile");
      } else {
        res.render("changePassword", {
          users: userData,
          message: "old password is not correct",
        });
      }
    }
  } catch (error) {
    console.log(error.message + " new password update lose");
    next(error); // Pass the error to the error handling middleware
  }
};

const loadforgotPassword = async (req, res) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    console.log(error.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    req.session.mail = req.body.email;
    const mail = req.body.email;
    const optData = await otpGenarator(mail);
    const userValues = await User.findOne({ email: mail });
    if (userValues) {
      const otpsend = await sendOtpMail(
        userValues.name,
        userValues.email,
        userValues.mobile,
        optData.otp
      );
    } else {
      res.render("forgotPassword", {
        message: "Email is not registered with us,sorry for the inconvenience!",
      });
    }

    res.render("forgotVerify");
    console.log(optData);
    console.log(mail);
  } catch (error) {
    console.log(error.message);
  }
};
const changeForgotPassword = async (req, res) => {
  try {
    const mail = req.session.mail;
    const recivedOtp = req.body.otp;
    const securedUserPasswd = await securePassword(req.body.password);
    const otpDataValue = await otpUser.findOne({ email: mail });
    if (otpDataValue.otp === recivedOtp) {
      const updatePassword = await User.updateOne(
        { email: otpDataValue.email },
        { $set: { password: securedUserPasswd } }
      );
      res.redirect("/login");
    } else {
      res.render("forgotVerify", { message: "wrong Otp" });
    }
    console.log(mail);
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrder = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    //console.log(userData);
    const orderData = await Order.find({ userId: userData._id });
    const dataList = orderData
      .map((order) => {
        return {
          orderId: order._id.toString(),
          userId: order.userId.toString(),
          itemsOrdered:
            order.items.length > 0
              ? order.items.map((item) => ({
                  productName: item.productName,
                  productId: item.productId.toString(),
                  price: `${item.price}`, // Assuming price is in cents
                  quantity: item.quantity,
                }))
              : "No items in this order.",

          totalAmount: order.totalAmount, // Assuming totalAmount is in cents
          orderStatus: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          shippingAddress: order.address.map((address) => ({
            addressId: address.shippingAddress,
          })),
          orderDate: order.createdAt.toLocaleString(), // Formats the date to a more readable string
        };
      })
      .reverse();

    //console.log(dataList);

    res.render("userOrderList", { users: userData, orders: dataList });
  } catch (error) {
    console.log(error.message);
  }
};
const orderDetails = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    const orderData = await Order.find({ _id: req.query.OrderId });
    let productArray = orderData[0].items;
    let addressArray = orderData[0].address;
    const couponData = await coupon.findById(orderData[0].couponId);

    let proData = [];
    let addressData = await address.findById(addressArray[0].shippingAddress);
    for (let i = 0; i < productArray.length; i++) {
      proData[i] = await product.findById(productArray[i].productId);
    }
    console.log(productArray);
    res.render("orderDetails", {
      users: userData,
      products: proData,
      quantity: productArray,
      order: orderData[0],
      address: addressData,
      coupon: couponData,
    });
  } catch (error) {
    console.log(error.message);
  }
};





const loadCancel=async(req,res)=>{
  try {
    const userData = await User.findById(req.session.user_id);
    //console.log(req.query.orderId);
    const orderData = await Order.findById(req.query.orderId);
    let productArray = orderData.items; // Assuming items is an
    let couponData = await coupon.findById(orderData.couponId);
    let proData = [];

    for (let i = 0; i < productArray.length; i++) {
      proData[i] = await product.findById(productArray[i].productId); // Correct indexing
    }



    res.render('orderCancel',{
      users: userData,
      products: proData,
      quantity: productArray,
      order:orderData,
      address: 'addressData',
      coupon: couponData,
    })
  } catch (error) {
    console.log(error.message);
  }
}








const cancelOrder = async (req, res) => {
  try {
    console.log(req.body);
    const {products,couponId,comment,orderId,status}=req.body
    const orderData = await Order.findById(orderId);
    const productOrder = orderData.items;
    const cancel = await Order.updateOne({ _id: orderId },{paymentStatus:"refunded", status: status , cancellReason:comment} );
    let productData = [];
    console.log(cancel)
    let walletData;
    if (
      orderData.paymentMethod == "ONLINE" &&
      orderData.paymentStatus == "paid"
    ) {
      walletData = await wallet.updateOne(
        { userId: req.session.user_id },
        {
          $inc: { balance: orderData.totalAmount },
          $push: {
            history: {
              amount: orderData.totalAmount,
              type: "credit",
              reason: `${orderData._id} this order is cancelled as per users request`,
            },
          },
        }
      );
    }
    console.log(walletData);

    for (let i = 0; i < productOrder.length; i++) {
      productData[i] = await product.updateOne(
        { _id: productOrder[i].productId },
        { $inc: { quantity: productOrder[i].quantity,salesCount: -productOrder[i].quantity } }
      );
    }
    console.log(productData);
    res.redirect("/orders");
  } catch (error) {
    console.log(error.message);
  }
};
const returnReq = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    //console.log(req.query.orderId);
    const orderData = await Order.findById(req.query.orderId);
    let productArray = orderData.items; // Assuming items is an
    let couponData = await coupon.findById(orderData.couponId);
    let proData = [];

    for (let i = 0; i < productArray.length; i++) {
      proData[i] = await product.findById(productArray[i].productId); // Correct indexing
    }

    console.log(proData);
    res.render("returnReq", {
      users: userData,
      products: proData,
      quantity: productArray,
      order: orderData,
      address: "addressData",
      coupon: couponData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const confirmReturn = async (req, res) => {
  try {
    console.log(req.body);
    let { returnReason, comment, orderId, products, status } = req.body;
    const returnReq = new OrderReturn({
      orderId: orderId,
      items: products,
      userId: req.session.user_id,
      reason: returnReason,
      comment: comment,
    });
    const a = await returnReq.save();
    console.log(a);
    const updateOrder = await Order.updateOne(
      { _id: orderId },
      { status: status }
    );
    console.log(updateOrder);
    res.redirect("/orders");
  } catch (error) {
    console.log(error.message);
  }
};

const usercoupons = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    const couponData = await coupon.find();
    const usedCopnData = await usedCoupon.find({ userId: req.session.user_id });

    // Create a Set of used coupon IDs for efficient lookup
    const usedCouponIds = new Set(
      usedCopnData.map((item) => item.couponId.toString())
    );

    // Add a usedCount field to each coupon based on the lookup
    couponData.forEach((coupon) => {
      coupon.usedCount = usedCouponIds.has(coupon._id.toString()) ? 1 : 0;
    });

    console.log(usedCopnData.length);
    res.render("userCoupon", { users: userData, coupon: couponData });
  } catch (error) {
    console.log(error.message);
  }
};


const initializeRetryPayment = async (req, res) => {
  try {
    const { user_id, order_id } = req.body; // `order_id` should be your MongoDB _id, not Razorpay Order ID
    console.log(req.body);

    // Fetch order details from the database
    const order = await Order.findById(order_id); // Ensure `order_id` is the MongoDB document ID
    //console.log(order);

    if (!order || order.userId.toString() !== user_id) {
      return res.status(400).json({ success: false, msg: "Invalid order details." });
    }

    // Create a new Razorpay order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: order.totalAmount * 100, // Amount in paise (e.g., 50000 paise = 500 INR)
      currency: "INR",
      receipt: `receipt_${order._id}`, // Use MongoDB `_id` for the receipt
    });
    

    // Return Razorpay order details to the frontend
    res.json({
      success: true,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      order_id: razorpayOrder.id, // Razorpay order ID for payment processing
      name: 'User',
      email: 'UserEmail',
      contact: 'userContact',
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    res.status(500).json({ success: false, msg: "Failed to initialize payment." });
  }
};


// Controller for verifying retry payment
const verifyRePayment = async (req, res) => {
  try {
    console.log('hello');
    const { payment_id, order_id, signature,orderPayId } = req.body;
    console.log(req.body )
    const data = orderPayId + "|" + payment_id;
console.log("Data being signed:", data);
    // Verify signature
    const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(data)
    .digest("hex");
    console.log(generatedSignature);
    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, msg: "Invalid payment signature." });
    }

    // Update order payment status in the database (replace with your DB logic)
    await Order.findByIdAndUpdate(order_id, {
      paymentStatus: "paid",
      paymentMethod: "ONLINE",
    });

    res.json({ success: true, msg: "Payment verified successfully." });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, msg: "Failed to verify payment." });
  }
};



const downloadInvoice = async (req, res) => {
  try {
    // Fetch the order data
    const orderId = req.query.orderId;
    const orderData = await Order.findById(orderId);

    if (!orderData) {
      return res.status(404).send({ message: 'Order not found' });
    }

    // Fetch related data
    const userData = await User.findById(orderData.userId);
    const couponData = await coupon.findById(orderData.couponId);
    const addressData = await address.findById(orderData.address[0]?.shippingAddress);

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderData.orderId}.pdf`);

    const generatedAt = new Date().toLocaleString();
    doc.fontSize(10).text(`Generated: ${generatedAt}`);

    // Stream the PDF to the response
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(20).text('Sales Invoice', { align: 'center' });
    doc.moveDown();

    // Order details
    doc.fontSize(14).text(`Order ID: ${orderData.orderId}`);
    doc.text(`Date: ${new Date(orderData.createdAt).toLocaleDateString()}`);
    doc.text(`Status: ${orderData.status}`);
    doc.text(`Payment Method: ${orderData.paymentMethod}`);
    doc.text(`Payment Status: ${orderData.paymentStatus}`);
    doc.moveDown();

    // User details
    doc.fontSize(16).text('Customer Details:');
    doc.fontSize(12).text(`Name: ${userData?.name || 'N/A'}`);
    doc.text(`Email: ${userData?.email || 'N/A'}`);
    doc.text(`Phone: ${userData?.phone || 'N/A'}`);
    doc.moveDown();

    // Address details
    doc.fontSize(16).text('Shipping Address:');
    doc.fontSize(12).text(
      `${addressData?.name || 'N/A'}, ${addressData?.mobile || 'N/A'}${addressData?.address || 'N/A'}, ${addressData?.city || 'N/A'}, ${addressData?.state || 'N/A'}, ${addressData?.pincode || 'N/A'}`
    );
    doc.moveDown();

    // Order items
    doc.fontSize(16).text('Items:');
    orderData.items.forEach(item => {
      doc.fontSize(12).text(
        `${item.productName} - Quantity: ${item.quantity},  Price:  ${item.price}`
      );
    });
    doc.moveDown();

    // Pricing details
    doc.fontSize(16).text('Pricing Summary:');
    doc.fontSize(12).text(`Subtotal: (Rs) ${orderData.totalAmount + orderData.couponDiscountAmount - orderData.shippingCost - orderData.offerDiscount}`);
    doc.text(`Coupon Discount (${couponData?.code || 'N/A'}): - (Rs) ${orderData.couponDiscountAmount}`);
    doc.text(`Offer Discount: - (Rs) ${orderData.offerDiscount}`);
    doc.text(`Shipping Cost: (Rs) ${orderData.shippingCost}`);
    doc.moveDown();
    doc.fontSize(14).text(`Total Amount: (Rs) ${orderData.totalAmount}`, { align: 'right' });

    // Finalize the PDF document
    doc.end();


  } catch (error) {
    console.log(error.message)
  }
}









module.exports = {
  loadhome,
  loadLogin,
  verifyUserLogin,
  userRegister,
  insertUser,
  loadOtp,
  confirmOtp,
  resendOtp,
  logout,
  userProfile,
  loadeditUserData,
  saveUserData,
  userAdress,
  loadAddAddress,
  saveAddress,
  loadEditAddress,
  updateAddress,
  deleteAddress,
  changePassword,
  updatePassword,
  loadforgotPassword,
  forgotPassword,
  changeForgotPassword,
  loadOrder,
  orderDetails,
  cancelOrder,
  returnReq,
  confirmReturn,
  usercoupons,
  initializeRetryPayment,
  verifyRePayment,
  loadCancel,
  downloadInvoice
  

}
