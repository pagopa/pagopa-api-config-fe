import React from "react";
import {BrowserRouter, Route, Switch} from "react-router-dom";
import Layout from "../components/Layout";
import CreditorInstitutions from "../pages/creditorInstitutions/CreditorInstitutions";
import Broker from "../pages/Broker";
import NotFound from "../pages/NotFound";
import CreditorInstitution from "../pages/creditorInstitutions/CreditorInstitution";
import CreateCreditorInstitution from "../pages/creditorInstitutions/CreateCreditorInstitution";
import EditCreditorInstitution from "../pages/creditorInstitutions/EditCreditorInstitution";

export default class Routes extends React.Component {

    render(): React.ReactNode {
        return (

                <BrowserRouter>
                    <Route render={(props)=>(
                            <Layout {...props}>
                                <Switch>
                                    <Route path="/" exact component={CreditorInstitutions}/>
                                    <Route path="/creditor-institutions" exact component={CreditorInstitutions}/>
                                    <Route path="/creditor-institutions/create" component={CreateCreditorInstitution} />
                                    <Route path="/creditor-institutions/:code" render={props => {
                                        const edit: boolean = new URLSearchParams(props.location.search).get("edit") !== null;
                                        return edit ? <EditCreditorInstitution {...props} /> : <CreditorInstitution {...props} />;
                                    }}/>
                                    <Route path="/brokers" component={Broker}/>
                                    <Route component={NotFound}/>
                                </Switch>
                            </Layout>
                    )}/>
                </BrowserRouter>
        );
    }

}
