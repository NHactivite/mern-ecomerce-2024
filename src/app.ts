import express from "express";
import { connectDB, connectRedis } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import {config} from "dotenv";
import morgan from "morgan";
 import cors from "cors"
 import { Cashfree } from "cashfree-pg";
import {v2 as cloudinary} from "cloudinary"

// importing Routes
import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js"
import orderRoute from "./routes/order.js"
import paymentRoute from "./routes/payment.js"
import dashboardRoute from "./routes/stats.js"


config({
    path:"./.env"
})

const port=process.env.PORT || 3000;
const mongoURI=process.env.MONGO_URI || "";
const redisURI=process.env.REDIS_URL||""
export const redisTTL=process.env.REDIS_TTL||60*60*4;
// const stripeKey=process.env.STRIPE_KEY || "";

Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

connectDB(mongoURI);
export const redis=connectRedis(redisURI);
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET
})

// export const stripe= new Stripe(stripeKey)
export const nodeCache = new NodeCache();

 // use to cache data

const app=express();

// middleWare---------------------------------------------

   app.use(express.json());
   app.use(morgan("dev"));
   app.use(cors());


   app.get("/",(req,res)=>{
    res.send("hello")
   })

// user Routes---------------------------------------------

app.use("/api/v1/user",userRoute);

// product Routes-----------------------------------------

app.use("/api/v1/product",productRoute);

//  order Routes-----------------------------------------

app.use("/api/v1/order",orderRoute)

//payment route------------------------------
app.use("/api/v1/payment",paymentRoute)

// DashBoard Route---------------------------

app.use("/api/v1/dashboard",dashboardRoute);

app.use("/uploads",express.static("uploads"));



// middleWare for errorHandling-------------------------------------------

app.use(errorMiddleware);

app.listen(port,()=>{
    console.log("server working on",port);
});