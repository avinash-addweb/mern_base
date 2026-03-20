import { z } from "zod";
import type { Request, Response } from "express";
import { validate } from "../../src/middlewares/validate";
import { AppError } from "../../src/middlewares/errorHandler";

describe("validate middleware", () => {
  const mockRes = {} as Response;
  let nextFn: jest.Mock;

  beforeEach(() => {
    nextFn = jest.fn();
  });

  const testSchema = z.object({
    body: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email"),
    }),
  });

  it("should call next() for valid input", () => {
    const req = {
      body: { name: "Test", email: "test@example.com" },
      query: {},
      params: {},
    } as unknown as Request;

    validate(testSchema)(req, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith();
  });

  it("should return validation error for invalid input", () => {
    const req = {
      body: { name: "", email: "invalid" },
      query: {},
      params: {},
    } as unknown as Request;

    validate(testSchema)(req, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith(expect.any(AppError));
    const error = nextFn.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe("VALIDATION_ERROR");
    expect(error.details).toBeDefined();
  });

  it("should return details for missing fields", () => {
    const req = {
      body: {},
      query: {},
      params: {},
    } as unknown as Request;

    validate(testSchema)(req, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith(expect.any(AppError));
    const error = nextFn.mock.calls[0][0] as AppError;
    expect(error.details).toBeDefined();
  });
});
