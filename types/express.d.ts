import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload | Record<string, any>;
    }
    interface User {
      id: number;
      sub:number
      name: string;
      email: string;
      avatar: string;
      role:string
      publicId:string
    }
  }
}
