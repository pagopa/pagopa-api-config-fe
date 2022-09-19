import React from "react";
import {createMemoryHistory} from 'history';
import {shallow, configure} from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import Station from "../pages/stations/Station";


/**
 * @jest-environment jsdom
 */

configure({adapter: new Adapter()});


test("rendering Station through navigation on /stations/{id}", () => {

    const history = createMemoryHistory();
    const route = '/stations/1234567_01';
    history.push(route);
    const match = {params: {code: 1234567_01}};

    const wrapper = shallow(<Station history={history} match={match}></Station>,
        { disableLifecycleMethods: true });

    wrapper.setState({isLoading: false, isError: false, code: 1234567_01});

    // verify page content for expected route
    expect(wrapper.find("#enabled"));
});

