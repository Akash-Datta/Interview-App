import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true
})

export const sendChatMessage = async ({ messages, context }) => {
    const response = await api.post("/api/chat", { messages, context })
    return response.data
}
