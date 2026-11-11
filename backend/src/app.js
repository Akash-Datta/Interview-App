const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.disable("x-powered-by");

// Required for secure cookies when running behind a reverse proxy (Render, Fly, etc.)
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// Baseline security headers. Add helmet or your platform's header controls for
// a stricter Content-Security-Policy before going live.
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Requests without an Origin header (curl, health checks, same-origin) are allowed.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

//require all routes here
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");
const chatRouter = require("./routes/chat.routes");
//using all the routes here
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/chat", chatRouter);

//health check
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

//404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

//central error handler
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: err.code === "LIMIT_FILE_SIZE"
                ? "File is too large. Maximum allowed size is 5MB"
                : err.message
        });
    }

    // Mongoose validation / bad ObjectId / duplicate key errors are client errors.
    if (err.name === "ValidationError" || err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: "A record with these details already exists"
        });
    }

    console.error(err);

    const status = err.status || 500;
    // Only expose error details for client errors and our own AI service errors;
    // never leak raw provider/internal messages for other 5xx responses.
    const safeToExpose = err.name === "AiServiceError" || status < 500;
    const isProduction = process.env.NODE_ENV === "production";

    res.status(status).json({
        success: false,
        message: (safeToExpose || !isProduction)
            ? (err.message || "Internal server error")
            : "Internal server error"
    });
});

module.exports = app;
