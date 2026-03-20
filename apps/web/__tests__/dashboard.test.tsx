/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock auth context
jest.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "1", name: "Test User", email: "test@test.com", role: "USER" },
    token: "test-token",
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock api
jest.mock("../src/lib/api", () => ({
  apiFetch: jest.fn(),
}));

describe("Dashboard Page", () => {
  it("should have test setup configured correctly", () => {
    expect(true).toBe(true);
  });
});
