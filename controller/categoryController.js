const category =require('../models/categoryModel')
const product = require('../models/productModel')
const shortId=require('short-unique-id')
const user = require("../models/userModel")

const ShortUniqueId=async()=>{
    const id = new shortId({length:6})
    let unique= id.randomUUID() 
    return unique
}

/* Category settings */
const loadCategory = async (req, res) => {
    try {
        if (req.session.adminData) {
            const search = req.query.search || '';

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Use aggregation to fetch categories with product counts and apply pagination
            const categoriesWithProductCount = await category.aggregate([
                {
                    $match: {
                        categoryName: { $regex: search, $options: 'i' } // Filter categories based on search
                    }
                },
                {
                    $lookup: {
                        from: 'products', // name of the collection to join with
                        localField: '_id',
                        foreignField: 'categoryId',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        categoryName: 1, // include the category name
                        categoryId: 1,
                        categoryIsDeleted: 1,
                        productCount: { $size: '$products' } // add a field for the number of products
                    }
                },
                { $skip: skip },
                { $limit: limit }
            ]);

            // Count total categories for pagination
            const totalCategories = await category.countDocuments({
                categoryName: { $regex: search, $options: 'i' }
            });

            // If skip is greater than or equal to total category count, return 404
            if (skip >= totalCategories) {
                return res.status(404).send('Page not found');
            }

            const admin = req.session.adminData;
            res.render('adminCategory', {
                admin: admin,
                category: categoriesWithProductCount,
                user: "new",
                page,
                totalPages: Math.ceil(totalCategories / limit),
                limit,
                search
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}

 const loadAddCategory = async(req,res)=>{
    try {
        res.render('adminAddCategory',{admin:"new",user:"old"})

    } catch (error) {
        console.log(error.message);
    }
 }
 const addCatogeries = async(req,res)=>{
     try {
        const uniqueId = await ShortUniqueId()
        console.log(uniqueId);
        const addCategory= new category({
            categoryId:uniqueId,
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
         const adminData =req.session.adminData
         const categoryId = req.query._id
         console.log(categoryId);
         const catId= await category.findOne({_id:categoryId})
         res.render('editCategory',{admin:adminData,user:"new" ,category:catId})
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
 const categoryWise = async(req,res)=>{
    try {
        const catId = req.params.id
        //console.log(catId);
        const catdata = await category.find({categoryId:catId})
        const id = catdata[0]._id.toString()
        //console.log(id);
        
        const productData = await product.find({categoryId:id})
        //console.log(productData);
        const catData = await category.find({})
        
        if (req.session.user_id) {
            const userData= await user.findById({_id:req.session.user_id})
            res.render('categoryWise',{categories:catData,product:productData,users:userData })
        } else {
            res.render('categoryWise',{categories:catData,product:productData})
        }
    } catch (error) {
        console.log(error.message);
    }
 }
 
 







module.exports={

    loadCategory,
    addCatogeries,
    editCategory,
    updateCategory,
    categoryAction,
    loadAddCategory,
    categoryWise,

    ShortUniqueId

}