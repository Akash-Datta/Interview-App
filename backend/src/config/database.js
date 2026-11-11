const mongoose = require("mongoose");
const dns = require("dns");

function isDnsError(error) {
    return ["ECONNREFUSED", "ENOTFOUND", "ETIMEOUT", "EAI_AGAIN"].includes(error.code)
        || /querySrv|queryTxt/i.test(error.message || "");
}

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
        if (!isDnsError(error)) {
            console.error("Error connecting to database:", error.message);
            process.exit(1);
        }

        // Some Windows/Node setups fail to resolve MongoDB Atlas SRV records
        // through the system resolver. Retry once using public DNS servers.
        console.warn("System DNS could not resolve the MongoDB host. Retrying with public DNS...");
        dns.setServers(["8.8.8.8", "1.1.1.1"]);

        try {
            await mongoose.connect(process.env.MONGO_URI);
        } catch (retryError) {
            console.error("Error connecting to database:", retryError.message);
            process.exit(1);
        }
    }

    console.log("Database connected successfully");
}

module.exports = connectDB;
