import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/orders.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/features.js";


export const getDashboardStats=TryCatch(async(req,res,next)=>{
      
         let stats;
         const key="adminStats"

         stats=await redis.get(key) 

         if(stats) {
            stats=JSON.parse(stats)
        } 
        else
        {
            const today=new Date();
            const sixMonthAgo=new Date();
            sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6)
            const thisMonth={
                    start:new Date(today.getFullYear(),today.getMonth(),1),
                    end:today
            }
           
            const lastMonth={
                start:new Date(today.getFullYear(),today.getMonth() - 1,1),
                end:new Date(today.getFullYear(),today.getMonth(),0)
             }
             
            const thisMonthProductsPromise = Product.find({
                createdAt:{
                    $gte:thisMonth.start,
                    $lte:thisMonth.end
                }
            })
            

            const lastMonthProductsPromise = Product.find({
                createdAt:{
                    $gte:lastMonth.start,
                    $lte:lastMonth.end
                }
            })

            const thisMonthUserPromise = User.find({
                createdAt:{
                    $gte:thisMonth.start,
                    $lte:thisMonth.end
                }
            })

            const lastMonthUserPromise = User.find({
                createdAt:{
                    $gte:lastMonth.start,
                    $lte:lastMonth.end 
                }
            })
               
               
            const thisMonthOrderPromise = Order.find(
                {
                    createdAt:{
                        $gte:thisMonth.start,
                        $lte:thisMonth.end
                    }
                }
            )

            const lastMonthOrderPromise = Order.find({
                createdAt:{
                    $gte:lastMonth.start,
                    $lte:lastMonth.end
                }
            })

            const lastSixMonthOrderPromise = Order.find({
                createdAt:{
                    $gte:sixMonthAgo,
                    $lte:today
                }
            })
               
            const lateastTransactionPromise=Order.find({}).select(["orderItems","discount","total","status"]).limit(4)


            const [thisMonthOrder,
                thisMonthProducts,
                thisMonthUser,
                lastMonthOrder,
                lastMonthProducts,
                lastMonthUser,
                ProductCount,
                UserCount,
                allOrders,
                lastSixMonthOrders,
                categories,
                femaleUserCount,
                lateastTransaction
            ]=await Promise.all(
                [
                thisMonthOrderPromise,
                thisMonthProductsPromise,
                thisMonthUserPromise,
                lastMonthOrderPromise,
                lastMonthProductsPromise,
                lastMonthUserPromise,
                Product.countDocuments(),
                User.countDocuments(),
                Order.find({}).select("total"),
                lastSixMonthOrderPromise,
                Product.distinct("category"), 
                User.countDocuments({gender:"female"}),
                lateastTransactionPromise
                ])
                
                const thisMonthRevenue=thisMonthOrder.reduce(
                    (total,order)=>total+(order.total || 0),0
                )
                const lastMonthRevenue=lastMonthOrder.reduce(
                    (total,order)=>total+(order.total || 0),0
                )

               
              const Changepercent={
                revenue:calculatePercentage(thisMonthRevenue,lastMonthRevenue),
                order:calculatePercentage(thisMonthOrder.length,lastMonthOrder.length),
                product:calculatePercentage(thisMonthProducts.length,lastMonthProducts.length),
                user:calculatePercentage(thisMonthUser.length,lastMonthUser.length)
              }
               
              const revenue=allOrders.reduce(
                (total,order)=>total+(order.total || 0),0
              )
              const count={
                revenue,
                user:UserCount,
                product:ProductCount,
                order:allOrders.length
              }

              const orderMonthCount=new Array(6).fill(0);
              const monthRevenueCount=new Array(6).fill(0);


              lastSixMonthOrders.forEach((order)=>{
                const creationDate=order.createdAt;
                const monthDiff=(today.getMonth() - creationDate.getMonth() +12)%12;

                if(monthDiff < 6)
                {
                    orderMonthCount[5 - monthDiff] +=1;
                    monthRevenueCount[5 - monthDiff] +=order.total;
                }

              });

                const allCategoriesAndStock=await  getInventories({
                    categories,ProductCount
                });

               const userRatio={
                male:UserCount - femaleUserCount,
                female:femaleUserCount,
               }
              
               const modifiedTransaction=lateastTransaction.map((i)=>(
               {
                _id:i._id,
                discount:i.discount,
                total:i.total,
                status:i.status,
                quantity:i.orderItems.length
               }
               ))

              stats={
                userRatio,
                allCategoriesAndStock, 
                Changepercent,
                count,
                chart:{
                    orderMonthCount,
                    monthRevenueCount
                },
               modifiedTransaction
                  }

                  await redis.setex(key,redisTTL,JSON.stringify(stats));
        }

        return res.status(200).json({
            success:true,
            stats
        })
    }

)


export const getPieChart=TryCatch(async(req,res,next)=>{
    let charts;
    const key="adminPieCharts"
    charts=await redis.get(key)
    if(charts)
    {
        charts=JSON.parse(charts)
    }
    else
    {
      const [processingOrder,shippedOrder,deliveredOrder,categories,ProductCount,productOutofStock,allOrders,userWithDOB,admin,customers] =await Promise.all([
        Order.countDocuments({status:"Processing"}),
        Order.countDocuments({status:"Shipped"}),
        Order.countDocuments({status:"Delivered"}),
        Product.distinct("category"),
        Product.countDocuments(),
        Product.countDocuments({stock:0}),
        Order.find({}).select(["total","discount","subtotal","tax","shippingCharges"]),
        User.find({}).select(["dob"]),
        User.countDocuments({role:"admin"}),
        User.countDocuments({role:"user"})
        ]);
      const orderFullfillment={
        processing:processingOrder,
        shipped:shippedOrder,
        delivered:deliveredOrder
      };
       
      const allCategoriesAndStock=await  getInventories({
        categories,ProductCount
    });
       
    const stockAvailibility={
        inStock:ProductCount-productOutofStock,
        outofStock:productOutofStock
    }

    const grossIncome=allOrders.reduce((prev,order)=>prev +(order.total || 0),0);

    const discount=allOrders.reduce((prev,order)=>prev +(order.discount || 0),0);
   
    const productionCost=allOrders.reduce((prev,order)=>prev +(30 ),0);

    const burnt=allOrders.reduce((prev,order)=>prev +(order.shippingCharges || 0),0);
      
    const marketingCost=Math.round(grossIncome*(Number(process.env.MARKETING_COST)/100))
   
    const netMargin=grossIncome - discount - productionCost - burnt - marketingCost;

    const revenueDistribution={
               netMargin,
               discount,
               productionCost,
               burnt,
               marketingCost
                 }

    const totalUsers={
        admin,
        customers
    }   
    
    const usersAgeGroup={
            teen:userWithDOB.filter(i=>i.age<20).length,
            adult:userWithDOB.filter(i=>i.age>=20 && i.age<40).length,
            old:userWithDOB.filter(i=> i.age>=40).length
    }
         
      charts={
        orderFullfillment,
        allCategoriesAndStock,
        stockAvailibility,
        revenueDistribution,
        usersAgeGroup,
        totalUsers
        }


      await redis.setex(key,redisTTL,JSON.stringify(charts));
    }
    return res.status(200).json({
        success:true,
        charts
       })
})


export const getBarCharts=TryCatch(async(req,res,next)=>{
   let charts;
   const key="adminBarCharts";
   charts=await redis.get(key)
   if(charts)
   {
    charts=JSON.parse(charts)
   }
   else
   {
    const today=new Date();
    const sixMonthAgo=new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6)

    const twelveMonthAgo=new Date();
    twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12)

    
    const sixMonthUserPromise = User.find({
        createdAt:{
            $gte:sixMonthAgo,
            $lte:today
        }
    }).select("createdAt")
    const twelveMonthOrderPromise = Order.find({
        createdAt:{
            $gte:twelveMonthAgo,
            $lte:today
        }
    }).select("createdAt")
    const sixMonthProductPromise = Product.find({
        createdAt:{
            $gte:sixMonthAgo,
            $lte:today
        }
    }).select("createdAt")

const [sixMonthProduct,sixMonthUser,twelveMonthOrder] = await Promise.all([
        sixMonthProductPromise,sixMonthUserPromise,twelveMonthOrderPromise
    ])
    
    const productCount=getChartData({length:6,docArr:sixMonthProduct,today})
    const usersCounts = getChartData({ length:6, today, docArr:sixMonthUser});
    const ordersCounts = getChartData({ length:12, today, docArr:twelveMonthOrder});
   
    charts={
             users:usersCounts,
             products:productCount,
             orders:ordersCounts
    }

    await redis.setex(key,redisTTL,JSON.stringify(charts));
   }
return res.status(200).json({
    success:true,
    charts
   })
})



export const getLineCharts=TryCatch(async(req,res,next)=>{
    let charts;
    const key="adminLineCharts";
    charts=await redis.get(key)
    if(charts)
    {
     charts=JSON.parse(charts)
    }
    else
    {
     const today=new Date();
     const twelveMonthAgo=new Date();
     twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);

     const baseQuery={
        createdAt:{
            $gte:twelveMonthAgo,
            $lte:today
        }
     }
 
     const twelveMonthProductPromise = Product.find(baseQuery).select("createdAt")

     const twelveMonthUserPromise = User.find(baseQuery).select("createdAt")

    const twelveMonthOrderPromise = Order.find(baseQuery).select(["createdAt","discount","total"])
    
 
 const [products,users,orders] = await Promise.all([
    twelveMonthProductPromise,twelveMonthUserPromise,twelveMonthOrderPromise
     ])
     
     const productCount=getChartData({length:12,docArr:products,today})
     const usersCounts = getChartData({ length:12, today, docArr:users});
     const disCount= getChartData({ length:12, today, docArr:orders, property:"discount"});
     const revenue= getChartData({ length:12, today, docArr:orders, property:"total"});
     charts={
              users:usersCounts,
              products:productCount,
              disCount,
              revenue
     }
 
     await redis.setex(key,redisTTL,JSON.stringify(charts));
    }
 return res.status(200).json({
     success:true,
     charts
    })
 })
 