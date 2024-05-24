const express = require('express')
const userRoute = express()
const session = require('express-session')
const nocache =require('nocache')


const config = require('../config/config')
userRoute.use(session({
    secret:config.sessionSecret,
    resave: false,
    saveUninitialized: true 
}))

userRoute.use(express.static('userAssets'))

userRoute.set("views","./views/user");

userRoute.use(nocache())

const userController = require('../controller/userController')

userRoute.get('/',userController.loadhome)
userRoute.get('/login',userController.loadLogin)
userRoute.post('/login',userController.verifyUserLogin)
userRoute.get('/userRegister',userController.userRegister)
userRoute.post('/userRegister',userController.insertUser)
userRoute.get('/otp',userController.loadOtp)
userRoute.post('/otp',userController.confirmOtp)
userRoute.get('/resend',userController.resendOtp)
userRoute.get('/profile',userController.userProfile)
userRoute.get('/edit',userController.loadeditUserData)
userRoute.post('/edit',userController.saveUserData)
userRoute.get('/address',userController.userAdress)
userRoute.get('/addaddress',userController.loadAddAddress)
userRoute.post('/addaddress',userController.saveAddress)
userRoute.get('/aEdit',userController.loadEditAddress)
userRoute.post('/aEdit',userController.updateAddress)
userRoute.get('/address/:id',userController.deleteAddress)
userRoute.get('/changepassword',userController.changePassword)
userRoute.post('/changepassword',userController.updatePassword )



userRoute.get('/logout',userController.logout)




module.exports=userRoute