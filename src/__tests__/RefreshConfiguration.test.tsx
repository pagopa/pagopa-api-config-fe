import React from "react";
import {act, render, screen} from "@testing-library/react";
import {createMemoryHistory} from 'history';
import { Router } from 'react-router-dom';
import Routes from "../util/routes";

/**
 * @jest-environment jsdom
 */

test("rendering RefreshConfiguration page through navigation on /refresh-config", () => {

  const history = createMemoryHistory();
  const route = '/';
  history.push(route);

  render(
          <Router history={history}>
            <Routes />
          </Router>
  );

  // Interact with page
  act(() => {
    // Find the link
    const goLink = document.querySelector('[href="/refresh-config"]');
    if (goLink != null) {
      // Click it
      goLink.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    }
  });

  // verify page content for expected route
  expect(screen.getAllByText(/Refresh Configuration/i));
});
