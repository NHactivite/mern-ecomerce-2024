import mongoose from "mongoose";

const schema=new mongoose.Schema({
        wish:{
            type:Boolean,
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

export const Wish=mongoose.model("Wish",schema)