const product = require('../models/productModel')
const category= require('../models/categoryModel')
const catcontroller =require('./categoryController')

/* products Settings */
const loadProduct = async (req, res) => {
    try {
        const adminData = req.session.adminData;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Perform aggregation to join Product collection with Category collection and apply pagination
        const productsWithCategory = await product.aggregate([
            {
                $lookup: {
                    from: 'categories', // Name of the Category collection
                    localField: 'categoryId', // Field in the Product collection
                    foreignField: '_id', // Field in the Category collection
                    as: 'category' // Name of the field to store the matched category data
                }
            },
            {
                $unwind: '$category' // Deconstruct the category array created by $lookup
            },
            {
                $project: {
                    _id: 1,
                    productId: 1,
                    name: 1,
                    description: 1,
                    price: 1,
                    quantity: 1,
                    productImage: 1,
                    categoryName: '$category.categoryName', // Extract the category name
                    isDelete: 1
                }
            },
            { $skip: skip },
            { $limit: limit }
        ]);

        // Count total products for pagination
        const totalProducts = await product.countDocuments();

        // If skip is greater than or equal to total product count, return 404
        if (skip >= totalProducts) {
            return res.status(404).send('Page not found');
        }

        // Render the product details with category name and pagination data
        res.render('adminProduct', {
            product: productsWithCategory,
            admin: adminData,
            page,
            totalPages: Math.ceil(totalProducts / limit),
            limit
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

// product image check
const imageCheck = async (req, res) => {
    try {
       
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error'); // Send an error response if there's an issue
    }
};

//edit product 
const editProduct = async(req,res)=>{
    try {
        const prodt = req.query._id
        proData =await product.findOne({productId:prodt})
        const catData = await category.find({})
        res.render('editProduct',{admin:"new",product:proData,categories:catData})
    } catch (error) {
        console.log(error.message);
    }
}

const updateProduct = async(req,res)=>{
    try {
        console.log(req.body.productName);
    } catch (error) {
        console.log(error.message);
    }
} 


//product block unblock
const productAction = async (req,res)=>{
    try {
        const proId =req.params.id
        console.log(proId);
        const productData= await product.findOne({productId:proId})
        if(proId){
           if(productData.isDelete === false){
            const block=await product.updateOne({productId:proId }, { $set: { isDelete: true } })
            
            console.log(block + "its blocked");
           }else{
            const unblock=await product.updateOne({productId:proId }, { $set: { isDelete: false } })
            console.log(unblock+"its unblocked");
            loadProduct()
           }
        }else{
            console.log('data is not here');
        }
    } catch (error) {
        console.log(error.message +" its here");
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
        const uniqueId= await catcontroller.ShortUniqueId()
        console.log(uniqueId);
        const images = req.files.map(file => file.path);
       
        const categoryData= await category.find({})
        const addProduct = new product({
            productId:uniqueId,
            name:req.body.productName,
            description:req.body.productDescription,
            price:req.body.productPrice,
            categoryId:req.body.productCategory,
            productImage: images,
            quantity:req.body.productQuantity,
        })
        
        console.log(addProduct);
        const dbProduct = await addProduct.save()

        console.log(dbProduct);
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message +" here addproduct")
    }
}

module.exports={
    loadProduct,
    loadAddProducts,
    AddProducts,
    editProduct,
    updateProduct,
    productAction,
}