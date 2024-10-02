import { NextFunction, Request, Response } from "express";




export interface NewUserRequestBody{
    _id:string;
    name:string;
    email:string;
    photo:string;
    gender:string;
    dob:Date;
    age:number;
}

export interface NewProductRequestBody{
    name:string;
    category:string;
    price:number;
    stock:number;
}

export type ControllerType= (
     req: Request,
     res: Response, 
     next: NextFunction) => Promise<void | Response<any, Record<string, any>>>


    export type searchRequestQuery={
        search?:string;
        price?:string;
        category?:string;
        sort?:string;
        page?:string;
    }
    export interface BaseQuery{
        name?: {
            $regex:string,
            $options:string,
          };
          price?:{
            $lte:number,
          },
          category?:string
    }


export type invalidatesCacheProps={
    
     product?:boolean,
     order?:boolean,
     admin?:boolean,
     userId?:string,
     orderId?:string,
     productId?:string | string[],
}

export type orderItemType={
    name:string;
    photo:string;
    quantity:number;
    price:number;
    productId:string;
}
export type shippingInfoType={
    address:string;
    city:string;
    state:string;
    country:string;
    pinCode:number;
}



export interface NewOrderRequestBody{
    shippingInfo:shippingInfoType;
    userId:string;
    subtotal:number;
    tax:number;
    shippingCharges:number;
    discount:number;
    total:number;
    orderItems:orderItemType[]
}
