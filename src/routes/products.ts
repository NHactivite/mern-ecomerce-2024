import express from "express";
import { deletedProducts, getAdminProducts, getAllCategories, getAllProducts, getLateastProducts, getSingleProducts, newProduct, updateProduct } from "../controllers/product.js";
import { adminOnly } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";


const app=express.Router();

app.post("/new",singleUpload,newProduct);

app.get("/all",getAllProducts)

app.get("/latest",getLateastProducts);

app.get("/categories",getAllCategories);

app.get("/admin-products",adminOnly,getAdminProducts);

app.route("/:id").get(getSingleProducts).put(adminOnly,singleUpload,updateProduct).delete(adminOnly,deletedProducts)

export default app;