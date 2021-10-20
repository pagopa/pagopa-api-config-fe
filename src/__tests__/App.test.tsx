import React from "react";
import { render, screen } from "@testing-library/react";
import App from "../pages/App";

/**
 * @jest-environment jsdom
 */

test("renders learn lorem ipsum text", () => {
  render(<App />);
  const linkElement = screen.getByText(/lorem ipsum/i);
  expect(linkElement).toBeInTheDocument();
});
