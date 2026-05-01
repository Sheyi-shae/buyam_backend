import dotenv from 'dotenv';
import db from "./libs/db.js";


// configure dotenv
dotenv.config();
async function checkDB() {
    try {
      await db.$connect();
      console.log('Database connected successfully');
      console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);

      
    } catch (error) {
     console.error('Database connection failed:', error);
      process.exit(1); // Exit the process with failure
    }
  }
checkDB();