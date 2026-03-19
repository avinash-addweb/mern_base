import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../src/App";

describe("App", () => {
  it("renders the admin dashboard", () => {
    render(<App />);
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });
});
