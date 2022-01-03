import React from "react";
import {BrowserRouter, Route, Switch} from "react-router-dom";
import BrokerPage from "../pages/brokers/BrokerPage";
import BrokersPage from "../pages/brokers/BrokersPage";
import CheckICA from "../pages/icas/CheckICA";
import CreditorInstitutions from "../pages/creditorInstitutions/CreditorInstitutions";
import CreditorInstitution from "../pages/creditorInstitutions/CreditorInstitution";
import CreateCreditorInstitution from "../pages/creditorInstitutions/CreateCreditorInstitution";
import EditCreditorInstitution from "../pages/creditorInstitutions/EditCreditorInstitution";
import Ica from "../pages/icas/ICAs";
import PaymentServiceProviders from "../pages/paymentServiceProviders/PaymentServiceProviders";
import PaymentServiceProvider from "../pages/paymentServiceProviders/PaymentServiceProvider";
import Layout from "../components/Layout";
import NotFound from "../pages/NotFound";
import CreateBrokerPage from "../pages/brokers/CreateBrokerPage";
import EditBrokerPage from "../pages/brokers/EditBrokerPage";


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

                                    <Route path="/brokers" exact component={BrokersPage}/>
                                    <Route path="/brokers/create" component={CreateBrokerPage} />
                                    <Route path="/brokers/:code" render={props => {
                                        const edit: boolean = new URLSearchParams(props.location.search).get("edit") !== null;
                                        return edit ? <EditBrokerPage {...props} /> : <BrokerPage {...props} />;
                                    }}/>

                                    <Route path="/payment-service-providers" exact component={PaymentServiceProviders}/>

                                    <Route path="/icas" exact component={Ica} />
                                    <Route path="/icas/check" exact component={CheckICA} />

                                    <Route path="/payment-service-providers" exact component={PaymentServiceProviders}/>
                                    <Route path="/payment-service-providers/:code" render={props => {
                                        const edit: boolean = new URLSearchParams(props.location.search).get("edit") !== null;
                                        return edit ? <NotFound /> : <PaymentServiceProvider {...props} />;
                                    }}/>

                                    <Route component={NotFound}/>
                                </Switch>
                            </Layout>
                    )}/>
                </BrowserRouter>
        );
    }

}
