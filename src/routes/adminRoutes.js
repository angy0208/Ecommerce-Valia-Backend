const express = require("express");

const {
  login
} = require("../controlllers/adminController.js");

const verifyAdmin = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/login", login);

router.get("/verify", verifyAdmin, (req, res) => {
  res.status(200).json({
    message: "Token válido.",
    admin: req.admin
  });
});

module.exports = router;