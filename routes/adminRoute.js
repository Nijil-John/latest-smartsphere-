const express = require("express");
const adminRoute =express()
const session = require('express-session')
const caches= require('nocache')
/* const path =require('path') */

const config = require('../config/config')
adminRoute.use(session({
    secret:config.sessionSecret,
    resave: false,
    saveUninitialized: true 
}))




adminRoute.use(express.static('adminAsset'))
/* adminRoute.use(express.static(path.join(__dirname,'adminAsset'))) */


adminRoute.set("views","./views/admin");
const nocache = require("nocache");
adminRoute.use(nocache())
const uploadImage = require('../middleware/upload')
const adminController = require('../controller/adminController');


adminRoute.get('/',adminController.adminLoadlogin)
adminRoute.get('/register',adminController.adminLoadregister)
adminRoute.post('/register',adminController.adminRegister)
adminRoute.post('/',adminController.adminVerifyLogin)
adminRoute.get('/adminDashboard',adminController.adminDashboard)
adminRoute.get('/logout',adminController.adminLogout)
adminRoute.get('/customer',adminController.loadCustomer)

//category routes
const categoryController = require('../controller/categoryController')

adminRoute.get('/category',categoryController.loadCategory)
adminRoute.get('/addcategory',categoryController.loadAddCategory)
adminRoute.post('/addcategory',categoryController.addCatogeries)
adminRoute.get('/editCategory',categoryController.editCategory)
adminRoute.post('/editCategory',categoryController.updateCategory)
adminRoute.get('/category/:id',categoryController.categoryAction)


//product routes
const productController= require('../controller/productController')

adminRoute.get('/products',productController.loadProduct)
adminRoute.get('/addproduct',productController.loadAddProducts)
adminRoute.post('/addproduct',uploadImage.array('productImages', 4),productController.AddProducts)
adminRoute.get('/editproduct',productController.editProduct)
adminRoute.post('/editproduct',productController.updateProduct)

adminRoute.get('/products/:id',productController.productAction)




adminRoute.get('/customer/:id',adminController.customerAction)

adminRoute.get('/order',adminController.orderLoad)


//coupon Management
const couponController = require('../controller/couponController')
adminRoute.get('/coupon',couponController.loadCoupon)

// Banner management
const bannerController = require('../controller/bannarController')
adminRoute.get('/banner',bannerController.loadBanners)






module.exports=adminRoute