import React from "react";
import {BrowserRouter, Route, Switch} from "react-router-dom";
import Layout from "../components/Layout";
import EntiCreditori from "../pages/EntiCreditori";
import IntermediariEC from "../pages/IntermediariEC";
import NotFound from "../pages/NotFound";


function Routes() {
    return (

            <BrowserRouter>
                 <Route render={(props)=>(
                     <Layout {...props}>
                         <Switch>
                             <Route path="/" exact component={EntiCreditori}/>
                             <Route path="/ec" exact component={EntiCreditori}/>
                             <Route path="/intermediariec" component={IntermediariEC}/>
                             <Route component={NotFound}/>
                         </Switch>
                     </Layout>
                 )}/>
            </BrowserRouter>
    );
}

export default Routes;
