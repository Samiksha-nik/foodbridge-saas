const dotenv = require("dotenv");
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is required in .env");
  process.exit(1);
}

const app = require("./app");
const connectDB = require("./config/db");

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
