const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const { chatController } = require("../controllers/chat.controller")

const chatRouter = express.Router()

chatRouter.post("/", authMiddleware.authUser, chatController)

module.exports = chatRouter
