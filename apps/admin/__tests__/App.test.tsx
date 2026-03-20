import React from "react";
import "@testing-library/jest-dom";

// Mock the API module before anything imports it
jest.mock("../src/lib/api", () => ({
  apiFetch: jest.fn(),
}));

// Mock lucide-react to avoid ESM/JSX transform issues
jest.mock("lucide-react", () => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop === "string" && prop !== "__esModule") {
          return () => null;
        }
        return undefined;
      },
    },
  );
});

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: () => null,
  Navigate: () => null,
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  NavLink: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Outlet: () => null,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/" }),
  useParams: () => ({}),
}));

// Mock auth context
jest.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

import { render } from "@testing-library/react";
import App from "../src/App";

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
