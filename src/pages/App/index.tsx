import React from "react";
import MainContent from "../../components/MainContent";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

function App() {
    return (
            <div>

                <Navbar />

                <div className="container-fluid">
                    <div className="row">
                        <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
                            <div className="sidebar-sticky pt-3">
                                <Sidebar />
                            </div>
                        </nav>

                        <main role="main" className="col-md-9 ml-sm-auto col-lg-10 px-md-4">
                            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
                                <MainContent />
                            </div>
                        </main>

                    </div>
                </div>
            </div>
    );
}

export default App;
