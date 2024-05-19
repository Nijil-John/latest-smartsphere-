const  User = require('../models/userModel')
const otpUser=require('../models/otpModel')
const bcrypt= require('bcrypt')
const nodemailer= require('nodemailer')
const address= require('../models/adressModel')
const { render } = require('../routes/userRoute')




const loadhome=async (req,res)=>{
    try {
        if (req.session.user_id) {
          const userData = await User.findOne({_id:req.session.user_id})
          res.render('home',{users:userData})
          
        } else {
          res.render('home')
        }
       
    } catch (error) {
        console.log(error.message+" 20");
    }
}

const loadLogin =async (req,res)=>{
    try {
        res.render('userLogin')
    } catch (error) {
        console.log(error.message);
    }
}

const userRegister =async(req,res)=>{
    try {
        res.render('userRegister')
    } catch (error) {
        console.log(error.message);
    }
}

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message + " 10");
  }
};

//verify mail
const sendOtpMail = async (name, email, mobile, user_id, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "nijiljohn0804@gmail.com",
        pass: "yfcp xctt gsif lfcp",
      },
      secure: true, // Set secure to true for a secure connection
      requireTLS: true, // Require TLS for the connection
    });
    const mailOptions = {
      from: "importantOtp@gmail.com",
      to: email,
      subject: `Verification mail`,
      html: `<p>Hello ${name},this is your OTP: ${otp}.,mobile no:${mobile}, ${user_id}  Please do not share it with anyone.</p>`
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
  }
}

const insertUser = async (req, res) => {
  try {
    console.log(req.body);
    const secureUserPasswd = await securePassword(req.body.password);
    const existingUserEmail = await User.findOne({ email: req.body.email });
    const existingUserMobile = await User.findOne({ mobile: req.body.mobile });
    if (existingUserEmail) {
      return res.render("userRegister", { message: "email is already in use" });
    }
    if (existingUserMobile) {
      return res.render("userRegister", {
        message: "mobile is already in use ",
      });
    }
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: secureUserPasswd,
      isVerified: false,
      isAdmin:false,
     
    });
    console.log(newUser);
    const userData = await newUser.save();
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(otp);
    const newOtp = new otpUser({
      email: req.body.email,
      otp: otp,
    });

    const otpData = await newOtp.save();
    console.log(otpData);
    if (userData) {
      sendOtpMail(req.body.name,req.body.email,req.body.mobile,userData._id,otpData.otp);
      res.render("otpVerify", { message: "your registration is successfull" });
    } else {
      res.render("userRegister", { message: "failed to save the data" });
    }
  } catch (error) {
    console.log(error.message + "11");
  }
};

const loadOtp= async (req,res)=>{
    try {
        res.render('otpVerify')
    } catch (error) {
        console.log(error.message)
    }
}

const confirmOtp = async (req, res) => {
  try {
    const otpdetails= await otpUser.findOne({ otp: req.body.otp })
    const email =otpdetails.email;
    const otp = req.body.otp;
    const Vuser = await User.findOne({ email: email });

    if (otpdetails.otp === otp) {
      const updateInfo = await User.updateOne({ email: email }, { $set: { isVerified: true } });
     /*  console.log(updateInfo);
      console.log('Update successful'); */
      res.render('home',{users:Vuser})
    } else {
      console.log("failed");
      res.render('otpVerify',{message:"otp is incorrect"})
    }
  } catch (error) {
    console.log(error.message+"otp101");
  }
};

const verifyUserLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const loginUserData =await User.findOne({email:email})
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
          res.render("home",{users:loginUserData});
        }
      } else {
        res.render("userLogin", { message: "login credentials are incorrect" });
      }
    } else {
      res.render("userLogin", { message: "login credentials are incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req,res)=>{
  try {
    req.session.destroy()
    res.redirect("/")
} catch (error) {
    console.log(error.message);
}
}
const userProfile = async(req,res)=>{
  try {
    const _id =req.session.user_id
    const userData= await User.findOne({_id:_id})
    console.log(userData);
    res.render('userProfile',{users:userData})
  } catch (error) {
    console.log(error.message);
  }
}

const loadeditUserData =async (req,res)=>{
  try {
    const _id =req.session.user_id
    const userData= await User.findOne({_id:_id})
    res.render('editUser',{users:userData})
  } catch (error) {
    console.log(error.message);
  }
}

const saveUserData = async (req,res)=>{
  try {
    console.log(req.session)
    console.log(req.body);
    const _id =req.session.user_id
    const userData= await User.findOne({_id:_id})
    console.log(userData);
    const userEmail= await otpUser.findOne({email:userData.email})
    console.log(userEmail.otp);
    const name = req.body.name
    const email = req.body.email
    const mobile = req.body.mobile
    console.log(name,email,mobile);
    if (userData) {
      sendOtpMail(req.body.name,req.body.email,req.body.mobile,userData._id,userEmail.otp);
      res.render("otpVerify", { message: "your registration is successfull" });
      const flag =1
    } else {
      res.render("editUser", { message: "failed to save the data" });
    }
    if(flag=1){
      const updateInfo = await User.updateOne({ _id:_id }, { $set: { name:name,email:email,mobile:mobile} })
    console.log(updateInfo);
    const userNewData= await User.findOne({_id:_id})
    res.render('home',{users:userNewData})
    }
  } catch (error) {
    console.log(error.message +"10010");
  }
}


/* user Address */
const userAdress = async(req,res)=>{
  try {
    console.log(req.session);
    const addressData = await address.find({userId:req.session.user_id})
    const userData = await User.findOne({_id:req.session.user_id})
    res.render('userAddress',{users: userData ,address:addressData})
  } catch (error) {
    console.log(error.message);
  }
}

const loadAddAddress = async(req,res)=>{
  try {
    if (req.session.user_id) {
      
      const userData = await User.findOne({_id:req.session.user_id})
      res.render('addAddress',{users:userData})
    } else {
      
    }
  } catch (error) {
    console.log(error.message);
  }
}


const saveAddress =async(req,res)=>{
  try {
    console.log(req.body);
    if(req.session.user_id){
      const addressData = new address({
        userId:req.session.user_id,
        name:req.body.name,
        mobile:req.body.mobile,
        address:req.body.address,
        pincode:req.body.pincode,
        state:req.body.state,
        city:req.body.city,
        isDefault:false
      })
      const savedAddress= await addressData.save()
      console.log(savedAddress);
      res.redirect('/address')
    }    
  } catch (error) {
    console.log(error.message);
  }
}
const loadEditAddress = async(req,res)=>{
  try {
    const addId =req.query._id
    if(addId){
      addressData=await address.findById({_id:addId})
      userData =await User.findById({_id:addressData.userId})
      res.render('editAddress',{users:userData,address:addressData})}
  } catch (error) {
    console.log(error.message);
  }
}

const updateAddress =async (req,res)=>{
  try {
    const addId = req.query._id
    console.log(addId+" hits here");
    if(addId){
      addressData=await address.findById({_id:addId})
      userData =await User.findById({_id:addressData.userId})
      console.log(req.body.name+"hit user");
      console.log(addressData+"hit address"); 
      const addUp = await address.updateOne(
        { _id: addId }, // Use catId obtained from req.query._id
        {
            $set: {
              name:req.body.name,
              mobile:req.body.mobile,
              address:req.body.address,
              pincode:req.body.pincode,
              state:req.body.state,
              city:req.body.city
            }
        }
    )
    console.log(addUp);
     res.redirect('/address')
    }
  } catch (error) {
    console.log(error.message +"error here");
  }
}
const deleteAddress = async(req,res)=>{
  try {
    const addId = req.params.id
    console.log(addId+" address id");
    const check = await address.deleteOne({_id:addId})
    console.log(check+' here 339')
    
    res.redirect('/address');


  } catch (error) {
    console.log(error.message);
  }
}







module.exports={
    loadhome,
    loadLogin,
    verifyUserLogin,
    userRegister,
    insertUser,
    loadOtp,
    confirmOtp,
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


}