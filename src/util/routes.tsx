import React from "react";
import {BrowserRouter, Route, Switch} from "react-router-dom";
import BrokerPage from "../pages/brokers/BrokerPage";
import BrokersPage from "../pages/brokers/BrokersPage";
import CreateBrokerPage from "../pages/brokers/CreateBrokerPage";
import EditBrokerPage from "../pages/brokers/EditBrokerPage";
import Icas from "../pages/icas/ICAs";
import CheckICA from "../pages/icas/CheckICA";
import CreditorInstitutions from "../pages/creditorInstitutions/CreditorInstitutions";
import CreditorInstitution from "../pages/creditorInstitutions/CreditorInstitution";
import CreateCreditorInstitution from "../pages/creditorInstitutions/CreateCreditorInstitution";
import EditCreditorInstitution from "../pages/creditorInstitutions/EditCreditorInstitution";
import Stations from "../pages/stations/Stations";
import Station from "../pages/stations/Station";
import CreateStation from "../pages/stations/CreateStation";
import EditStation from "../pages/stations/EditStation";
import PaymentServiceProviders from "../pages/paymentServiceProviders/PaymentServiceProviders";
import PaymentServiceProvider from "../pages/paymentServiceProviders/PaymentServiceProvider";
import CreatePaymentServiceProvider from "../pages/paymentServiceProviders/CreatePaymentServiceProvider";
import EditPaymentServiceProvider from "../pages/paymentServiceProviders/EditPaymentServiceProvider";
import BrokersPSP from "../pages/brokersPSP/BrokersPSP";
import BrokerPSP from "../pages/brokersPSP/BrokerPSP";
import CreateBrokerPSP from "../pages/brokersPSP/CreateBrokerPSP";
import EditBrokerPSP from "../pages/brokersPSP/EditBrokerPSP";
import Channels from "../pages/channels/Channels";
import Channel from "../pages/channels/Channel";
import CreateChannel from "../pages/channels/CreateChannel";
import EditChannel from "../pages/channels/EditChannel";
import CDIs from "../pages/cdis/CDIs";
import ConfigurationKeys from "../pages/configuration/ConfigurationKeys";
import Pdds from "../pages/configuration/Pdds";
import WFESPPlugins from "../pages/configuration/WFESPPlugins";
import Layout from "../components/Layout";
import NotFound from "../pages/NotFound";

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

                                    <Route path="/stations" exact component={Stations}/>
                                    <Route path="/stations/create" component={CreateStation} />
                                    <Route path="/stations/:code" render={props => {
                                        const edit: boolean = new URLSearchParams(props.location.search).get("edit") !== null;
                                        return edit ? <EditStation {...props} /> : <Station {...props} />;
                                    }}/>

                                    <Route path="/icas" exact component={Icas} />
                                    <Route path="/icas/check" exact component={CheckICA} />

                                    <Route path="/payment-service-providers" exact component={PaymentServiceProviders}/>
                                    <Route path="/payment-service-providers/create" component={CreatePaymentServiceProvider} />
                                    <Route path="/payment-service-providers/:code" render={props => {
                                        const edit: boolean = new URLSearchParams(props.location.search).get("edit") !== null;
                                        return edit ? <EditPaymentServiceProvider {...props} /> : <PaymentServiceProvider {...props} />;
                                    }}/>

                                    <Route path="/brokers-psp" exact component={BrokersPSP}/>
                                    <Route path="/brokers-psp/create" component={CreateBrokerPSP} />
                                    <Route path="/brokers-psp/:code" render={props => {
                                        const edit: boolean = new URLSearchParams(props.location.search).get("edit") !== null;
                                        return edit ? <EditBrokerPSP {...props} /> : <BrokerPSP {...props} />;
                                    }}/>

                                    <Route path="/channels" exact component={Channels}/>
                                    <Route path="/channels/create" component={CreateChannel} />
                                    <Route path="/channels/:code" render={props => {
                                        const edit: boolean = new URLSearchParams(props.location.search).get("edit") !== null;
                                        return edit ? <EditChannel {...props} /> : <Channel {...props} />;
                                    }}/>

                                    <Route path="/cdis" exact component={CDIs} />

                                    <Route path="/configuration-keys" exact component={ConfigurationKeys}/>
                                    <Route path="/pdds" exact component={Pdds}/>
                                    <Route path="/wfesp-plugins" exact component={WFESPPlugins}/>

                                    <Route component={NotFound}/>
                                </Switch>
                            </Layout>
                    )}/>
                </BrowserRouter>
        );
    }

}
