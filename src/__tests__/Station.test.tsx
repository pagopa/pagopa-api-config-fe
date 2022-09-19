import React from "react";
import { render, screen} from "@testing-library/react";
import {createMemoryHistory} from 'history';
import { Router } from 'react-router-dom';
import Routes from "../util/routes";

/**
 * @jest-environment jsdom
 */

test("rendering Station through navigation on /stations/{id}", () => {

  const history = createMemoryHistory();
  const route = '/stations/1234567_01';
  history.push(route);

  render(
          <Router history={history}>
            <Routes />
          </Router>
  );

  // verify page content for expected route
  expect(screen.getAllByText(/Stato/i));
});
