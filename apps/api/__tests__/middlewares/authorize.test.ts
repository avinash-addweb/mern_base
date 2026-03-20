import type { Request, Response } from "express";
import { UserRole } from "@base-mern/types";
import { authorize } from "../../src/middlewares/authorize";
import { AppError } from "../../src/middlewares/errorHandler";

describe("authorize middleware", () => {
  const mockRes = {} as Response;
  let nextFn: jest.Mock;

  beforeEach(() => {
    nextFn = jest.fn();
  });

  it("should call next() when user has required role", () => {
    const req = { user: { id: "1", role: UserRole.ADMIN } } as unknown as Request;
    authorize(UserRole.ADMIN)(req, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith();
  });

  it("should return 403 when user role is not in allowed list", () => {
    const req = { user: { id: "1", role: UserRole.USER } } as unknown as Request;
    authorize(UserRole.ADMIN)(req, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith(expect.any(AppError));
    const error = nextFn.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(403);
    expect(error.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no user on request", () => {
    const req = { user: undefined } as unknown as Request;
    authorize(UserRole.ADMIN)(req, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith(expect.any(AppError));
    const error = nextFn.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
  });

  it("should allow multiple roles", () => {
    const req = { user: { id: "1", role: UserRole.USER } } as unknown as Request;
    authorize(UserRole.USER, UserRole.ADMIN)(req, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith();
  });
});
