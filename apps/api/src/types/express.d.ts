import { IUser } from "@base-mern/types";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
