import React from 'react';
import {ToastContainer} from "react-toastify";
import {injectToken} from "../util/MsalWrapper";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface IProps {
    history: {
        location: {
            pathname: string;
        };
        push(url: string): void;
    };
    instance: any;
    accounts: any;
    isAuthenticated: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
    loading: boolean;
}

class Layout extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            loading: true,
        };
    }

    render(): React.ReactNode {

        return (
            <div>

                <Topbar isAuthenticated={this.props.isAuthenticated}/>

                <div className="container-fluid">
                    <div className="row">
                        <nav id="sidebarMenu" className="col-md-2 col-lg-2 d-md-block bg-white sidebar collapse">
                            <div className="sidebar-sticky">
                                <Sidebar history={this.props.history}/>
                            </div>
                        </nav>

                        <main role="main" className="col-md-10 ml-sm-auto col-lg-10 px-md-4">
                            <div
                                className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
                                {this.props.children}
                            </div>
                        </main>
                    </div>
                </div>


                <ToastContainer
                    position="top-center"
                    autoClose={10000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />

            </div>
        );
    }
}

export default injectToken(Layout);
