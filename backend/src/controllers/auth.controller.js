const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

const isProduction = process.env.NODE_ENV === "production"

// In production the frontend and backend are often on different domains, which
// requires SameSite=None + Secure for the auth cookie to be sent at all.
const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/"
}

function signToken(user) {
    return jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )
}

function publicUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email
    }
}

async function registerUserController(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const normalizedUsername = String(username).trim()

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
    })
    if (isUserAlreadyExists) {
        return res.status(400).json({ message: "User already exists with this username or email address" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user
    try {
        user = await userModel.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword
        })
    } catch (error) {
        // Handles the race where two requests register the same account at once.
        if (error.code === 11000) {
            return res.status(400).json({ message: "User already exists with this username or email address" });
        }
        throw error
    }

    res.cookie("token", signToken(user), {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000
    })

    res.status(201).json({
        message: "User registered successfully",
        user: publicUser(user)
    });
}

async function loginUserController(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await userModel
        .findOne({ email: String(email).toLowerCase().trim() })
        .select("+password")
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    res.cookie("token", signToken(user), {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000
    })

    res.status(200).json({
        message: "User logged in successfully",
        user: publicUser(user)
    });
}

async function logoutUserController(req, res) {
    const token = req.cookies.token
    if (token) {
        await tokenBlacklistModel.create({ token })
    }
    res.clearCookie("token", cookieOptions)

    res.status(200).json({
        message: "User logged out successfully"
    })
}

async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
        message: "User details fetched successfully",
        user: publicUser(user)
    })
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}
