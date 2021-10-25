import React from "react";
import {BrowserRouter, Route, Switch} from "react-router-dom";
import Layout from "../components/Layout";
import CreditorInstitutions from "../pages/creditorInstitutions/CreditorInstitutions";
import BrokersPage from "../pages/brokers/BrokersPage";
import NotFound from "../pages/NotFound";
import CreditorInstitution from "../pages/creditorInstitutions/CreditorInstitution";
import BrokerPage from "../pages/brokers/BrokerPage";

export default class Routes extends React.Component {

    render(): React.ReactNode {
        return (

                <BrowserRouter>
                    <Route render={(props)=>(
                            <Layout {...props}>
                                <Switch>
                                    <Route path="/" exact component={CreditorInstitutions}/>
                                    <Route path="/creditor-institutions" exact component={CreditorInstitutions}/>
                                    <Route path="/creditor-institutions/:code" component={CreditorInstitution} />
                                    <Route path="/brokers" exact component={BrokersPage}/>
                                    <Route path="/brokers/:code" component={BrokerPage} />
                                    <Route component={NotFound}/>
                                </Switch>
                            </Layout>
                    )}/>
                </BrowserRouter>
        );
    }

}
