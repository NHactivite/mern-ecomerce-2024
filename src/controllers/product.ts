import { Request } from "express";
import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import { Review } from "../models/review.js";
import { User } from "../models/user.js";
import { BaseQuery, NewProductRequestBody, searchRequestQuery } from "../types/types.js";
import { deleteFromCloudinary, invalidatesCache, uploadToCloudnary } from "../utils/features.js";
import ErrorHandler from "../utils/utilityClass.js";
import { data } from "framer-motion/client";
import { Wish } from "../models/wish.js";

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, price, category, stock,description,brand,os,ram,cpu_model,cpu_speed} = req.body;
   
    const photos = req.files as Express.Multer.File[] | undefined;
    if (!photos) return next(new ErrorHandler("Please add photo", 400));
     
    if(photos.length<1) return next(new ErrorHandler("Please atleast one Photo", 400));
    if(photos.length>5) return next(new ErrorHandler("you can upload only 5 Photos", 400));

    if (!price || !stock || !category || !name|| !description) {
      return next(new ErrorHandler("Please enter all fields", 400));
    }

    // upload photo in cloudnary
   const photosURL=await uploadToCloudnary(photos)
    await Product.create({
      name,
      price,
      category: category.toLowerCase(),
      stock,
      description,
      photos:photosURL,
      brand,
      os,
      ram,
      cpu_model,
      cpu_speed
    });

   await invalidatesCache({product:true,admin:true,Brands:true});

    return res.status(201).json({
      success: true,
      message: "Product Created Successsfully",
    });
  }
);

// revalid nodeCach when product update,newproductcreate, delete & new order
export const getLateastProducts = TryCatch(
  async (req, res, next) => {
    let product;
  product= await redis.get("latest-product");
    if(product){
      product=JSON.parse(product)
    }
    else{
      product= await Product.find({}).sort({ createdAt: -1 }).limit(10);
      await redis.setex("latest-product",redisTTL,JSON.stringify(product));
    }
   
    res.status(201).json({
      success: true,
      product,
    });
  }
);

// revalid nodeCach when product update,newproductcreate, delete & new order
export const getAllCategories = TryCatch(
  async (req, res, next) => {
      
    let categories;
   categories=await redis.get("categories")
  if(categories)
    {  
       categories=JSON.parse(categories)
    }
   else
   {
   const Allcategories = await Product.distinct("category");
   categories = [...new Set(Allcategories.map(item => item.toLowerCase()))];
    await redis.setex("categories",redisTTL,JSON.stringify(categories))
   }
    res.status(201).json({
      success: true,
       categories ,
    });
  }
);
export const getAllBrands = TryCatch(
  async (req, res, next) => {
     
    let Brands;
   Brands=await redis.get("Brands")
  if(Brands)
    {
       Brands=JSON.parse(Brands)
    }
   else
   {
    Brands = await Product.distinct("brand");
    await redis.setex("Brands",redisTTL,JSON.stringify(Brands))
   }
     
    res.status(201).json({
      success: true,
      Brands,
    });
  }
);


// revalid nodeCach when product update,newproductcreate, delete & new order

export const getAdminProducts = TryCatch(
  async (req, res, next) => {
   
    let product;
    product=await redis.get("allProducts")
    if(product)
      {
        product=JSON.parse(product)
      }
    else
    {
      product = await Product.find({});
      await redis.setex("products",redisTTL,JSON.stringify(product))
    }
    res.status(201).json({
      success: true,
      product,
    });
  }
);

// revalid nodeCach when product update,newproductcreate, delete & new order

export const getSingleProducts = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const id = (req.params as { id: string }).id;
       let product;
       const key=`product-${id}`
     product=await redis.get(key)
       if(product)
       {
        product=JSON.parse(product);
       }
       else{
        product = await Product.findById(id);
        await redis.setex(key,redisTTL,JSON.stringify(product));
       }
    if (!product) return next(new ErrorHandler("Product Not Found", 404));
    res.status(201).json({
      success: true,
      product,
    });
  }
);


export const addWish = TryCatch(
  async (req, res, next) => {
    const id = (req.params as { id: string }).id;

    // Find the product by ID
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Toggle the `wish` status
    product.wish = !product.wish;

    // Save the updated product
    await product.save();

    // Send the updated product back to the client
    return res.status(200).json({ product });
  }
);



export const updateProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const id = (req.params as { id: string }).id;
    const { name, price, category, stock,description,brand,os,cpu_model,cpu_speed,ram } = req.body;
      const photos = req.files as Express.Multer.File[] | undefined;
    const product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Product Not Found", 404));

     if (!photos || photos.length === 0) {
      // console.log("No new photos uploaded, retaining existing photos");
    } else {

      // If new photos are uploaded, upload them and update the database
      const photosURL = await uploadToCloudnary(photos);
      const ids = product.photos.map((photo) => photo.public_id); // Assuming product.photos contains { public_id, url }
      
      // Optionally delete old photos
      await deleteFromCloudinary(ids);
      product.photos = photosURL; // Update with new photos
    }


    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;
    if(description)product.description=description;
    if(brand)product.brand=brand;
    if(ram)product.ram=ram;
    if(cpu_model)product.cpu_model=cpu_model;
    if(cpu_speed)product.cpu_speed=cpu_speed;
    if(os)product.os=os;
    await product.save();
   await invalidatesCache({product:true,productId:String(product._id),admin:true});

    return res.status(200).json({
      success: true,
      message: "Product Updated Successsfully",
    });
  }
);

export const deletedProducts = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const id = (req.params as { id: string }).id;
    const product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    const ids=product.photos.map((photo)=>photo.public_id);

    await deleteFromCloudinary(ids);
    await product.deleteOne();
   await invalidatesCache({product:true,productId:String(product._id),admin:true});
    res.status(201).json({
      success: true,
      message: "Product Deleted Successsfully",
    });
  }
);
export const newReview = TryCatch(
  async (req, res, next) => {
    const { comment, rating } = req.body;
    const user=await User.findById(req.query.id);
    if (!user) return next(new ErrorHandler("Not Logged in",404));
    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product Not Found",404));
   
  
    const alreadyReviewed=await Review.findOne({
      user:user._id,
      Product:product._id
    })
  
  if(comment || rating){
    if(alreadyReviewed){
 
      alreadyReviewed.comment=comment;
      alreadyReviewed.rating=rating
      await alreadyReviewed.save()
}else{
  await Review.create({
    comment,
    rating,
    user:user._id,
    Product:product._id
  })
}
  }else{
    return next(new ErrorHandler("Please add all fields",400));
  }

  let totalRating=0

  const reviews=await Review.find({Product:product._id});

  reviews.forEach((review)=>{
    totalRating+=review.rating
  })

const averateRating=Math.floor(totalRating/reviews.length)||0;

product.rating=averateRating
product.numOfReviews=reviews.length;
await product.save();

  await  invalidatesCache({product:true,productId:String(product._id),admin:true,review:true});
    res.status(alreadyReviewed?200:201).json({
      success: true,
      message: alreadyReviewed?"Review Update":"Review Added"
    });
  }
);
export const productReview= TryCatch(
  async (req, res, next) => {
    let reviews;
    const key=`reviews-${req.params.id}`;
    
    reviews=await redis.get(key);
    
    if(reviews){
          reviews=JSON.parse(reviews)   
    }else{
      reviews = await Review.find({
        Product:req.params.id
      }).populate("user","name photo").sort({updateAt:-1});

      await redis.setex(key,redisTTL,JSON.stringify(reviews))
    }
    res.status(200).json({
      success: true,
     reviews
    });
  }
);

export const wishHandle = TryCatch(
  async (req, res, next) => {
    const productId = req.params.id;
    const user=await User.findById(req.query.id);
    if (!user) return next(new ErrorHandler("Not Logged in",404));

    // Check if the wish already exists
    await  invalidatesCache({wish:true,userId:user.id});
    const existingWish = await Wish.findOne({ Product: productId, user:user.id });

    if (existingWish) {
      await existingWish.deleteOne();
      return res.status(200).json({
        success: true,
        message: "Remove from wish List",
      });
    }

    // If no existing wish, create a new one
    const newWish = await Wish.create({
      wish: true,
      user: user.id,
      Product: productId,
    });
  
    res.status(201).json({
      success: true,
      message: "Wish added",
      wish: newWish,
    });
  }
);
export const getWish=TryCatch(
  async(req, res, next)=>{
    const user=await User.findById(req.query.id);
    let wish;
    const key=`wish-${user?.id}`; 
    wish=await redis.get(key);
   if(wish){
    
    wish=JSON.parse(wish)
   }else{
    wish=await Wish.find({user:user});
    await redis.setex(key,redisTTL,JSON.stringify(wish))
   }
    res.status(200).json({
      success: true,
       wish
    });
  }
)

export const deleteReview = TryCatch(
  async (req, res, next) => {
    const user=await User.findById(req.query.id);
    if (!user) return next(new ErrorHandler("Not Logged in", 404));
    const review = await Review.findById(req.params.id);
    if (!review) return next(new ErrorHandler("Review Not Found", 404));

    const isAuthenticUser=review.user.toString()===user._id.toString();
    if(!isAuthenticUser) return next(new ErrorHandler("Not Authorized",401))

    await review.deleteOne();
    const product=await Product.findById(review.Product);
    if(!product) return next(new ErrorHandler("Product not Found",404))
   
      let totalRating=0

      const reviews=await Review.find({Product:product._id});

      reviews.forEach((review)=>{
        totalRating+=review.rating
      })

   const averateRating=Math.floor(totalRating/reviews.length)||0;

  product.rating=averateRating
  product.numOfReviews=reviews.length;
  await product.save();

   await invalidatesCache({product:true,productId:String(product._id),admin:true,review:true});
    res.status(200).json({
      success: true,
      message: "Review Deleted"
    });
  }
);

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, searchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;
     
    const page = Number(req.query.page) || 1;


    const key=`products-${search}-${sort}-${category}-${price}-${page}`;

    let products;
    let totalPage;

    const cachedata=await redis.get(key);
    
    if(cachedata){
      const data=JSON.parse(cachedata);
      totalPage=data.totalPage;
      products=data.products
    }else{

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;

    const skip =(page - 1)*limit;
// in first page default 8 product show . in nextpage page=2 and 
// defalut limit is 8 so skip value is 8 so wee skip 8 product and show rest 8 product in 2nd page

  //  const baseQuery:BaseQuery={};
  let baseQuery: Record<string, any> = {};
   if (search) {
    baseQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }
     
      if(price)
        baseQuery.price={
          $lte:Number(price),
        }

      if(category)
        baseQuery.category=category
    
      const [productFetched,filterProduct]=await Promise.all([ // both await function call same time
        Product.find(baseQuery).sort(sort && {price: sort ==="asc"? 1 : -1}).limit(limit).skip(skip),
        Product.find(baseQuery)
      ])
     products=productFetched
     totalPage=Math.ceil(filterProduct.length/limit);  
    // if product 101 and limit 10 then totalpage is 10.1 so we use ceil to convert it to 11 if apply floorand round  it convert to 10  
    await redis.setex(key,30,JSON.stringify({products,totalPage}))
    }
    res.status(201).json({
      success: true,
      products,
      totalPage
    });
  }
);
