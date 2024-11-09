import mongoose from "mongoose";

const schema=new mongoose.Schema({
        comment:{
            type:String,
            maxlength:[300,"Comment must not be more than 200 characters"]
        },
        rating:{
            type:Number,
            required:[true,"Please give Rating"]
        },
        user:{
            type:String,
            ref:"User",
            required:true
        },
        Product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product",
            required:true
        }
},{
    timestamps:true
})

export const Review=mongoose.model("Review",schema)