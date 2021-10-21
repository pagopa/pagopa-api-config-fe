import React from "react";
import {act, render, screen} from "@testing-library/react";
import {createMemoryHistory} from 'history';
import { Router } from 'react-router-dom';
import Routes from "../util/routes";

/**
 * @jest-environment jsdom
 */

test("rendering IntermediariEC through navigation", () => {

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
      const goLink = document.querySelector('[href="/intermediariec"]');
      if (goLink != null) {
          // Click it
          goLink.dispatchEvent(new MouseEvent("click", {bubbles: true}));
      }
  });

  // verify page content for expected route
  expect(screen.getByText(/IntermediariEC/i)).toBeInTheDocument();

});
