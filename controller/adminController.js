const admin = require('../models/adminModel')
const bcrypt = require("bcrypt")
const user =require('../models/userModel')
const category=require('../models/categoryModel')
const product = require('../models/productModel')


/* admin settings */
const adminLoadlogin = async(req,res)=>{
    try {
        res.render('adminLogin')
    } catch (error) {
        console.log(error.message);
    }
}
const adminLoadregister=async(req,res)=>{
    try {
        res.render('adminRegister')
    } catch (error) {
        console.log(error.message);
    }
}
const securepassword =async(password)=>{
    try {
        const passwordHashed = await bcrypt.hash(password,10)
        return passwordHashed
    } catch (error) {
        console.log(error.message);
    }
}
const adminRegister = async(req,res)=>{
    try {
        console.log(req.body.DOB);
        const securedPassword = await securepassword(req.body.password)

        const existingEmail = await admin.findOne({email:req.body.email})
        const existingMobile = await admin.findOne({email:req.body.mobile})

        if(existingEmail){
            return res.render('adminRegister',{message:"Email is already in use!"})
        }
        if(existingMobile){
            return res.render('adminRegister',{message:"Mobile is already in use!"})
        }
        const newAdmin = new admin({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        DOB: req.body.DOB,
        password: securedPassword,
        isAdmin: true,
        isVerified: true,
        blocked:false
        })
        console.log(newAdmin);
     

    const adminData = await newAdmin.save();
    if (adminData) {
      res.redirect("/adminDashboard", {message: "Your registration was successful!"});
    } else {
      res.render("adminRegister", { message: "Your registration failed!" });
    }

    } catch (error) {
        console.log(error.message+" admin insert");
    }
}
const adminVerifyLogin =async(req,res)=>{
    try {
        console.log(req.body);
        const email = req.body.email
        const password = req.body.password
        const loginData = await admin.findOne({email:email})
        if(loginData){
            const passwordCheck = await bcrypt.compare(password,loginData.password)
            if (passwordCheck) {
                if (loginData.isAdmin === false) {
                  res.render("adminLogin", { message: "please verify your mail" });
                } else {
                    console.log(loginData._id);
                  req.session.adminData = loginData
                  res.redirect("adminDashboard")
                }
              } else {
                res.render("adminLogin", { message: "Password incorrect"  });
              }}else{
                res.render("adminLogin", { message: "Email dose'nt exist" })
              }
        
    } catch (error) {
        console.log(error.message+" verifylogin");
    }
}
const adminDashboard =async (req,res)=>{
    try {
        console.log(req.session);
        const adminData=req.session
        res.render('adminDashboard',{admin:adminData})
    } catch (error) {
        console.log(error.message);
    }
}
const adminLogout = async (req, res) => {
    try {
      req.session.destroy();
      res.render("adminLogin",{message:'logout succcesfully'});
      console.log(req.session);
    } catch (error) {
      console.log(error.message);
    }
  };
  /* customer settings */
const loadCustomer = async (req,res)=>{
    try {
        if(req.session){
            var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

            const userDatas = await user.find({
                isAdmin: false,
                $or: [
                  { name: { $regex: ".*" + search + ".*", $options: "i" } },
                  { email: { $regex: ".*" + search + ".*", $options: "i" } },
                  { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
                ],
              });
            res.render('adminCustomer',{admin:req.session,user:userDatas})
        }
    } catch (error) {
        console.log(error.message+" customer")
    }
}
/* block /unblock the customer */
const customerAction = async (req,res)=>{
    try {
        const userId =req.params.id
        const userData= await user.findOne({_id:userId})
        if(userId){
           if(userData.blocked === false){
            const block=await user.updateOne({ _id: userId }, { $set: { blocked: true } })
            
            console.log(block + "its blocked");
           }else{
            const unblock=await user.updateOne({ _id: userId }, { $set: { blocked: false } })
            console.log(unblock+"its unblocked");
            
           }

        }
    } catch (error) {
        console.log(error.message +" its here");
    }
}





/* Category settings */
const loadCategory =async(req,res)=>{
   try {
    if(req.session){

        console.log(req.session);
        const categoryData = await category.find({})
        const admin = req.session
        res.render('adminCategory',{admin:admin,category:categoryData,user:"new"})
    }
   } catch (error) {
    console.log(error.message);
   }
}
const addCatogeries = async(req,res)=>{
    try {
       
        const addCategory= new category({
            categoryId:req.body.categoryId,
            categoryName:req.body.categoryName,
            categoryDescription :req.body.categoryDescription
        })
        const categoryData= await addCategory.save()
        if(categoryData){
            res.redirect('/admin/category')
        }
    } catch (error) {
        console.log(error.message+' cateory adding issue');
    }
}
/* edit category */
const editCategory = async(req,res)=>{
    try {
        const categoryId = req.query._id
        console.log(categoryId);
        const catId= await category.findOne({_id:categoryId})
        res.render('editCategory',{admin:"true",user:"new" ,category:catId})
    } catch (error) {
        console.log(error.message);
    }
}

const updateCategory =async(req,res)=>{
    try {
        
        const catId= req.query._id
        console.log(catId+ " catid");
        /*const cId=req.body.categoryId
        const cNam=req.body.categoryName
        const cDes=req.body.categoryDescription
        console.log(cId+" id "+cNam+" name "+cDes+" des");
         const categoryData = await category.findOne({_id:categoryId})
        console.log(categoryData+" db data");
       if(categoryData===req.body){
        res.redirect('/admin/category')
       }else{} */
                const catUp = await category.updateOne(
                    { _id: catId }, // Use catId obtained from req.query._id
                    {
                        $set: {
                            categoryId: req.body.categoryId, // Accessing values from req.body
                            categoryName: req.body.categoryName,
                            categoryDescription: req.body.categoryDescription
                        }
                    }
                );
    
            res.redirect('/admin/category')
            console.log(catUp);
       
    } catch (error) {
        console.log(error.message);
    }
}

const categoryAction = async (req,res)=>{
    try {
        const catId =req.params.id
        console.log(catId);
        const categoryData= await category.findOne({_id:catId})
        if(catId){
           if(categoryData.categoryIsDeleted === false){
            const block=await category.updateOne({ _id: catId }, { $set: { categoryIsDeleted: true } })
            
            console.log(block + "its blocked");
           }else{
            const unblock=await category.updateOne({ _id: catId }, { $set: { categoryIsDeleted: false } })
            console.log(unblock+"its unblocked");
            
           }
        }else{
            console.log('data is not here');
        }
    } catch (error) {
        console.log(error.message +" its here");
    }
}





/* products Settings */
const loadProduct = async (req,res)=>{
    try {
        const categoryData = await category.find({})
        const productData =await product.find({})
        console.log(productData +" here101");
        console.log(req.session)
        console.log(req.body);
        if(req.session){
            res.render('adminProduct',{admin:"new",product:productData,user:'new',category:categoryData})
        }
    } catch (error) {
        console.log(error.message);
    }
}
/* add products */
const loadAddProducts= async(req,res)=>{
    try {
        const categoryData= await category.find({})
        res.render('adminAddProduct',{admin:"new",categories:categoryData})
    } catch (error) {
        console.log(error.message)
    }
}

const AddProducts= async(req,res)=>{
    try {
        console.log(req.body);
        const categoryData= await category.find({})
        const addProduct = new product({
            productId:req.body.productId,
            name:req.body.productName,
            description:req.body.productDescription,
            price:req.body.productPrice,
            categoryId:req.body.productCategory,
           // productImage:req.body.productImages,
            quantity:req.body.productQuantity,
        })
        if(req.file){
            addProduct.productImages=req.file.path
        }
        console.log(addProduct);
        const dbProduct = await addProduct.save()

        console.log(dbProduct);
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message)
    }
}



/* order settings */
const orderLoad = async(req,res)=>{
    try {
        res.render('adminOrder',{admin:"old"})
    } catch (error) {
        console.log(error.message);
    }
}





module.exports={
    adminLoadlogin,
    adminLoadregister,
    adminRegister,
    adminVerifyLogin,
    adminDashboard,
    adminLogout,
    loadCustomer,
    customerAction,



    loadCategory,
    addCatogeries,
    editCategory,
    updateCategory,
    categoryAction,



    loadProduct,
    loadAddProducts,
    AddProducts,
    orderLoad,

}