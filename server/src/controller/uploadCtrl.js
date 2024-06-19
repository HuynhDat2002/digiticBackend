const fs = require("fs");
const asyncHandler = require("express-async-handler");

const {
  cloudinary,
  cloudinaryDeleteImg,
} = require("../utils/cloudinary");

const uploadImages = asyncHandler(async (req, res) => {

  try {

    const urls = [];
    const files = req.files;
    for (const file of files) {
      const { path } = file;
      const newpath = await cloudinary.uploader.upload(path, { folder: "digiticShop/images/products" })
      urls.push(newpath);
    //  const deleted =await cloudinary.uploader.destroy(newpath.public_id);

      //fs.unlinkSync(path);
    }
    
    const images = urls.map((file) => {
      return file;
    });
    res.json(images);
  } catch (error) {
    throw new Error(error);
  }
});
const deleteImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const deleted =await cloudinary.uploader.destroy(`digiticShop/images/products/${id}`);
    // cloudinaryDeleteImg(id, "images");
    res.json({ message: "Deleted" });
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  uploadImages,
  deleteImages,
};
