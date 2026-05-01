import { PrismaClient } from "@prisma/client";

declare global {
  // Allow attaching prisma client to globalThis to avoid creating multiple clients in dev
  var prisma: PrismaClient | undefined;
}

export { };
  
  
  
export interface Message {
  buyerId: number;
  sellerId: number;
  productId: number;
  senderId: number;
  content: string;
  type?: string;
  avatar?: string;
  }

  declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      path?: string;
    }
  }
}