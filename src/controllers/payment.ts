// import { stripe } from "../app.js";
import { Cashfree } from "cashfree-pg";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utilityClass.js";

//payment------------------------------------------------------------------

export const paymentReq=TryCatch(async(req,res,next)=>{
       const {customer_id, order_amount}=req.body;
       let request = {
        "order_amount":  order_amount,
        "order_currency": "INR",
        "customer_details": {
            "customer_id": customer_id,
            "customer_phone": "9999999999",
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
      
    const {coupon,amount}=req.body;
    if(!coupon||!amount) return next(new ErrorHandler("please enter both coupon and amount",400))

    await Coupon.create({code:coupon,amount});


    return res.status(201).json({
        success:true,
        message:`Coupon ${coupon} Created Successfully`,
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
        meassege:`coupon ${coupon.code} delete successfully`
    })
})