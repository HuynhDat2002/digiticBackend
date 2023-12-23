const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");

const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");
const { LocalStorage } = require('node-localstorage');
const { exists } = require("../models/blogModel");
const { isNull } = require("util");
const localStorage = new LocalStorage('./scratch')

// Create a User ----------------------------------------------

const createUser = asyncHandler(async (req, res) => {

  const email = req.body.email;
  const findUser = await User.findOne({ email: email });

  if (!findUser) {
    const newUser = await User.create(req.body);
    res.json(newUser);
  } else {
    throw new Error("User Already Exists");
  }
});
const logined = asyncHandler(async (req, res) => {
  return res.json({ Status: "Success" })
});
// Login a user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(
      findUser.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
      sameSite: 'None',
      secure: true
    });
    res.json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      address: findUser?.address,
      image: findUser?.image,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// admin login
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Not Authorised");
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin._id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
      secure: true,
      sameSite: 'None'
    });
    if (req.cookies) console.log(req.cookies.refreshToken)

    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      address: findAdmin?.address,
      image: findAdmin?.image,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// handle refresh token

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error(" No Refresh token present in db or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken, user });
  });
});

// logout functionality

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;

  console.log(cookie)
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  console.log('has cookie')

  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  console.log(user)
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });
    return res.sendStatus(204); // forbidden
  }
  await User.findOneAndUpdate({ refreshToken }, {
    refreshToken: "",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });

  res.sendStatus(204); // forbidden
});

// Update a user

const updatedUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        firstname: req?.body?.firstname,
        lastname: req?.body?.lastname,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
        address: req?.body?.address,
        image: req?.body?.image
      },
      {
        new: true,
      }
    );
    const findAdmin = await User.findById(_id);


    res.json({
      _id: updatedUser._id,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      address: updatedUser.address,
      image: updatedUser.image,
      token: generateToken(_id),
    });
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
});

// save user Address

const saveAddress = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        address: req?.body?.address,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

// Get all users

const getallUser = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find().populate("wishlist");
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});


// Get a single user

const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const getaUser = await User.findById(id);
    res.json({
      getaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});


// delete a single user

const deleteaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      deleteaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const blockusr = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );
    res.json(blockusr);
  } catch (error) {
    throw new Error(error);
  }
});

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );
    res.json({
      message: "User UnBlocked",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.json(user);
  }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) throw new Error("User not found with this email");
  if (!user.cart) {
    user.cart = null; // Đảm bảo rằng cart không phải là mảng trống
  }

  try {
    const token = await user.createPasswordResetToken();
    console.log(token);
    await user.save();
    const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:3000/reset-password/${token}'>Click Here</>`;
    const data = {
      to: email,
      text: "Hey guy",
      subject: "Forgot Password Link",
      htm: resetURL,
    };
    sendEmail(data);
    console.log('sent')
    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  console.log("password")
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user.cart) {
    user.cart = null; // Đảm bảo rằng cart không phải là mảng trống
  }

  if (!user) throw new Error(" Token Expired, Please try again later");
  console.log("user reset password: ", user);
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  res.json(user);
});

const getWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id).populate("wishlist");
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});

const userCart = asyncHandler(async (req, res) => {
  const { productId,color,quantity,price } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {

    let newCart = await new Cart({
      userId:_id,
      productId,
      color,
      quantity,
      price

    }).save()
    // const user = await User.findById(_id);
    // const id = newCart._id;
    // console.log('id',id);
    //   user.cart.push(id)
    //  await user.save();
    res.json(newCart);
    // let products = [];
    // // check if user already have product in cart
    // const user = await User.findById(_id);
    // const existingCart = await Cart.findOne({ orderby: user._id });

    // if (!existingCart) {

    //   for (let i = 0; i < cart.length; i++) {
    //     let object = {};
    //     object.product = cart[i].prodId;
    //     object.count = cart[i].count;
    //     object.color = cart[i].color;
    //     let getPrice = await Product.findById(cart[i].prodId).select("price").exec();
    //     object.price = getPrice.price;
    //     products.push(object);
    //   }

    //   // for (let i = 0; i < products.length; i++) {
    //   //   cartTotal = cartTotal + products[i].price * products[i].count;
    //   // }

    //   let newCart = await new Cart({
    //     products,
    //     orderby: user?._id,

    //   }).save();
    //   // let newCart = await Cart.create({
    //   //   products,
    //   //   cartTotal,
    //   //   orderby: user?._id,
    //   // })
    //   user.cart = newCart;
    //   await user.cart.save();
    //   res.json(newCart);
    // }

    // for (let i = 0; i < cart.length; i++) {
    //   const existingProduct = await existingCart.products.find((item) => item.product._id.toString() === cart[i].prodId.toString());
    //   if (existingProduct) {
    //     existingProduct.count += cart[i].count;


    //   }
    //   else {
    //     let object = {};
    //     object.product = cart[i].prodId;
    //     object.count = cart[i].count;
    //     object.color = cart[i].color;
    //     let getPrice = await Product.findById(cart[i].prodId).select("price").exec();
    //     object.price = getPrice.price;

    //     existingCart.products.push(object)
    //   }
    // }


    // await existingCart.save();
    // user.cart = existingCart
    // await user.save();
    // res.json(existingCart);


  } catch (error) {
    throw new Error(error);
  }
});

const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const user = await User.findOne({ _id });

    console.log('cart: ', userCart)
    const cart = await Cart.find({ userId: user._id }).populate(
      "productId userId color",
   
    );
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

// const emptyCart = asyncHandler(async (req, res) => {
//   const { _id } = req.user;
//   validateMongoDbId(_id);
//   try {
//     const user = await User.findOne({ _id });
//     const cart = await Cart.findOneAndRemove({ orderby: user._id });
//     user.cart = await Cart.findOne({ orderby: user._id });;
//     console.log(user.cart)
//     await user.save();

//     res.json(cart);
//   } catch (error) {
//     throw new Error(error);
//   }
// });

// const applyCoupon = asyncHandler(async (req, res) => {
//   const { coupon } = req.body;
//   const { _id } = req.user;
//   validateMongoDbId(_id);
//   const validCoupon = await Coupon.findOne({ name: coupon });
//   if (validCoupon === null) {
//     throw new Error("Invalid Coupon");
//   }

//   const user = await User.findOne({ _id });
//   let cart = await Cart.findOne({
//     orderby: user._id,
//   }).populate("products.product");

//   let totalAfterDiscount = (
//     cart.cartTotal -
//     (cart.cartTotal * validCoupon.discount) / 100
//   ).toFixed(2);


//   await Cart.findOneAndUpdate(
//     { orderby: user._id },
//     {

//       totalAfterDiscount
//     },
//     { new: true }
//   );
//   res.json(totalAfterDiscount);
// });

// const removeCoupon = asyncHandler(async (req, res) => {
//   const { coupon } = req.body;
//   const { _id } = req.user;
//   validateMongoDbId(_id);
//   const validCoupon = await Coupon.findOne({ name: coupon });
//   if (validCoupon === null) {
//     throw new Error("Invalid Coupon");
//   }
//   const user = await User.findOne({ _id });

//   let cart = await Cart.findOne({
//     orderby: user._id,
//   }).populate("products.product");

//   let totalAfterDiscount = cart.cartTotal;
//   await Cart.findOneAndUpdate(
//     { orderby: user._id },
//     { totalAfterDiscount },
//     { new: true }
//   );
//   res.json(totalAfterDiscount);
// });


// const createOrder = asyncHandler(async (req, res) => {
//   //cartTotal = products.reduce((total, item) => total + item.price * item.count, 0);
//   const { COD, couponApplied } = req.body;
//   const { _id } = req.user;
//   validateMongoDbId(_id);
//   try {
//     if (!COD) throw new Error("Create cash order failed");
//     const user = await User.findById(_id);
//     let userCart = await Cart.findOne({ orderby: user._id });
//     console.log("usercart: ", userCart);
//     let finalAmout = 0;
//     if (couponApplied ) {

//       finalAmout = userCart.cartTotal;

//     }
//     let newOrder = await new Order({
//       products: userCart.products,
//       paymentIntent: {
//         id: uniqid(),
//         method: "COD",
//         amount: finalAmout,
//         status: "Cash on Delivery",
//         created: Date.now(),
//         currency: "vnd",
//       },
//       orderby: user._id,
//       orderStatus: "Cash on Delivery",
//     }).save();
//     let update = userCart.products.map((item) => {
//       return {
//         updateOne: {
//           filter: { _id: item.product._id },
//           update: { $inc: { quantity: -item.count, sold: +item.count } },
//         },
//       };
//     });
//     const updated = await Product.bulkWrite(update, {});
//     res.json({ message: "success" });
//   } catch (error) {
//     throw new Error(error);
//   }
// });

// const getOrders = asyncHandler(async (req, res) => {
//   const { _id } = req.user;
//   validateMongoDbId(_id);
//   try {
//     const userorders = await Order.findOne({ orderby: _id })
//       .populate("products.product")
//       .populate("orderby")
//       .exec();
//     res.json(userorders);
//   } catch (error) {
//     throw new Error(error);
//   }
// });

// const getAllOrders = asyncHandler(async (req, res) => {
//   try {
//     const alluserorders = await Order.find()
//       .populate("products.product")
//       .populate("orderby")
//       .exec();
//     res.json(alluserorders);
//   } catch (error) {
//     throw new Error(error);
//   }
// });
// const getOrderByUserId = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   validateMongoDbId(id);
//   try {
//     const userorders = await Order.findOne({ orderby: id })
//       .populate("products.product")
//       .populate("orderby")
//       .exec();
//     res.json(userorders);
//   } catch (error) {
//     throw new Error(error);
//   }
// });
// const updateOrderStatus = asyncHandler(async (req, res) => {
//   const { status } = req.body;
//   const { id } = req.params;
//   validateMongoDbId(id);
//   try {
//     const order = await Order.findById(
//       id,
//     );
//     order.orderStatus = status;
//     await order.save();
//     res.json(order);
//   } catch (error) {
//     throw new Error(error);
//   }
// });
const createOrder = asyncHandler(async (req, res) => {
  const { shippingInfo, orderItems, totalPrice, totalPriceAfterDiscount, paymentInfo } = req.body;
  const { _id } = req.user;
  try {
    const order = await Order.create({
      shippingInfo, orderItems, totalPrice, totalPriceAfterDiscount, paymentInfo, user: _id
    })
    res.json({
      order,
      success: true
    })
  }
  catch (error) {
    throw new Error(error);
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const orders = await Order.find({userId:_id}).populate("user").populate("orderItems.product").populate("orderItems.color")
    res.json({
      orders
    })
  }
  catch (error) {
    throw new Error(error);
  }
});

const getMonthWiseOrderIncome = asyncHandler(async (req, res) => {
  var month = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  let d = new Date();
  console.log('d1', d);
  let endDate = "";
  d.setDate(1);
  for (let i = 0; i <= 11; i++) {
    endDate = month[d.getMonth()] + " " + d.getFullYear()
    d.setMonth(d.getMonth() - 1)
  }
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate)
        },
      }
    }, {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
        },
        amount: { $sum: "$totalPriceAfterDiscount" },
      }
    }])
  res.json(data);
})

module.exports = {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  getWishlist,
  saveAddress,
  userCart,
  getUserCart,
  getMyOrders,
  createOrder,
 
  getMonthWiseOrderIncome
};
