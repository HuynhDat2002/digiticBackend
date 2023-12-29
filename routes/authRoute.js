const express = require("express");
const {
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
  removeProductFromCart,
  deleteCart,
  getMonthWiseOrderIncome ,
  updateProductQuantityFromCart,
  getYearlyTotalOrders,
  getMonthWiseOrderCount,
  removeProductFromWishlist,
  getAllOrders,
  getSingleOrders,
  updateOrder,
} = require("../controller/userCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { paymentIntent }  = require("../controller/paymentCtrl");
const router = express.Router();
router.post("/register", createUser);
router.post("/forgot-password-token", forgotPasswordToken);

router.put("/reset-password/:token", resetPassword);

router.put("/password", authMiddleware, updatePassword);
router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
router.delete('/cart/delete-product-cart/:cartItemId',authMiddleware,removeProductFromCart);
router.delete('/cart/delete-cart',authMiddleware,deleteCart);

router.delete("/update-product-cart/:cartItemId/:newQuantity",authMiddleware,updateProductQuantityFromCart);
//router.post("/cart/applycoupon", authMiddleware, applyCoupon);
//router.delete("/cart/remove-coupon", authMiddleware, removeCoupon);

router.get('/getMonthWiseOrderIncome',authMiddleware,getMonthWiseOrderIncome)

router.get('/getyearlyorders',authMiddleware,getYearlyTotalOrders)

router.post("/cart/create-order", authMiddleware, createOrder);
router.get("/all-users",authMiddleware,isAdmin, getallUser);
router.get("/getmyorders", authMiddleware, getMyOrders);
router.get("/getallorders", authMiddleware, isAdmin, getAllOrders);
router.get("/getaOrder/:id", authMiddleware, getSingleOrders);
router.put("/updateOrder/:id", authMiddleware, isAdmin, updateOrder);
//router.get("/getorderbyuser/:id", authMiddleware, getOrderByUserId );
router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);  
router.get("/wishlist", authMiddleware, getWishlist);
router.delete("/wishlist",authMiddleware,removeProductFromWishlist)

router.get("/cart", authMiddleware, getUserCart);
// router.post("/order/checkout",authMiddleware,checkout)
router.post('/create-payment-intent',authMiddleware,paymentIntent)
router.get("/:id", authMiddleware, isAdmin, getaUser);
//router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete("/:id", deleteaUser);
// router.put(
//   "/order/update-order/:id",
//   authMiddleware,
//   isAdmin,
//   updateOrderStatus
// );
router.put("/edit-user", authMiddleware, updatedUser);
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);

module.exports = router;
