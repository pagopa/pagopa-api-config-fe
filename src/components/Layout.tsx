import React from 'react';
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";


function Layout(props) {
    return (
            <div>

                <Topbar />

                <div className="container-fluid">
                    <div className="row">
                        <nav id="sidebarMenu" className="col-md-2 col-lg-2 d-md-block bg-white sidebar collapse">
                            <div className="sidebar-sticky pt-5">
                                <Sidebar history={props.history} />
                            </div>
                        </nav>

                        <main role="main" className="col-md-10 ml-sm-auto col-lg-10 px-md-4">
                            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
                                {props.children}
                            </div>
                        </main>

                    </div>
                </div>
            </div>
    );
}

export default Layout;
