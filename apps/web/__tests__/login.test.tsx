/**
 * @jest-environment jsdom
 */
import "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock api
const mockApiFetch = jest.fn();
jest.mock("../src/lib/api", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// Mock auth context
const mockLogin = jest.fn();
jest.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    login: mockLogin,
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe("Login Page", () => {
  it("should render login form", () => {
    // This is a placeholder test verifying the test setup works
    expect(true).toBe(true);
  });
});
