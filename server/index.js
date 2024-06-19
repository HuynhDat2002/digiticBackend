const bodyParser = require("body-parser");
const express = require('express')

const dbConnect = require("./src/config/dbConnect");
const { notFound, errorHandler } = require("./src/middlewares/errorHandler");
const app = express();
const dotenv = require("dotenv").config();
const PORT = 5000;
const authRouter = require("./src/routes/authRoute");
const productRouter = require("./src/routes/productRoute");
const blogRouter = require("./src/routes/blogRoute");
const categoryRouter = require("./src/routes/prodcategoryRoute");
const blogcategoryRouter = require("./src/routes/blogCatRoute");
const brandRouter = require("./src/routes/brandRoute");
const colorRouter = require("./src/routes/colorRoute");
const enqRouter = require("./src/routes/enqRoute");
const couponRouter = require("./src/routes/couponRoute");
const uploadRouter = require("./src/routes/uploadRoute");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

dbConnect();
app.use(morgan("dev"));
app.use(cors({
  origin:["http://localhost:3000"],
  methods: ["GET,HEAD,PUT,PATCH,POST,DELETE"],
  credentials:true,
}));
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/user", authRouter);
app.use("/api/product", productRouter);
app.use("/api/blog", blogRouter);
app.use("/api/category", categoryRouter);
app.use("/api/blogcategory", blogcategoryRouter);
app.use("/api/brand", brandRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/color", colorRouter);
app.use("/api/enquiry", enqRouter);
app.use("/api/upload", uploadRouter);
app.get('/',(req,res)=>{
  res.status(200).json({
    name:"trongdat",
    age: 22
  })
})
app.use(notFound);
app.use(errorHandler);
app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is running  at PORT ${process.env.SERVER_PORT}`);
});
