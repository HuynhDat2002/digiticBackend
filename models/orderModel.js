const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema(
 {
  user: {
     type:mongoose.Schema.Types.ObjectId,
     ref:"User",
     required:true,
    
  },
  shippingInfo: {
    name:{
      type:String,
      required:true,
    },
    phone:{
      type:String,
      required:true,
    },
    address:{
      city:{
        type:String,
      },
      country:{
        type:String,
      },
      line1:{
        type:String,
      },
      line2:{
        type:String,
      }
    },
   

    
  },
  paymentInfo:{
    id:{
      type:String
    },
    currency:{
      type:String
    },
    paymentTypes:[],
  },
  orderItems:[
    {
      product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:true
      },
      color:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Color",
        required:true
      },
      quantity:{
        type:Number,
        required:true
      },
      price:{
        type:Number,
        required:true
      },
    }
  ],
  paidAt:{
    type:Date,
    default:Date.now()
  },
  totalPrice:{
    type:Number,
    require:true,
  },
  totalPriceAfterDiscount:{
    type:Number,
    require:true
  },
  orderStatus:{
    type:String,
    default:"Ordered"
  },
  month:{
    type:String,
    default:new Date().getMonth()+1
  },
  
 }, 
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Order", orderSchema);
