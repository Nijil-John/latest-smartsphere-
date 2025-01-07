const express = require('express')
const userRoute = express()
const session = require('express-session')
const nocache =require('nocache')
const config = require('../config/config')
const errorHandling= require('../middleware/errorHandler')
const loginAuthenticator =require('../middleware/userAuthentication')

userRoute.use(session({
    name:"user",
    secret:config.userSessionSecret,
    resave: false,
    saveUninitialized: true ,
    cookie:{
      maxAge:1000*60*60*24,//7 days
      httpOnly:true
    }
}))

userRoute.use(express.static('userAssets'))

userRoute.set("views","./views/user");

userRoute.use(nocache())

const userController = require('../controller/userController')
const productController = require('../controller/productController')
const categoryController = require('../controller/categoryController')
const cartController = require('../controller/cartController')
//google 

const pass=require('../middleware/oAuth')
userRoute.use(pass.initialize());
userRoute.use(pass.session());
userRoute.get('/auth/google',pass.authenticate('google',{scope:['email','profile']}))
userRoute.get('/auth/google/callback', pass.authenticate('google', {failureRedirect: '/login',}),
              (req, res) => {
                  // Store the user's name in the session
                  req.session.user_id = req.user._id;
                  res.redirect('/');
                },loginAuthenticator);
  




userRoute.get('/',userController.loadhome)
userRoute.get('/login',userController.loadLogin)
userRoute.post('/login',userController.verifyUserLogin)
userRoute.get('/userRegister',userController.userRegister)
userRoute.post('/userRegister',userController.insertUser)
userRoute.get('/otp',userController.loadOtp)
userRoute.post('/otp',userController.confirmOtp)
userRoute.get('/resend',userController.resendOtp)
userRoute.get('/forgotPassword',userController.loadforgotPassword)
userRoute.post('/forgotPassword',userController.forgotPassword)
userRoute.post('/forgotverify',userController.changeForgotPassword)


userRoute.get('/profile',loginAuthenticator,userController.userProfile)
userRoute.get('/edit',loginAuthenticator,userController.loadeditUserData)
userRoute.post('/edit',loginAuthenticator,userController.saveUserData)
//user Addresses
userRoute.get('/address',loginAuthenticator,userController.userAdress)
userRoute.get('/addaddress',loginAuthenticator,userController.loadAddAddress)
userRoute.post('/addaddress',loginAuthenticator,userController.saveAddress)
userRoute.get('/aEdit',loginAuthenticator,userController.loadEditAddress)
userRoute.post('/aEdit',loginAuthenticator,userController.updateAddress)
userRoute.get('/address/:id',loginAuthenticator,userController.deleteAddress)

userRoute.get('/changepassword',userController.changePassword)
userRoute.post('/changepassword',userController.updatePassword )

//product page load
userRoute.get('/product/id/:id', productController.loadProductUser);
userRoute.get("/search",productController.searchProduct)
userRoute.get('/searchSort',productController.searchSort)

//categoryWise
userRoute.get('/catogery/:id',categoryController.categoryWise)


//cart
userRoute.get('/cart',loginAuthenticator,cartController.addToCart)
userRoute.get('/cartdata',loginAuthenticator,cartController.loadCart)
userRoute.get('/cart/ItemDelete',loginAuthenticator,cartController.deleteFromCart)
userRoute.post('/couponcode',loginAuthenticator,cartController.updateCoupon)
userRoute.get('/deleteCoupon',loginAuthenticator,cartController.deleteCoupon)
userRoute.get('/incrementQuantity',loginAuthenticator,cartController.incrementQuantity)
userRoute.get('/decrementQuantity',loginAuthenticator,cartController.decrementQuantity)

const couponController=require('../controller/couponController')
//coupon
userRoute.get('/usercoupon',loginAuthenticator,userController.usercoupons)

//wishlist
const wishlistController = require('../controller/wishlistController')
userRoute.get("/moveToWishlist",loginAuthenticator,wishlistController.addToWishlist)
userRoute.get('/wishlist',loginAuthenticator,wishlistController.loadWishlist)
userRoute.get('/wishlist/delete',loginAuthenticator,wishlistController.removeFromWishList)

//user order page
userRoute.get('/orders',loginAuthenticator,userController.loadOrder)
userRoute.get('/orderDetails',loginAuthenticator,userController.orderDetails)
userRoute.get('/cancelOrder',loginAuthenticator,userController.loadCancel)
userRoute.post('/cancelreq',loginAuthenticator,userController.cancelOrder)

userRoute.get('/downloadInvoice',loginAuthenticator,userController.downloadInvoice)

userRoute.get('/returnRequest',loginAuthenticator,userController.returnReq)
userRoute.post('/returnRequest',loginAuthenticator,userController.confirmReturn)
userRoute.post('/verifyRetryPayment',loginAuthenticator,userController.initializeRetryPayment)
userRoute.post('/verifyRePayment',loginAuthenticator,userController.verifyRePayment)

//wallet
const walletController =require('../controller/walletController')
userRoute.get('/wallet',loginAuthenticator,walletController.loadWallet)
userRoute.get('/transactions',walletController.loadTransaction)
userRoute.post('/addfunds')
//sorts
userRoute.get('/sort',productController.sortProduct)

//checkout
userRoute.get('/checkout',loginAuthenticator,productController.checkout)

//place Order
userRoute.post('/createOrder',loginAuthenticator,productController.placeOrder)
userRoute.get('/success',loginAuthenticator,productController.success)
userRoute.post('/verifyPayment',loginAuthenticator,productController.verifyPayment)
//offer zone
offerModule = require('../controller/offerModuleController')

userRoute.get('/Offerzone',offerModule.userSideOffer)




userRoute.get('/logout',userController.logout)






module.exports=userRoute