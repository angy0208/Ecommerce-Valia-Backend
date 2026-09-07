const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.use(helmet());

const limiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 100,

    message: {
        message:
        "Demasiadas solicitudes. Intenta nuevamente más tarde."
    }

});


app.use(limiter);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://valia-ecommerce-eight.vercel.app"
    ],
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    credentials: true
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Backend funcionando correctamente"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Backend funcionando correctamente",
  });
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;