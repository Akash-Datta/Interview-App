require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/database");

const PORT = process.env.PORT || 3000;

const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET", "GOOGLE_API_KEY"];

async function startServer() {
    const missing = REQUIRED_ENV_VARS.filter(name => !process.env[name]);
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(", ")}`);
        process.exit(1);
    }

    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(`Port ${PORT} is already in use.`);
        } else {
            console.error("Server error:", error.message);
        }
        process.exit(1);
    });
}

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});

startServer().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
});
