import React from "react";
import {render, screen} from "@testing-library/react";
import {createMemoryHistory} from 'history';
import Station from "../pages/stations/Station";

/**
 * @jest-environment jsdom
 */

test("rendering Station through navigation on /stations/{id}", () => {

    const history = createMemoryHistory();
    const route = '/stations/1234567_01';
    history.push(route);
    const match = {params: {code: 1234567_01}};

    render(
        <Station history={history} match={match}>
        </Station>
    );

    // verify page content for expected route
    expect(screen.getAllByText(/Stazioni/i));
});

