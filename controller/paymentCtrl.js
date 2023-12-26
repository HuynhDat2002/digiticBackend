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

const stripe = require('stripe')("sk_test_51OGEGLKScb87tq5mbDkwZcziQDqn3wNGIroN5GWitltbXeuiM9mOSeyH8JutA602fFgmE4Z7zjP9kuTJJDqw0x6U00i9rH9oED");

const paymentIntent = asyncHandler(async (req, res) => {
    const {amountTotal,shipInfo} = req.body;

    try {
        const stp = await stripe.paymentIntents.create({
            amount:amountTotal ,
            shipping:{
                name:shipInfo.firstname+" "+shipInfo.lastname,
                phone:shipInfo.mobile,
                
                address:{
                    city:shipInfo.city,
                    country:shipInfo.country,
                    line1:shipInfo.address,
                }
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