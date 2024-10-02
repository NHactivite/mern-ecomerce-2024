import mongoose from "mongoose";

const schema= new mongoose.Schema({
    code:{
        type:String,
        required:[true,"Please enter the Coupon code"],
        unique:true
    },
    amount:{
        type:Number,
        required:[true,"Please enter the discount Amount"]
    },
});

export const Coupon=mongoose.model("Coupon",schema)