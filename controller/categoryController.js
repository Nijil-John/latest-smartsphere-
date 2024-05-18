const category =require('../models/categoryModel')
const shortId=require('short-unique-id')

const ShortUniqueId=async()=>{
    const id = new shortId({length:6})
    let unique= id.randomUUID() 
    return unique
}

/* Category settings */
const loadCategory =async(req,res)=>{
    try {
     if(req.session.adminData){
        if (req.query.search) {
            search = req.query.search;
          }
 
         console.log(req.session.adminData);
         const categoryData = await category.find({})
         const admin = req.session.adminData
         res.render('adminCategory',{admin:admin,category:categoryData,user:"new"})
     }
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
 
 







module.exports={

    loadCategory,
    addCatogeries,
    editCategory,
    updateCategory,
    categoryAction,

    ShortUniqueId

}