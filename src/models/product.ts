import mongoose from "mongoose";


interface IProduct extends Document {
  name: string;
  photos:{public_id:string,  url:string}[];
  price: number;
  stock: number;
  category: string;
  description: string;
  rating:number;
  numOfReviews:number;
 brand:string;
 os:string;
 ram:number;
 wish:boolean;
 wishUsers:string[];
 cpu_model:string;
 cpu_speed:string;
  createdAt: Date;
  updatedAt: Date;
}

 const schema = new mongoose.Schema<IProduct>(
    {
      name: {
        type: String,
        required: [true, "Please enter Name"],
      },
      photos:[{
          public_id:{
            type:String,
            required:[true,"Please enter Public ID"],
          },
          url:{
            type:String,
            required:[true,"please enter URL"]
          }
      }],
      // photo: {
      //   type: String,
      //   required: [true, "Please add photo"],
      // },
      price: {
        type: Number,
        required: [true, "Please enter price"],
      },
      stock: {
        type: Number,
        required: [true, "Please enter stock"],
      },
      category: {
        type: String,
        required: [true, "Please enter Product Category"],
        trim:true,
      },
      description:{
        type:String,
        required:[true,"Please enter Descrption"]
      },
      rating:{
        type:Number,
        default:0,
        max:[5,"Rating must be less then 5"]
      },
      numOfReviews:{
        type:Number,
        default:0
    },
      brand:{
        type:String,
        required:[true,"Please enter Brand name"],
      },
      os:{
        type:String,
        required:[true,"please enter Operating System"]
      },
      ram:{
        type:Number,
        required:[true,"please enter Ram size"]
      },
      cpu_model:{
        type:String,
        required:[true,"please enter Cpu Model"]
      },
      cpu_speed:{
        type:String,
        required:[true,"please enter Cpu Speed"]
      },
    },
    {
      timestamps: true,
    }
  );
  
  
  export const Product = mongoose.model<IProduct>("Product",schema);
  