const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const providerDonationRoutes = require("./routes/providerDonationRoutes");
const ngoDonationRoutes = require("./routes/ngoDonationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminNgoRoutes = require("./routes/admin.ngo.routes");
const ratingRoutes = require("./routes/ratingRoutes");
const aiRoutes = require("./routes/ai.routes");
const pickupRequestRoutes = require("./routes/pickupRequestRoutes");
const providerRoutes = require("./routes/providerRoutes");
const ngoRoutes = require("./routes/ngoRoutes");
const ngoAnalyticsRoutes = require("./routes/ngoAnalyticsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "FoodBridge API", status: "running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/provider/donations", providerDonationRoutes);
app.use("/api/ngo/donations", ngoDonationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/ngos", adminNgoRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/ngos", ngoRoutes);
app.use("/api/ngo", ngoAnalyticsRoutes);
app.use("/api/pickup-requests", pickupRequestRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  // Central error handler
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    return res
      .status(400)
      .json({ success: false, message: message || "Validation failed" });
  }
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
