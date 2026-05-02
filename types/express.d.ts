import { JwtPayload } from "jsonwebtoken";
import { Prisma } from "@prisma/client";
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}



export type AuthenticatedUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    name: true;
    avatar: true;
    role: true;
    publicId: true;
  };
}>;

interface MyJwtPayload {
  sub: number;
}
