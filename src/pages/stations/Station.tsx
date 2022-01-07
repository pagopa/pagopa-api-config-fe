import React from "react";
import {Alert, Breadcrumb, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {StationDetails} from "../../../generated/api/StationDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    code: string;
    station: StationDetails;
    edit: boolean;
}

export default class Station extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
            station: {} as StationDetails,
            edit: false
        };
    }

    getStation(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getStation({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    stationcode: code
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({station: response.right.value});
                        } else {
                            this.setState({isError: true});
                        }
                    })
                    .catch(() => {
                        this.setState({isError: true});
                    })
                    .finally(() => this.setState({isLoading: false}));
            });
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({isError: false});
        this.getStation(code);
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        return (
            <div className="container-fluid station">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/payment-service-providers">Stazioni</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.station.station_code}</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                    <div className="col-md-12">
                        {isError && (
                            <Alert className={'col-md-12'} variant={'danger'}>
                                Informazioni non disponibili!
                            </Alert>
                        )}
                        {isLoading && (<div className="text-center"><FaSpinner className="spinner" size={28}/></div>)}
                        {
                            !isLoading && (
                                <>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <h2>{this.state.station.station_code}</h2>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <Form.Group controlId="enabled" className="col-md-2">
                                            <Form.Label>Stato</Form.Label>
                                            <Form.Control as="select" placeholder="stato" readOnly>
                                                {this.state.station.enabled && <option>Abilitato</option>}
                                                {!this.state.station.enabled && <option>Non Abilitato</option>}
                                            </Form.Control>
                                        </Form.Group>

                                        <Form.Group controlId="version" className="col-md-2">
                                            <Form.Label>Versione</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.version} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="broker_code" className="col-md-3">
                                            <Form.Label>Codice Intermediario</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.broker_code} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="password" className="col-md-2">
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.password} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="new_password" className="col-md-2">
                                            <Form.Label>Nuova Password</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.password} readOnly/>
                                        </Form.Group>
                                    </div>

                                    <div className="row">
                                        <Form.Group controlId="protocol" className="col-md-2">
                                            <Form.Label>Protocollo</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.protocol} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="ip" className="col-md-2">
                                            <Form.Label>IP</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.ip} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="port" className="col-md-2">
                                            <Form.Label>Porta</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.port} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="service" className="col-md-3">
                                            <Form.Label>Servizio</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.service} readOnly/>
                                        </Form.Group>
                                    </div>

                                    <div className="row">
                                        <Form.Group controlId="protocol_4mod" className="col-md-2">
                                            <Form.Label>Protocollo Modello 4</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.protocol_4mod} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="ip_4mod" className="col-md-2">
                                            <Form.Label>IP Modello 4</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.ip_4mod} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="port_4mod" className="col-md-2">
                                            <Form.Label>Porta Modello 4</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.port_4mod} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="service_4mod" className="col-md-3">
                                            <Form.Label>Servizio Modello 4</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.service_4mod} readOnly/>
                                        </Form.Group>
                                    </div>

                                    <div className="row">
                                        <Form.Group controlId="redirect_protocol" className="col-md-2">
                                            <Form.Label>Protocollo Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.redirect_protocol} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_ip" className="col-md-2">
                                            <Form.Label>IP Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.redirect_ip} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_port" className="col-md-2">
                                            <Form.Label>Porta Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.redirect_port} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_path" className="col-md-3">
                                            <Form.Label>Servizio Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.redirect_path} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_query_string" className="col-md-3">
                                            <Form.Label>Parametri Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.redirect_query_string} readOnly/>
                                        </Form.Group>
                                    </div>

                                    <div className="row">
                                        <Form.Group controlId="proxy_enabled" className="col-md-2">
                                            <Form.Label>Proxy</Form.Label>
                                            <Form.Control as="select" placeholder="stato" readOnly>
                                                {this.state.station.proxy_enabled && <option>Abilitato</option>}
                                                {!this.state.station.proxy_enabled && <option>Non Abilitato</option>}
                                            </Form.Control>
                                        </Form.Group>

                                        <Form.Group controlId="proxy_host" className="col-md-2">
                                            <Form.Label>Indirizzo Proxy</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.proxy_host} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="proxy_port" className="col-md-2">
                                            <Form.Label>Porta Proxy</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.proxy_port} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="proxy_username" className="col-md-3">
                                            <Form.Label>Username Proxy</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.proxy_username} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="proxy_password" className="col-md-3">
                                            <Form.Label>Password Proxy</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.proxy_password} readOnly/>
                                        </Form.Group>
                                    </div>

                                    <div className="row">

                                        <Form.Group controlId="flag_online" className="col-md-2">
                                            <Form.Label>Flag Online</Form.Label>
                                            <Form.Control as="select" placeholder="stato" readOnly>
                                                {this.state.station.flag_online && <option>Abilitato</option>}
                                                {!this.state.station.flag_online && <option>Non Abilitato</option>}
                                            </Form.Control>
                                        </Form.Group>

                                        <Form.Group controlId="thread_number" className="col-md-2">
                                            <Form.Label>Numero Thread</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.thread_number} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="timeout_a" className="col-md-2">
                                            <Form.Label>Timeout A</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.timeout_a} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="timeout_b" className="col-md-2">
                                            <Form.Label>Timeout B</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.timeout_b} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="timeout_c" className="col-md-2">
                                            <Form.Label>Timeout C</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.timeout_c} readOnly/>
                                        </Form.Group>

                                    </div>

                                </>
                            )
                        }
                    </div>
                </div>
            </div>
        );
    }
}
