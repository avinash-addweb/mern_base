import "@testing-library/jest-dom";

// Mock lucide-react to avoid ESM/JSX transform issues
jest.mock("lucide-react", () => ({
  Server: () => null,
  Globe: () => null,
  Shield: () => null,
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

import { render, screen } from "@testing-library/react";
import Home from "../src/app/page";

describe("Home page", () => {
  it("renders the heading", () => {
    render(<Home />);
    expect(screen.getByText(/Base MERN/)).toBeInTheDocument();
  });
});
