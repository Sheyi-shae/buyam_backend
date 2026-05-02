import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload | Record<string, any>;
    }
    interface User {
      id: number;
      sub?:number
      email: string | null;
  name: string | null;
  avatar: string | null;
      role:string
      publicId:string
    }
  }
}
