const express = require("express");
const { createOrder } = require("../controlllers/orderController.js");

const router = express.Router();

router.post("/", createOrder);

module.exports = router;