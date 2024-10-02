import mongoose, { Document } from "mongoose"
import { invalidatesCacheProps, orderItemType } from "../types/types.js";
import { nodeCache } from "../app.js";
import { Product } from "../models/product.js";
import { Order } from "../models/orders.js";

export  const connectDB=(uri:string)=>{
        mongoose.connect(uri,{
            dbName:"Ecomerce",
        }).then(c=>console.log(`database connected ${c.connection.host}`)).catch(e=>console.log(e));
       
};


export const invalidatesCache=({product,order,admin,userId,orderId,productId}:invalidatesCacheProps)=>{
   
    if(product)
    { 
        const productKeys:string[]=["latest-product","categories","products"];

        if(typeof productId==="string") productKeys.push(`product-${productId}`)

        if(typeof productId==="object") productId.forEach(i=> productKeys.push(`product-${i}`))

        nodeCache.del(productKeys)
    }
    if(order)
    {
            const ordersKeys:string[]=["allOrders",`myOrders-${userId}`,`order-${orderId}`];
            
            nodeCache.del(ordersKeys)
    }
    if(admin)
    {
         nodeCache.del(["adminStats","adminPieCharts","adminBarCharts","adminLineCharts"])
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

