import React from "react";
import {Breadcrumb, Button, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import {ChannelDetails} from "../../../generated/api/ChannelDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };
}

interface IState {
    channel: ChannelDetails;
    showModal: boolean;
}

export default class CreateChannel extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/channels";

    constructor(props: IProps) {
        super(props);

        this.state = {
            channel: {
                channel_code: "",
                enabled: false,
                description: "",
                password: "",
                protocol: "HTTPS",
                ip: "",
                port: 0,
                service: "",
                broker_psp_code: "",
                proxy_enabled: false,
                proxy_host: "",
                proxy_port: 0,
                thread_number: 0,
                timeout_a: 15,
                timeout_b: 30,
                timeout_c: 120,
                new_fault_code: false,
                redirect_protocol: "HTTPS",
                payment_model: "",
                rt_push: false,
                on_us: false,
                card_chart: false,
                recovery: false,
                digital_stamp_brand: false,
                flag_io: false,
                serv_plugin: "",
                agid: false
            } as unknown as ChannelDetails,
            showModal: false
        };

        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let channel: ChannelDetails = this.state.channel;
        const key = event.target.name as string;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        channel = {...channel, [key]: value};
        this.setState({channel});
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
                apiClient.createChannel({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    body: this.state.channel
                }).then((response: any) => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (response.hasOwnProperty("right")) {
                        if (response.right.status === 201) {
                            // eslint-disable-next-line no-console
                            toast.info("Creazione avvenuta con successo.");
                            setTimeout(this.goBack.bind(this), 2000);
                        } else {
                            const message = "detail" in response.right.value ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                            toast.error(message, {theme: "colored"});
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
                            <Breadcrumb.Item href={this.service}>Canali</Breadcrumb.Item>
                            <Breadcrumb.Item active>Crea Canale</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-12">
                                <h2>Nuovo Canale</h2>
                            </div>
                        </div>
                        <div className="row">
                            <Form.Group controlId="description" className="col-md-4">
                                <Form.Label>Descrizione</Form.Label>
                                <Form.Control name="description" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="channel_code" className="col-md-4">
                                <Form.Label>Codice</Form.Label>
                                <Form.Control name="channel_code" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="enabled" className="col-md-2">
                                <Form.Label>Stato</Form.Label>
                                <Form.Control as="select" name="enabled" onChange={(e) => this.handleChange(e)}
                                              defaultValue={String(this.state.channel.enabled)}>
                                    <option value="true">Abilitato</option>
                                    <option value="false">Non Abilitato</option>
                                </Form.Control>
                            </Form.Group>
                            <Form.Group controlId="broker_psp_code" className="col-md-3">
                                <Form.Label>Codice Intermediario PSP</Form.Label>
                                <Form.Control name="broker_psp_code" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                            <Form.Group controlId="password" className="col-md-3">
                                <Form.Label>Password</Form.Label>
                                <Form.Control name="password" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                        </div>
                        <div className="row">
                            <Form.Group controlId="protocol" className="col-md-2">
                                <Form.Label>Protocollo</Form.Label>
                                <Form.Control as="select" name="protocol"
                                              defaultValue={String(this.state.channel.protocol)}
                                              onChange={(e) => this.handleChange(e)}>
                                    <option value="HTTPS">HTTPS</option>
                                    <option value="HTTP">HTTP</option>
                                </Form.Control>
                            </Form.Group>

                            <Form.Group controlId="ip" className="col-md-2">
                                <Form.Label>IP</Form.Label>
                                <Form.Control name="ip" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="port" className="col-md-2">
                                <Form.Label>Porta</Form.Label>
                                <Form.Control name="port" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="service" className="col-md-3">
                                <Form.Label>Servizio</Form.Label>
                                <Form.Control name="service" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                        </div>
                        <div className="row">
                            <Form.Group controlId="redirect_protocol" className="col-md-2">
                                <Form.Label>Protocollo Redirect</Form.Label>
                                <Form.Control as="select" name="redirect_protocol"
                                              defaultValue={String(this.state.channel.redirect_protocol)}
                                              onChange={(e) => this.handleChange(e)}>
                                    <option value="HTTPS">HTTPS</option>
                                    <option value="HTTP">HTTP</option>
                                </Form.Control>
                            </Form.Group>

                            <Form.Group controlId="redirect_ip" className="col-md-2">
                                <Form.Label>IP Redirect</Form.Label>
                                <Form.Control name="redirect_ip" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="redirect_port" className="col-md-2">
                                <Form.Label>Porta Redirect</Form.Label>
                                <Form.Control name="redirect_port" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="redirect_path" className="col-md-3">
                                <Form.Label>Servizio Redirect</Form.Label>
                                <Form.Control name="redirect_path" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="redirect_query_string" className="col-md-3">
                                <Form.Label>Parametri Redirect</Form.Label>
                                <Form.Control name="redirect_query_string" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                        </div>
                        <div className="row">
                            <Form.Group controlId="proxy_enabled" className="col-md-2">
                                <Form.Label>Proxy</Form.Label>
                                <Form.Control as="select" onChange={(e) => this.handleChange(e)}
                                              name="proxy_enabled"
                                              defaultValue={String(this.state.channel.proxy_enabled)}>
                                    <option value="true">Abilitato</option>
                                    <option value="false">Non Abilitato</option>
                                </Form.Control>
                            </Form.Group>

                            <Form.Group controlId="proxy_host" className="col-md-2">
                                <Form.Label>Indirizzo Proxy</Form.Label>
                                <Form.Control name="proxy_host" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="proxy_port" className="col-md-2">
                                <Form.Label>Porta Proxy</Form.Label>
                                <Form.Control name="proxy_port" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                        </div>
                        <div className="row">
                            <Form.Group controlId="payment_model" className="col-md-2">
                                <Form.Label>Modello Pagamento</Form.Label>
                                <Form.Control name="payment_model" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="serv_plugin" className="col-md-2">
                                <Form.Label>Plugin WFESP</Form.Label>
                                <Form.Control name="serv_plugin" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="thread_number" className="col-md-2">
                                <Form.Label>Numero Thread</Form.Label>
                                <Form.Control name="thread_number" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="timeout_a" className="col-md-2">
                                <Form.Label>Timeout A</Form.Label>
                                <Form.Control name="timeout_a" placeholder=""
                                              value={String(this.state.channel.timeout_a)}
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="timeout_b" className="col-md-2">
                                <Form.Label>Timeout B</Form.Label>
                                <Form.Control name="timeout_b" placeholder=""
                                              value={String(this.state.channel.timeout_b)}
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="timeout_c" className="col-md-2">
                                <Form.Label>Timeout C</Form.Label>
                                <Form.Control name="timeout_c" placeholder=""
                                              value={String(this.state.channel.timeout_c)}
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                        </div>
                        <div className="row">
                            <Form.Group controlId="flag_io" className="col-md-2 custom-control-box">
                                <Form.Check
                                    custom
                                    name="flag_io"
                                    defaultChecked={this.state.channel.flag_io === true}
                                    type={'checkbox'}
                                    id={'flag_io'}
                                    value={'true'}
                                    label={'PSP Notify Payment'}
                                    onChange={(e) => this.handleChange(e)}
                                />
                            </Form.Group>

                            <Form.Group controlId="rt_push" className="col-md-2 custom-control-box">
                                <Form.Check
                                    custom
                                    defaultChecked={this.state.channel.rt_push === true}
                                    type={'checkbox'}
                                    id={'rt_push'}
                                    label={'Push Ricevuta Telematica'}
                                    name="rt_push"
                                    value={'true'}
                                    onChange={(e) => this.handleChange(e)}
                                />
                            </Form.Group>

                            <Form.Group controlId="on_us" className="col-md-2 custom-control-box">
                                <Form.Check
                                    custom
                                    defaultChecked={this.state.channel.on_us === true}
                                    type={'checkbox'}
                                    id={'on_us'}
                                    label={'On Us'}
                                    name="on_us"
                                    value={'true'}
                                    onChange={(e) => this.handleChange(e)}
                                />
                            </Form.Group>

                            <Form.Group controlId="card_chart" className="col-md-2 custom-control-box">
                                <Form.Check
                                    custom
                                    defaultChecked={this.state.channel.card_chart === true}
                                    type={'checkbox'}
                                    id={'card_chart'}
                                    label={'Carrello RPT'}
                                    name="card_chart"
                                    value={'true'}
                                    onChange={(e) => this.handleChange(e)}
                                />
                            </Form.Group>

                            <Form.Group controlId="recovery" className="col-md-2 custom-control-box">
                                <Form.Check
                                    custom
                                    defaultChecked={this.state.channel.recovery === true}
                                    type={'checkbox'}
                                    id={'recovery'}
                                    label={'Processo di Recovery Pull'}
                                    name="recovery"
                                    value={'true'}
                                    onChange={(e) => this.handleChange(e)}
                                />
                            </Form.Group>

                            <Form.Group controlId="digital_stamp_brand" className="col-md-2 custom-control-box">
                                <Form.Check
                                    custom
                                    defaultChecked={this.state.channel.digital_stamp_brand === true}
                                    type={'checkbox'}
                                    id={'digital_stamp_brand'}
                                    label={'Marca Bollo Digitale'}
                                    name="digital_stamp_brand"
                                    value={'true'}
                                    onChange={(e) => this.handleChange(e)}
                                />
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
