const errorHandler = (err, req, res, next) => {
    console.error("Error:", err.message, err.stack);
    // Default error response
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    // Handle specific error codes
    switch (err.code) {
        case 11000:
            message = "Duplicate key error - resource already exists";
            statusCode = 409;
            break;
        case "P2025":
            message = "Record not found";
            statusCode = 404;
            break;
        case 50:
            message = "Request timeout";
            statusCode = 408;
            break;
        case 13:
            message = "Unauthorized access";
            statusCode = 403;
            break;
    }
    // Send structured error response
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};
export default errorHandler;
