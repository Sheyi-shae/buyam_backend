// import { PrismaClient } from "@prisma/client";
// import { PrismaPg } from '@prisma/adapter-pg'
// import dotenv from 'dotenv';



// // configure dotenv
// dotenv.config();


// const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
// const db = new PrismaClient({ adapter })
// export default db;

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });

const db = new PrismaClient({ adapter });

export default db;