import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Base MERN API",
      version: "1.0.0",
      description: "API documentation for the Base MERN application",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["USER", "ADMIN"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
                token: { type: "string" },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/modules/**/*.ts", "./src/routes/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
