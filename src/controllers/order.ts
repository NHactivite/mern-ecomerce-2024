import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/orders.js";
import { invalidatesCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utilityClass.js";
import { nodeCache } from "../app.js";
import { User } from "../models/user.js";
import { log } from "console";



export const myOrder=TryCatch(async(req:Request<{},{},NewOrderRequestBody>,res,next)=>{

    const {id}=req.query;

    let orders=[];
    
    
    if(nodeCache.has(`myOrders-${id}`))
    {
        orders=JSON.parse(nodeCache.get(`myOrders-${id}`)as string)
    }
    // orders=await Order.find({user:id});
    // if(!orders) return next(new ErrorHandler("Order not found",400));

   else
   {
           orders=await Order.find({userId:id});
           if(!orders) return next(new ErrorHandler("Order not found",400));
           nodeCache.set(`myOrders-${id}`,JSON.stringify(orders))
   }


   return res.status(200).json({
    success:true,
    orders,
   })
})


export const allOrders=TryCatch(async(req,res,next)=>{

    let orders=[];
    let userIdMap: { [key: string]: string } = {};
    if(nodeCache.has("allOrders"))
    {
        orders=JSON.parse(nodeCache.get("allOrders")as string)
    }

   else
   {
        orders = await Order.find();
        const usernames = orders.map(order => order.userId);
        const customers = await User.find({ name: { $in: usernames } }).select('_id name');
  customers.forEach(customer => {
    userIdMap[customer.name] = customer._id;
   });

    orders = orders.map(order => ({
    ...order.toObject(),  // Convert Mongoose document to plain object
    customerId: userIdMap[order.userId]  // Add the corresponding user ID
   }));
       
       if(!orders) return next(new ErrorHandler("Order not found",400));
           nodeCache.set("allOrders",JSON.stringify(orders))
   }
   return res.status(200).json({
    success:true,
    orders,
    
   })
})



export const getSingleOrder=TryCatch(async(req:Request<{},{},NewOrderRequestBody>,res,next)=>{
      
    const {id}=req.params as {id:string};

    let order;
    
    if(nodeCache.has(`order-${id}`))
    {
        order=JSON.parse(nodeCache.get(`order-${id}`)as string)
    }
   else
   {
          order=await Order.findById(id);
        //    if(!order) return next(new ErrorHandler("Order not found",400));/
        
           nodeCache.set(`order-${id}`,JSON.stringify(order))
        
   }


   return res.status(200).json({
    success:true,
    order,
   })
})


export const newOrder=TryCatch(async(req:Request<{},{},NewOrderRequestBody>,res,next)=>{

    const {shippingInfo,orderItems,userId,subtotal,tax,discount,total,shippingCharges}=req.body;
    
    if (
        shippingInfo === undefined || 
        orderItems === undefined || 
        userId === undefined || 
        subtotal === undefined || 
        tax === undefined || 
        total === undefined || 
        shippingCharges === undefined||
        discount===undefined
      ) {
        return next(new ErrorHandler("Please Select Product", 400));
      }

   const order= await Order.create({
        shippingInfo,orderItems,userId,subtotal,tax,discount,total,shippingCharges
    });

   await reduceStock(orderItems);

   invalidatesCache({product:true,order:true,admin:true,userId:userId,productId:order.orderItems.map(i=>String(i.productId))});

   return res.status(201).json({
    success:true,
    message:"Order Placed Successfully"
   })
})


export const processOrder=TryCatch(async(req:Request<{},{},NewOrderRequestBody>,res,next)=>{

      const {id}=req.params as {id:string};

      const order=await Order.findById(id);
      if(!order) return next(new ErrorHandler("Order not found",400));

      switch (order.status) {
        case "Processing":
             order.status="Shipped";
            break;
        case "Shipped":
             order.status="Delivered";
            break;
        default: 
         order.status="Delivered";
            break;
      }

      await order.save();

   invalidatesCache({product:false,order:true,admin:true,userId:order.userId,orderId:String(order._id)});

   return res.status(200).json({
    success:true,
    message:"Order Processed Successfully"
   })
})

export const deleteOrder=TryCatch(async(req:Request<{},{},NewOrderRequestBody>,res,next)=>{

      const {id}=req.params as {id:string};

      const order=await Order.findById(id);
      if(!order) return next(new ErrorHandler("Order not found",400));


      await order.deleteOne();

    invalidatesCache({product:false,order:true,admin:true,userId:order.userId,orderId:String(order._id)});

   return res.status(200).json({
    success:true,
    message:"Order Deleted Successfully"
   })
})

