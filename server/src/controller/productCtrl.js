const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const { clouldinaryUploadImg, cloudinary } = require("../utils/cloudinary")
const validateMongoDbId = require("../utils/validateMongodbId");
const fs = require('fs')

const createProduct = asyncHandler(async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const id = req.params.id;
  console.log("id: ", id);
  validateMongoDbId(id);
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const updateProduct = await Product.findOneAndUpdate({ _id: id }, req.body, {
      new: true,
    });
    console.log(updateProduct)
    res.json(updateProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const {id} = req.params;
  validateMongoDbId(id);
  try {
    const deleteProduct = await Product.findByIdAndDelete(id);
    res.json(deleteProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const getaProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const findProduct = await Product.findById(id).populate("color");
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllProduct = asyncHandler(async (req, res) => {
  try {
    // Filtering
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit","search", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log('querystr',JSON.parse(queryStr))
    let query = Product.find(JSON.parse(queryStr)).populate("color");
    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }
    // if (req.query.maxprice) {
    //   query = query.where('price').lte(req.query.maxprice);
    // }
    // if (req.query.minprice) {
    //   query = query.where('price').gte(req.query.maxprice);

    // }
    // limiting the fields

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      console.log('fields',fields)
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(",").join(" "); 
    //   const requestedFields = req.query.fields.split(",");

    //   console.log('fields',fields)
    //   const regexPatterns = {
    //     fields: { $regex: new RegExp(req.query.search, 'i') }
    //   }
    
    //   // Combine regex patterns with $or for multiple fields
    //   const searchCondition = { $or: regexPatterns };
    
    //   // Apply the search condition to the query
    //   query = query.find(searchCondition);
    // }
    
    //search
    if (req.query.search) {
      Product.createIndexes({ description: 'text' ,title:"text",category:"text",brand:"text",tags:"text"});
      const searchRegex = new RegExp(req.query.search, 'i');
      const searchQuery = { $text: { $search: searchRegex } };
      query = query.find(searchQuery);
      // query = query.or([
      //   { category: { $regex: searchRegex } },
      //   {brand: { $regex: searchRegex } },
      //   { title: { $regex: searchRegex } },
      //   { description: { $regex: searchRegex } },
        // Thêm các trường khác mà bạn muốn tìm kiếm ở đây
      //]);
    }

    // if(req.query.search){
    //   const q = {}
    //   q.$or=[
    //     {
    //       category:{$regex: new RegExp(req.query.search, 'i')}
    //     },
    //     {
    //       brand:{$regex: new RegExp(req.query.search, 'i')}
    //     },
    //     {
    //       title:{$regex: new RegExp(req.query.search, 'i')}
    //     },
    //     {
    //       description:{$regex: new RegExp(req.query.search, 'i')}
    //     },
    //   ]
    //   query=query.find(q)
    // }

    // pagination

    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      console.log('page',typeof req.query.page);
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("This Page does not exists");
    }
    const product = await query;
    res.json(product);
  } catch (error) {
    throw new Error(error);
  }
});
const addToWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { prodId } = req.body;
  try {
    const user = await User.findById(_id);
    const alreadyadded = user.wishlist.find((id) => id.toString() === prodId);
    if (alreadyadded) {
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $pull: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    } else {
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $push: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    }
  } catch (error) {
    throw new Error(error);
  }
});



const rating = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, prodId, comment } = req.body;
  try {
    const product = await Product.findById(prodId);
    let alreadyRated = product.ratings.find(
      (userId) => userId.postedby.toString() === _id.toString()
    );
    if (alreadyRated) {
      const updateRating = await Product.updateOne(
        {
          ratings: { $elemMatch: alreadyRated },
        },
        {
          $set: { "ratings.$.star": star, "ratings.$.comment": comment },
        },
        {
          new: true,
        }
      );
    } else {
      const rateProduct = await Product.findByIdAndUpdate(
        prodId,
        {
          $push: {
            ratings: {
              star: star,
              comment: comment,
              postedby: _id,
            },
          },
        },
        {
          new: true,
        }
      );
    }
    const getallratings = await Product.findById(prodId);
    let totalRating = getallratings.ratings.length;
    let ratingsum = getallratings.ratings
      .map((item) => item.star)
      .reduce((prev, curr) => prev + curr, 0);
    let actualRating = Math.round(ratingsum / totalRating);
    let finalproduct = await Product.findByIdAndUpdate(
      prodId,
      {
        totalrating: actualRating,
      },
      { new: true }
    );
    res.json(finalproduct);
  } catch (error) {
    throw new Error(error);
  }
});

const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(req.files)
  validateMongoDbId(id);
  try {
    const urls = [];
    const files = req.files;
    for (const file of files) {
      const { path } = file;
      console.log(path)
      const newpath = await cloudinary.uploader.upload(path, { folder: "digiticShop/images/products" })

      console.log(newpath);
      urls.push(newpath);
      // fs.unlinkSync(path);
    }
    const findProduct = await Product.findByIdAndUpdate(id, {
      $push: {
        images: urls.map((file) => ({
          public_id: file.public_id,
          url: file.url,
        })),
      },
    }, {
      new: true,
    })
    res.json(findProduct)
  }
  catch (error) {
    throw new Error(error)
  }
});

module.exports = {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
  uploadImages
};
