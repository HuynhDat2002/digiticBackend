const asyncHandler = require("express-async-handler");

const Razorpay = require ("razorpay");
const instance = new Razorpay({
    key_id:"rzp_test_mlXfKqzPMnMDua",key_secret:"ICY62laBEbkaN7MjO7EuawN5",
})

const checkout = asyncHandler(async (req,res) => {
    try{

        const options = {
            amount:5000,
            currency:"INR"
        }
        const order = await instance.orders.create(option);
        res.json({
            success:true,
            order
        })
    }
    catch (error){
        throw new Error(error)
    }
})

const paymentVertification = asyncHandler(async (req,res) => {
    try{
        const {razorpayOrderId,razorpayPaymentId} = req.body
       res.json({
        razorpayOrderId,razorpayPaymentId
       })
    }
    catch (error){
        throw new Error(error)
    }
})

module.exports = {
    checkout,paymentVertification
}