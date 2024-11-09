import mongoose, { Document } from "mongoose";
import { nodeCache, redis } from "../app.js";
import { Product } from "../models/product.js";
import { invalidatesCacheProps, orderItemType } from "../types/types.js";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import {Redis} from "ioredis";

const getBase64=(file:Express.Multer.File)=>`data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadToCloudnary=async(files:Express.Multer.File[])=>{
    const promises=files.map(async(file)=>{
           return new Promise<UploadApiResponse>(async(resolve,reject)=>{
                 cloudinary.uploader.upload(getBase64(file),(error,result)=>{
                       if(error) return reject(error)
                       resolve(result!)
                    
                 }
                )
           })
    })  
    const result=await Promise.all(promises)
    return result.map((i)=>({
        public_id:i.public_id,
        url:i.url
    }))
}


export const connectRedis=(redisURI:string)=>{
    const redis=new Redis(redisURI);
    redis.on("connect",()=>console.log("Redis Connected"))
    redis.on("error",(e)=>console.log(e))
    return redis;
}


export const deleteFromCloudinary=async(publicIds:string[])=>{
    const promises=publicIds.map(async(id)=>{
        return new Promise<void>(async(resolve,reject)=>{
              cloudinary.uploader.destroy(id,(error,result)=>{
                    if(error) return reject(error)
                    resolve(result!)
                 
              }
             )
        })
 }) 
} 

export  const connectDB=(uri:string)=>{
        mongoose.connect(uri,{
            dbName:"Ecomerce",
        }).then(c=>console.log(`database connected ${c.connection.host}`)).catch(e=>console.log(e));
       
};


export const invalidatesCache=async({product,order,admin,userId,orderId,productId,review,wish}:invalidatesCacheProps)=>{

    if(review){
        const key=`reviews-${productId}`
        await redis.del(key)
    }
    if(wish){
        const key=`wish-${userId}`;
        await redis.del(key)
    }
   
    if(product)
    { 
        const productKeys:string[]=["latest-product","categories","products"];

        if(typeof productId==="string") productKeys.push(`product-${productId}`)

        if(typeof productId==="object") productId.forEach(i=> productKeys.push(`product-${i}`))

        await redis.del(productKeys)
    }
    if(order)
    {
            const ordersKeys:string[]=["allOrders",`myOrders-${userId}`,`order-${orderId}`];
            
            await redis.del(ordersKeys)
    }
    if(admin)
    {
        await redis.del(["adminStats","adminPieCharts","adminBarCharts","adminLineCharts"])
    }

}


export const reduceStock=async(orderItems:orderItemType[])=>{

     for (let index = 0; index <orderItems.length; index++) {
        const item=orderItems[index];
      
         const product=await Product.findById(item.productId);
         if(!product)
         {
            throw new Error("Product not found")
         }
        product.stock -=item.quantity;
        await product.save()
        
     }

}



export const calculatePercentage=(thisMonth:number,lastMonth:number)=>{

    if(lastMonth===0) return thisMonth*100;
    const percent= (thisMonth/lastMonth) * 100;

    return Number(percent.toFixed(0));
}



export const getInventories = async({categories,ProductCount}:{categories:string [];ProductCount:number})=>{
    const categoriesCountPromise=categories.map((category)=>Product.countDocuments({category}))
    const categoriesCount=await Promise.all(categoriesCountPromise);
     
     const allCategoriesAndStock:Record<string, number>[]=[];

     categories.forEach((category,idx)=>{
            allCategoriesAndStock.push({
              [category]:Math.round((categoriesCount[idx]/ProductCount)*100)
            })
     })

     return allCategoriesAndStock;
}


  
interface MyDocument extends Document{
    createdAt: Date;
    discount?:number;
    total?:number
}

type funProps={
    length:number,
    docArr:MyDocument[],
    today:Date,
    property?:"discount"|"total"
}

export const getChartData=({length,docArr,today,property}:funProps)=>{
    
                const data:number[]=new Array(length).fill(0);
              docArr.forEach((i)=>{
                
                const creationDate=i.createdAt;
                const monthDiff=(today.getMonth() - creationDate.getMonth() +12)%12;

                if(monthDiff < length)
                {
                    data[length - monthDiff - 1] += property?i[property]! : 1;
                }
             
              });
              return data;
}

