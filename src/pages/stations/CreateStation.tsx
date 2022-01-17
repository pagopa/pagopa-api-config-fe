import React from "react";
import {Breadcrumb, Button, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import {StationDetails} from "../../../generated/api/StationDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };
}

interface IState {
    station: StationDetails;
    showModal: boolean;
}

export default class CreateStation extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/stations";

    constructor(props: IProps) {
        super(props);

        this.state = {
            station: {
                broker_code: "",
                enabled: false,
                ip: "",
                password: "",
                port: 0,
                protocol: "",
                service: "",
                station_code: "",
                thread_number: 0,
                timeout_a: 0,
                timeout_b: 0,
                timeout_c: 0,
                version: 0,
                flag_online: false,
                ip_4mod: false,
                new_password: "",
                port_4mod: 0,
                protocol_4mod: "",
                proxy_enabled: false,
                proxy_host: "",
                proxy_password: "",
                proxy_port: 0,
                proxy_username: "",
                redirect_ip: "",
                redirect_path: "",
                redirect_port: 0,
                redirect_protocol: "",
                redirect_query_string: "",
                service_4mod: ""
            } as unknown as StationDetails,
            showModal: false
        };

        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let station: StationDetails = this.state.station;
        const key = event.target.name as string;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        station = {...station, [key]: value};
        this.setState({station});
    }

    discard(): void {
        this.setState({showModal: true});
    }

    hideModal(status: string): void {
        if (status === "ok") {
            this.props.history.push(this.service);
        }
        this.setState({showModal: false});
    }

    goBack(): void {
        this.props.history.push(this.service);
    }

    save(): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createStation({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    body: this.state.station
                }).then((response: any) => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (response.hasOwnProperty("right")) {
                        if (response.right.status === 201) {
                            // eslint-disable-next-line no-console
                            toast.info("Creazione avvenuta con successo.");
                            setTimeout(this.goBack.bind(this), 2000);
                        } else {
                            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                        }
                    } else {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });
            });
    }

    render(): React.ReactNode {
        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href={this.service}>Stazioni</Breadcrumb.Item>
                            <Breadcrumb.Item active>Crea Stazione</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-12">
                                <h2>Nuova Stazione</h2>
                            </div>
                        </div>
                        <div className="row">
                            <Form.Group controlId="description" className="col-md-4">
                                <Form.Label>Codice</Form.Label>
                                <Form.Control name="station_code" placeholder=""
                                              onChange={(e) => this.handleChange(e)} />
                            </Form.Group>
                            <Form.Group controlId="enabled" className="col-md-2">
                                <Form.Label>Stato</Form.Label>
                                <Form.Control as="select" name="enabled" placeholder="stato"
                                              onChange={(e) => this.handleChange(e)}
                                              defaultValue={String(this.state.station.enabled)}>
                                    <option value="true">Abilitato</option>
                                    <option value="false">Non Abilitato</option>
                                </Form.Control>
                            </Form.Group>

                            <Form.Group controlId="version" className="col-md-2">
                                <Form.Label>Versione</Form.Label>
                                <Form.Control name="version" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="broker_code" className="col-md-3">
                                <Form.Label>Codice Intermediario</Form.Label>
                                <Form.Control name="broker_code" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="password" className="col-md-2">
                                <Form.Label>Password</Form.Label>
                                <Form.Control name="password" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="new_password" className="col-md-2">
                                <Form.Label>Nuova Password</Form.Label>
                                <Form.Control name="new_password" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>
                        </div>

                        <div className="row">
                            <Form.Group controlId="protocol" className="col-md-2">
                                <Form.Label>Protocollo</Form.Label>
                                <Form.Control name="protocol" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="ip" className="col-md-2">
                                <Form.Label>IP</Form.Label>
                                <Form.Control name="ip" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="port" className="col-md-2">
                                <Form.Label>Porta</Form.Label>
                                <Form.Control name="port" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="service" className="col-md-3">
                                <Form.Label>Servizio</Form.Label>
                                <Form.Control name="service" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>
                        </div>

                        <div className="row">
                            <Form.Group controlId="protocol_4mod" className="col-md-2">
                                <Form.Label>Protocollo Modello 4</Form.Label>
                                <Form.Control name="protocol_4mod" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="ip_4mod" className="col-md-2">
                                <Form.Label>IP Modello 4</Form.Label>
                                <Form.Control name="ip_4mod" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="port_4mod" className="col-md-2">
                                <Form.Label>Porta Modello 4</Form.Label>
                                <Form.Control name="port_4mod" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="service_4mod" className="col-md-3">
                                <Form.Label>Servizio Modello 4</Form.Label>
                                <Form.Control name="service_4mod" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>
                        </div>

                        <div className="row">
                            <Form.Group controlId="redirect_protocol" className="col-md-2">
                                <Form.Label>Protocollo Redirect</Form.Label>
                                <Form.Control name="redirect_protocol" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="redirect_ip" className="col-md-2">
                                <Form.Label>IP Redirect</Form.Label>
                                <Form.Control name="redirect_ip" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="redirect_port" className="col-md-2">
                                <Form.Label>Porta Redirect</Form.Label>
                                <Form.Control name="redirect_port" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="redirect_path" className="col-md-3">
                                <Form.Label>Servizio Redirect</Form.Label>
                                <Form.Control name="redirect_path" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="redirect_query_string" className="col-md-3">
                                <Form.Label>Parametri Redirect</Form.Label>
                                <Form.Control name="redirect_query_string" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>
                        </div>

                        <div className="row">
                            <Form.Group controlId="proxy_enabled" className="col-md-2">
                                <Form.Label>Proxy</Form.Label>
                                <Form.Control as="select" name="proxy_enabled" placeholder="stato"
                                              onChange={(e) => this.handleChange(e)}
                                              defaultValue={String(this.state.station.proxy_enabled)}>
                                    <option value="true">Abilitato</option>
                                    <option value="false">Non Abilitato</option>
                                </Form.Control>
                            </Form.Group>

                            <Form.Group controlId="proxy_host" className="col-md-2">
                                <Form.Label>Indirizzo Proxy</Form.Label>
                                <Form.Control name="proxy_host" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="proxy_port" className="col-md-2">
                                <Form.Label>Porta Proxy</Form.Label>
                                <Form.Control name="proxy_port" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="proxy_username" className="col-md-3">
                                <Form.Label>Username Proxy</Form.Label>
                                <Form.Control name="proxy_username" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="proxy_password" className="col-md-3">
                                <Form.Label>Password Proxy</Form.Label>
                                <Form.Control name="proxy_password" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>
                        </div>

                        <div className="row">

                            <Form.Group controlId="flag_online" className="col-md-2">
                                <Form.Label>Flag Online</Form.Label>
                                <Form.Control as="select" name="flag_online" placeholder="stato"
                                              onChange={(e) => this.handleChange(e)}
                                              defaultValue={String(this.state.station.flag_online)}>
                                    <option value="true">Abilitato</option>
                                    <option value="false">Non Abilitato</option>
                                </Form.Control>
                            </Form.Group>

                            <Form.Group controlId="thread_number" className="col-md-2">
                                <Form.Label>Numero Thread</Form.Label>
                                <Form.Control name="thread_number" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="timeout_a" className="col-md-2">
                                <Form.Label>Timeout A</Form.Label>
                                <Form.Control name="timeout_a" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="timeout_b" className="col-md-2">
                                <Form.Label>Timeout B</Form.Label>
                                <Form.Control name="timeout_b" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                            <Form.Group controlId="timeout_c" className="col-md-2">
                                <Form.Label>Timeout C</Form.Label>
                                <Form.Control name="timeout_c" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>

                        </div>

                        <div className="row justify-content-end">
                            <div className="col-md-3 text-right">
                                <Button onClick={this.save}>Salva</Button>
                                <Button variant="secondary" className="ml-3" onClick={this.discard}>Annulla</Button>
                            </div>
                        </div>

                    </div>
                </div>

                <ConfirmationModal show={this.state.showModal} handleClose={this.hideModal}>
                    <p>Sei sicuro di voler annullare le modifiche?</p>
                </ConfirmationModal>
            </div>
        );
    }
}
