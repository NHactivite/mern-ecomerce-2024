import { Request } from "express";
import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/orders.js";
import { User } from "../models/user.js";
import { NewOrderRequestBody } from "../types/types.js";
import { invalidatesCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utilityClass.js";



export const myOrder=TryCatch(async(req:Request<{},{},NewOrderRequestBody>,res,next)=>{

    const {id}=req.query;

    let orders;
    orders=await redis.get(`myOrder-${id}`)
    
    if(orders)
    {
        orders=JSON.parse(orders)
    }
    // orders=await Order.find({user:id});
    // if(!orders) return next(new ErrorHandler("Order not found",400));

   else
   {
           orders=await Order.find({userId:id});
           if(!orders) return next(new ErrorHandler("Order not found",400));
          await redis.setex(`myOrders-${id}`,redisTTL,JSON.stringify(orders))
   }


   return res.status(200).json({
    success:true,
    orders,
   })
})


export const allOrders=TryCatch(async(req,res,next)=>{

    let orders;
    let userIdMap: { [key: string]: string } = {};

    orders=await redis.get(`allOrders`)
    if(orders)
    {
        orders=JSON.parse(orders)
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
           await redis.setex("allOrders",redisTTL,JSON.stringify(orders))
   }
   return res.status(200).json({
    success:true,
    orders,
    
   })
})



export const getSingleOrder=TryCatch(async(req:Request<{},{},NewOrderRequestBody>,res,next)=>{
      
    const {id}=req.params as {id:string};

    let order;
    order=await redis.get(`order-${id}`)
    if(order)
    {
        order=JSON.parse(order)
    }
   else
   {
          order=await Order.findById(id);
        //    if(!order) return next(new ErrorHandler("Order not found",400));/
        
           await redis.setex(`order-${id}`,redisTTL,JSON.stringify(order))
        
   }


   return res.status(200).json({
    success:true,
    order,
   })
})


export const newOrder=TryCatch(async(req:Request<{},{},NewOrderRequestBody>,res,next)=>{

    const {shippingInfo,orderItems,userId,subtotal,discount,total,shippingCharges}=req.body;
    if (
        shippingInfo === undefined || 
        orderItems === undefined || 
        userId === undefined || 
        subtotal === undefined || 
        total === undefined || 
        shippingCharges === undefined||
        discount===undefined
      ) {
        return next(new ErrorHandler("Please Select Product", 400));
      }

   const order= await Order.create({
        shippingInfo,orderItems,userId,subtotal,discount,total,shippingCharges
    });

   await reduceStock(orderItems);

  await invalidatesCache({product:true,order:true,admin:true,userId:userId,productId:order.orderItems.map(i=>String(i.productId))});

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

 await  invalidatesCache({product:false,order:true,admin:true,userId:order.userId,orderId:String(order._id)});

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

   await invalidatesCache({product:false,order:true,admin:true,userId:order.userId,orderId:String(order._id)});

   return res.status(200).json({
    success:true,
    message:"Order Deleted Successfully"
   })
})

