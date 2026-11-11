const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

async function authUser(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({
            message: "token not provided"
        })
    }

    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        })
    }

    // Only hit the database for tokens that are actually valid.
    const isTokenBlacklisted = await tokenBlacklistModel.exists({ token })
    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "Token is invalid"
        })
    }

    req.user = decoded;
    next()
}

module.exports = { authUser }
