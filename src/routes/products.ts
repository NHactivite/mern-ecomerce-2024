import express from "express";
import { addWish, deletedProducts, deleteReview, getAdminProducts, getAllBrands, getAllCategories, getAllProducts, getLateastProducts, getSingleProducts, getWish, newProduct, newReview, productReview, updateProduct, wishHandle } from "../controllers/product.js";
import { adminOnly } from "../middlewares/auth.js";
import { multiUpload, singleUpload } from "../middlewares/multer.js";


const app=express.Router();

app.post("/new",multiUpload,adminOnly,newProduct);

app.get("/all",getAllProducts)

app.get("/latest",getLateastProducts);

app.get("/categories",getAllCategories);

app.get("/brands",getAllBrands);

app.get("/admin-products",adminOnly,getAdminProducts);

app.post("/review/new/:id",newReview)
app.post("/wish/new/:id",wishHandle)
app.get("/reviews/:id",productReview)
app.get("/wish",getWish)
app.delete("/review/:id",deleteReview)

app.route("/:id").get(getSingleProducts).put(adminOnly,multiUpload,updateProduct).delete(adminOnly,deletedProducts)


export default app;