import { User } from "../models/user.js";
import ErrorHandler from "../utils/utilityClass.js";
import { TryCatch } from "./error.js";


export const adminOnly=TryCatch(async(req,res,next)=>{
          const {id}=req.query; 
          if(!id) return next(new ErrorHandler("login first",401));

          const user= await User.findById(id);
          if(!user) return next(new ErrorHandler("Please login first",401));

          if(user.role !== "admin") return next(new ErrorHandler("Aukat maa raha",403));

          next();
})   