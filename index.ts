
import dotenv from 'dotenv';
// configure dotenv
dotenv.config();
import express from 'express';
//middlewares
import cors from "cors";
import errorHandler from './middleware/error-middleware.js';
//routes
import authRouter from './routes/auth.js';
import productRouter from './routes/product.js';
import categoryRouter from './routes/category.js';
import cookieParser from 'cookie-parser';
import passport from "./config/passport.js";
import uploadRouter from './routes/upload.js';
//websockets
import { createServer } from "http";
import { Server } from "socket.io";
import chatSocket from './controllers/chats.js';
import subCategoryRouter from './routes/sub_category.js';
import db from './libs/db.js';
import likeRouter from './routes/product-likes.js';
import reviewRouter from './routes/product-review.js';
import userRouter from './routes/user.js';
import UserReviewRouter from './routes/user-review.js';
import conversationRouter from './routes/conversation.js';
import paymentRouter from './routes/payment.js';
import webhookRouter from './routes/paystack-webhook.js';







const app = express();
// webhook here
app.use('/api/webhook', webhookRouter);


app.use(express.json()); //parse json request body
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
//websocket setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,  
    credentials: true,
  },
});

chatSocket(io);

app.use(passport.initialize());

//routes

app.use('/api/auth', authRouter);
app.use('/api/product', productRouter)
app.use('/api/category', categoryRouter)
app.use('/api/upload', uploadRouter);
app.use('/api/like', likeRouter);
app.use('/api/sub_category', subCategoryRouter)
app.use('/api/review',reviewRouter)
app.use('/api/user', userRouter)
app.use('/api/user-review', UserReviewRouter)
app.use('/api/conversation', conversationRouter)
app.use('/api/payment', paymentRouter)


//db connect check
async function checkDB() {
    try {
      await db.$connect();
     console.log('Database connected successfully');
      
    } catch (error) {
     console.error('Database connection failed:', error);
      process.exit(1); // Exit the process with failure
    }
  }
checkDB();
// Error handling middleware
app.use(errorHandler);
const PORT = process.env.PORT || 8080;
  
httpServer.listen(PORT, () => {
  console.log(`Server + WebSocket running on http://localhost:${PORT}`);
});


