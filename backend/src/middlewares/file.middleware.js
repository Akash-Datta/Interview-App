const multer= require("multer")

const upload= multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
            const error = new Error("Only PDF files are supported");
            error.status = 400;
            return cb(error);
        }
        cb(null, true);
    }
})

module.exports= upload
