import React from "react";
import {FaDharmachakra} from "react-icons/fa";
import { Form } from "react-bootstrap";
import {SignOutButton} from "./SignOutButton";
import {SignInButton} from "./SignInButton";

interface IProps {
    isAuthenticated: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
}

export default class Topbar extends React.Component<IProps, IState> {

    beta: boolean = false;

    toggleBeta() {
        // eslint-disable-next-line functional/immutable-data
        this.beta = !this.beta;
        localStorage.setItem("beta", String(this.beta));
    }

    render() {
        return (

                <nav className="navbar navbar-light sticky-top bg-white flex-md-nowrap p-0 shadow">
                    <a className="navbar-brand col-md-3 col-lg-2 mr-0 px-3" href="#">
                        <img src={require('../assets/images/logo-pagopa.png')} title="logo"/>
                        {localStorage.getItem("ALT") != null && <FaDharmachakra className="ml-2"/>}
                    </a>
                    <div>
                        <Form>
                            <Form.Check
                                    type="switch"
                                    id="beta-switch"
                                    label="Beta"
                                    onChange={() => this.toggleBeta()}
                            />
                        </Form>
                    </div>

                    <div className={"m-2"}>
                        {this.props.isAuthenticated ? <SignOutButton/> : <SignInButton/>}
                    </div>

                    <button className="navbar-toggler position-absolute d-md-none collapsed" type="button"
                            data-toggle="collapse" data-target="#sidebarMenu" aria-controls="sidebarMenu"
                            aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                </nav>
        );
    }
};
