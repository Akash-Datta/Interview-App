const { generateChatReply } = require("../services/ai.service")

const MAX_MESSAGES = 16
const MAX_MESSAGE_LENGTH = 4000
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 25

// Lightweight in-memory throttle. For multi-instance deployments use a shared
// store such as Redis so the limit applies across every server process.
const requestLog = new Map()

function isRateLimited(userId) {
    const now = Date.now()
    const recent = (requestLog.get(userId) || []).filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS)

    if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
        requestLog.set(userId, recent)
        return true
    }

    recent.push(now)
    requestLog.set(userId, recent)

    // Keep the map from growing forever on long-running servers.
    if (requestLog.size > 5000) {
        for (const [key, timestamps] of requestLog) {
            if (!timestamps.some(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS)) {
                requestLog.delete(key)
            }
        }
    }

    return false
}

function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) return []

    const sanitized = messages
        .filter(message => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
        .map(message => ({
            role: message.role,
            content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH)
        }))
        .filter(message => message.content)
        .slice(-MAX_MESSAGES)

    // Gemini conversations should start with a user turn.
    while (sanitized.length > 0 && sanitized[0].role !== "user") {
        sanitized.shift()
    }

    return sanitized
}

async function chatController(req, res) {
    const userId = String(req.user?.id || "anonymous")

    if (isRateLimited(userId)) {
        return res.status(429).json({
            success: false,
            message: "You are sending messages too quickly. Please wait a moment and try again."
        })
    }

    const messages = sanitizeMessages(req.body?.messages)

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
        return res.status(400).json({
            success: false,
            message: "Please include at least one message from the user."
        })
    }

    const reply = await generateChatReply({
        messages,
        context: req.body?.context
    })

    res.status(200).json({
        success: true,
        message: "Chat reply generated successfully",
        data: { reply }
    })
}

module.exports = { chatController }
