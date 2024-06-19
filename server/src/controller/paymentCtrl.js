const asyncHandler = require("express-async-handler");

// const Razorpay = require ("razorpay");
// const instance = new Razorpay({
//     key_id:"rzp_test_mlXfKqzPMnMDua",key_secret:"ICY62laBEbkaN7MjO7EuawN5",
// })

// const checkout = asyncHandler(async (req,res) => {
//     try{

//         const option = {
//             amount:5000,
//             currency:"INR"
//         }
//         const order = await instance.payments.create(option);
//         res.json({
//             success:true,
//             order
//         })
//     }
//     catch (error){
//         throw new Error(error)
//     }
// })

// const paymentVertification = asyncHandler(async (req,res) => {
//     try{
//         const {razorpayOrderId,razorpayPaymentId} = req.body
//        res.json({
//         razorpayOrderId,razorpayPaymentId
//        })
//     }
//     catch (error){
//         throw new Error(error)
//     }
// })

// module.exports = {
//     checkout,paymentVertification
// }
const dotenv = require("dotenv").config();

const stripe = require('stripe')(process.env.SCRIPT_PRIVATE_KEY);

const paymentIntent = asyncHandler(async (req, res) => {
    const {amountTotal,shipInfo} = req.body;
//const carrierMeta = carrier.map(item=>({
  //  id:item.id,
   //title:item.title,
  //brand:item.brand,
    //price:item.price,
 //  quatity:item.quantity,
   //color:item.color
//}))
    try {

        const stp = await stripe.paymentIntents.create({
            amount:amountTotal ,
            shipping:{
                name:shipInfo.firstname+" "+shipInfo.lastname,
                phone:shipInfo.mobile,
                
                address:{
                    city:shipInfo.city,
                    country:shipInfo.country,
                    line1:shipInfo.line1,
                },
            },
          
            
            currency: 'vnd',
            automatic_payment_methods: {
                enabled: true,
            },
        });
        res.json({
            clientSecret: stp.client_secret,
          })
    }
    catch (error) {
        throw new Error(error)
    }
})

module.exports={paymentIntent}