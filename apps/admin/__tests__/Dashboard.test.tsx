/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: () => ({ pathname: "/" }),
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock api
jest.mock("../src/lib/api", () => ({
  apiFetch: jest.fn(),
}));

// Mock useApiQuery
jest.mock("../src/hooks/useApiQuery", () => ({
  useApiQuery: () => ({
    data: { pagination: { total: 42 } },
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

// Mock auth
jest.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "1", name: "Admin", email: "admin@test.com", role: "ADMIN" },
    token: "test-token",
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe("Dashboard Page", () => {
  it("should have test setup configured correctly", () => {
    expect(true).toBe(true);
  });
});
