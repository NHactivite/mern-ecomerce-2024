// import { stripe } from "../app.js";
import { Cashfree } from "cashfree-pg";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utilityClass.js";
import { Product } from "../models/product.js";

//payment------------------------------------------------------------------


export const paymentReq=TryCatch(async(req,res,next)=>{
       const {customer_id,customer_phone,order_items,discount}=req.body;
    
       const products = order_items.map((item: any) => ({
        id: item.productId,
        quantity: item.quantity
      }));
      const amounts = await Promise.all(
        products.map(async (i:any) => {
          const product = await Product.findById(i.id, "price");
          if (!product) {
            throw new Error(`Product with ID ${i.id} not found`);
          }
          return product.price*i.quantity; // Assuming 'price' is the field you want
        })
      );
      
      const finalAmount = amounts.reduce((acc, curr) => acc + curr, 0);

      // Apply discount conditionally to calculate the payable amount
const payAmount = finalAmount - discount > 200 ? finalAmount - discount : finalAmount;
      
      
       let request = {
        "order_amount":  payAmount,
        "order_currency": "INR",
        "customer_details": {
            "customer_id": customer_id,
            "customer_phone": customer_phone,
        },
    }
    Cashfree.PGCreateOrder("2023-08-01", request).then(response => {
        res.json(response.data);

    }).catch(error => {
        next(new ErrorHandler("Payment request Failed",404))
    })
})


export const paymentVerify=TryCatch(async(req,res,next)=>{
    let {
        order_id
    } = req.body;

    Cashfree.PGOrderFetchPayments("2023-08-01", order_id).then((response) => {

        res.json(response.data);
    }).catch(error => {
        next(new ErrorHandler("Invaild Payment",404))
    })

})
//-----------------------------------------------------------------------------------
export const newCoupon =TryCatch(async(req,res,next)=>{
      
    const {code,amount}=req.body;
    if(!code||!amount) return next(new ErrorHandler("please enter both coupon and amount",400))

    await Coupon.create({code,amount});


    return res.status(201).json({
        success:true,
        message:`Coupon ${code} Created Successfully`,
    })
})

export const applyDiscount =TryCatch(async(req,res,next)=>{
      
    const {code}=req.params;
    
    const discount=await Coupon.findOne({code});
    if(!discount){ 
        return next(new ErrorHandler("invalid coupon code",400))
    }

    return res.status(200).json({
        success:true,
        discount:discount.amount,
    })
})

export const allCoupons =TryCatch(async(req,res,next)=>{
      

    const coupons=await Coupon.find({});

    return res.status(200).json({
        success:true,
        coupons,
    })
})

export const deleteCoupon =TryCatch(async(req,res,next)=>{
     const {id}=req.params;
     const coupon=await Coupon.findByIdAndDelete(id);
      if(!coupon) return next(new ErrorHandler("invalid Coupon Id",400));
    return res.status(200).json({
        success:true,
        message:`coupon ${coupon.code} delete successfully`
    })
})
export const updateCoupon =TryCatch(async(req,res,next)=>{
     const {id}=req.params;
     const {code,amount}=req.body;
     const coupon=await Coupon.findById(id);
      if(!coupon) return next(new ErrorHandler("invalid Coupon Id",400));
    if(code) coupon.code=code
    if(amount) coupon.amount=amount
    await coupon.save();
    return res.status(200).json({
        success:true,
        message:`coupon update successfully`
    })
})
export const getCoupon =TryCatch(async(req,res,next)=>{
     const {id}=req.params;
     const coupon=await Coupon.findById(id);
      if(!coupon) return next(new ErrorHandler("invalid Coupon Id",400));
    return res.status(200).json({
        success:true,
        coupon
    })
})