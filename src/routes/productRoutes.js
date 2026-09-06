const express = require("express");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  upload,
} = require("../controlllers/productController.js");

const verifyAdmin = require("../middleware/authMiddleware.js");

const router = express.Router();


// GET TODOS - PÚBLICO
router.get("/", getProducts);


// GET UNO - PÚBLICO
router.get("/:id", getProductById);


// CREAR - ADMIN
router.post(
  "/",
  verifyAdmin,
  upload.array("images", 3),
  createProduct
);


// ACTUALIZAR - ADMIN
router.put(
  "/:id",
  verifyAdmin,
  upload.array("images", 3),
  updateProduct
);


// ELIMINAR - ADMIN
router.delete(
  "/:id",
  verifyAdmin,
  deleteProduct
);


// ELIMINAR IMAGEN INDIVIDUAL - ADMIN
router.delete(
  "/:id/image/:filename",
  verifyAdmin,
  deleteProductImage
);


module.exports = router;