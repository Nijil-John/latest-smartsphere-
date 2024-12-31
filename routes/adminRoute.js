const express = require("express");
const adminRoute =express()
const session = require('express-session')
const caches= require('nocache')
const path =require('path')
const loginAuthenticator =require('../middleware/adminAuthentiction')


const config = require('../config/config')
adminRoute.use(session({
    name:'admin',
    secret:config.adminSessionSecret,
    resave: false,
    saveUninitialized: true ,
    cookie:{
      maxAge:1000*60*60*24,//7 days
      httpOnly:true
    }
}))




adminRoute.use(express.static('adminAsset'))
adminRoute.use(express.static(path.join(__dirname,'adminAsset')))


adminRoute.set("views","./views/admin");
const nocache = require("nocache");// repeations
adminRoute.use(nocache())
const uploadImage = require('../middleware/upload')
const adminController = require('../controller/adminController');


adminRoute.get('/',adminController.adminLoadlogin)
adminRoute.get('/register',adminController.adminLoadregister)
adminRoute.post('/register',adminController.adminRegister)
adminRoute.post('/',adminController.adminVerifyLogin)
adminRoute.get('/adminDashboard',loginAuthenticator,adminController.adminDashboard)
adminRoute.get('/dashboard',loginAuthenticator,adminController.adminDashboard)
adminRoute.get('/logout',adminController.adminLogout)
adminRoute.get('/customer',loginAuthenticator,adminController.loadCustomer)

//category routes
const categoryController = require('../controller/categoryController')

adminRoute.get('/category',loginAuthenticator,categoryController.loadCategory)
adminRoute.get('/addcategory',loginAuthenticator,categoryController.loadAddCategory)
adminRoute.post('/addcategory',loginAuthenticator,categoryController.addCatogeries)
adminRoute.get('/editCategory',loginAuthenticator,categoryController.editCategory)
adminRoute.post('/editCategory',loginAuthenticator,categoryController.updateCategory)
adminRoute.get('/category/:id',loginAuthenticator,categoryController.categoryAction)


//product routes
const productController= require('../controller/productController')

adminRoute.get('/products',loginAuthenticator,productController.loadProductAdmin)
adminRoute.get('/addproduct',loginAuthenticator,productController.loadAddProducts)
adminRoute.post('/addproduct',loginAuthenticator,uploadImage.array('productImages', 4),productController.AddProducts)
adminRoute.get('/editproduct',loginAuthenticator,productController.editProduct)
adminRoute.post('/editproduct',loginAuthenticator,uploadImage.array('productImages', 4),productController.updateProduct)

adminRoute.get('/products/:id',loginAuthenticator,productController.productAction)




adminRoute.get('/customer/:id',adminController.customerAction)
//Order
adminRoute.get('/order',loginAuthenticator,adminController.orderLoad)
adminRoute.get('/orderValues',loginAuthenticator,adminController.orderDetail)
adminRoute.post('/orderValues',loginAuthenticator,adminController.orderUpdate)/* (req,res)=>{
    console.log(req.body);
}) */

//coupon Management
const couponController = require('../controller/couponController')
adminRoute.get('/coupon',loginAuthenticator,couponController.loadCoupon)
adminRoute.get('/couponAdd',loginAuthenticator,couponController.couponForm)
adminRoute.post('/couponAdd',loginAuthenticator,couponController.addCoupon)
adminRoute.get('/coupons',loginAuthenticator,couponController.updatePageLoadCoupon)
adminRoute.post('/coupons',loginAuthenticator,couponController.updateCoupon)

// offer management
const adminOfferModuleController = require('../controller/offerModuleController')
adminRoute.get('/offer',loginAuthenticator,adminOfferModuleController.loadadminOfferModule)

//adminOfferModuleController.cronOfferStart();
adminOfferModuleController.implementOffer();

adminRoute.get('/addOffer',loginAuthenticator,adminOfferModuleController.productOffer)
adminRoute.post('/addOffer',loginAuthenticator,adminOfferModuleController.addOffer)
adminRoute.get('/specificOffer',loginAuthenticator,adminOfferModuleController.updateOffer)
adminRoute.post('/specificOffer',loginAuthenticator,adminOfferModuleController.updateOffer)

//salesreport
adminRoute.get('/salesreport' ,loginAuthenticator,adminController.salesreport)
adminRoute.get('/downloadPDFReport',loginAuthenticator,adminController.DownloadPDFSalesreport)
adminRoute.get('/downloadEXCELReport',loginAuthenticator,adminController.DownloadExcelSalesReport)




module.exports=adminRoute