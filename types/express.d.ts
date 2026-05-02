import { Prisma } from "@prisma/client";

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

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};