import { Request } from "express";
import { BaseQuery, NewProductRequestBody, searchRequestQuery } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import { rm } from "fs";
import ErrorHandler from "../utils/utilityClass.js";
 import { nodeCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, price, category, stock } = req.body;
    const photo = req.file;

    if (!photo || !photo.path)
      return next(new ErrorHandler("Please add photo", 400));
    if (!price || !stock || !category || !name) {
      rm(photo.path, () => {});
      return next(new ErrorHandler("Please enter all fields", 400));
    }

    await Product.create({
      name,
      price,
      category: category.toLowerCase(),
      stock,
      photo: photo.path,
    });

    invalidatesCache({product:true,admin:true});

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
    if(nodeCache.has("latest-product")){
      product=JSON.parse(nodeCache.get("latest-product")as string)
    }
    else{
      product = await Product.find({}).sort({ createdAt: -1 }).limit(10);
      nodeCache.set("latest-product",JSON.stringify(product));
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

  if(nodeCache.has("categories"))
    {
       categories=JSON.parse(nodeCache.get("categories")as string)
    }
   else
   {
    categories = await Product.distinct("category");
    nodeCache.set("categories",JSON.stringify(categories))
   }
     

    res.status(201).json({
      success: true,
      categories,
    });
  }
);


// revalid nodeCach when product update,newproductcreate, delete & new order

export const getAdminProducts = TryCatch(
  async (req, res, next) => {
   
    let product;
    if(nodeCache.has("products"))
      {
        product=JSON.parse(nodeCache.get("products")as string)
     }
    else
    {
      product = await Product.find({});
      nodeCache.set("products",JSON.stringify(product))
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
     
       if(nodeCache.has(`product-${id}`))
       {
        product=JSON.parse(nodeCache.get(`product-${id}`)as string);
       }
       else{
        product = await Product.findById(id);
        nodeCache.set(`product-${id}`,JSON.stringify(product));
       }
    if (!product) return next(new ErrorHandler("Product Not Found", 404));
    res.status(201).json({
      success: true,
      product,
    });
  }
);

export const updateProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const id = (req.params as { id: string }).id;

    const { name, price, category, stock } = req.body;

    const photo = req.file;

    const product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    if (photo) {
      rm(product.photo, () => {
        console.log("photo updated");
      });
      product.photo = photo.path;
    }else{
      return next(new ErrorHandler("Please enter all fields", 400));
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;

    await product.save();
    invalidatesCache({product:true,productId:String(product._id),admin:true});

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

    rm(product.photo, () => {
      console.log("product photo deleted");
    });
    await product.deleteOne();
    invalidatesCache({product:true,productId:String(product._id),admin:true});
    res.status(201).json({
      success: true,
      message: "Product Deleted Successsfully",
    });
  }
);

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, searchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;

    const skip =(page - 1)*limit;
// in first page default 8 product show . in nextpage page=2 and 
// defalut limit is 8 so skip value is 8 so wee skip 8 product and show rest 8 product in 2nd page

   const baseQuery:BaseQuery={};

    if(search) 
        baseQuery.name={
        $regex: search,
        $options:"i",
      }
     
      if(price)
        baseQuery.price={
          $lte:Number(price),
        }

      if(category)
        baseQuery.category=category
    
      const [products,filterProduct]=await Promise.all([ // both await function call same time
        Product.find(baseQuery).sort(sort && {price: sort ==="asc"? 1 : -1}).limit(limit).skip(skip),
        Product.find(baseQuery)
      ])

    const totalPage=Math.ceil(filterProduct.length/limit);  
    // if product 101 and limit 10 then totalpage is 10.1 so we use ceil to convert it to 11 if apply floorand round  it convert to 10  
     
    res.status(201).json({
      success: true,
      products,
      totalPage
    });
  }
);
