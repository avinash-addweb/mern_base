import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.test.tsx", "**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@base-mern/types$": "<rootDir>/../../packages/types/src/index.ts",
    "^@base-mern/utils$": "<rootDir>/../../packages/utils/src/index.ts",
  },
  transformIgnorePatterns: ["/node_modules/(?!(lucide-react)/)"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          module: "CommonJS",
          moduleResolution: "node",
          verbatimModuleSyntax: false,
          esModuleInterop: true,
        },
      },
    ],
  },
};

export default config;
