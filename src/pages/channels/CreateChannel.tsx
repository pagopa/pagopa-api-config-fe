import React from "react";
import {Breadcrumb, Button, Card, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import debounce from "lodash.debounce";
import AsyncSelect from "react-select/async";
import {FaInfoCircle} from "react-icons/fa";
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
                password: "",
                protocol: "HTTPS",
                ip: "",
                port: 443,
                service: "",
                broker_psp_code: "",
                proxy_enabled: false,
                proxy_host: "",
                proxy_port: 0,
                target_host: "",
                target_port: 443,
                target_path: "",
                thread_number: 1,
                timeout_a: 15,
                timeout_b: 30,
                timeout_c: 120,
                new_fault_code: false,
                redirect_protocol: "HTTPS",
                payment_model: "IMMEDIATE",
                rt_push: false,
                on_us: false,
                card_chart: false,
                recovery: false,
                digital_stamp_brand: false,
                flag_io: false,
                serv_plugin: null,
                agid: false
            } as unknown as ChannelDetails,
            showModal: false
        };

        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.debouncedBrokerPspOptions = this.debouncedBrokerPspOptions.bind(this);
        this.promiseWfespOptions = this.promiseWfespOptions.bind(this);
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let channel: ChannelDetails = this.state.channel;
        const key = event.target.name as string;
        // eslint-disable-next-line functional/no-let
        let value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        if (value === 'null') {
            value = null;
        }
        channel = {...channel, [key]: value};
        this.setState({channel});
    }

    handleBrokerPspChange(event: any) {
        const channel: ChannelDetails = this.state.channel;
        // eslint-disable-next-line functional/immutable-data
        channel.broker_psp_code = event.value;
        this.setState({channel});
    }

    handleWfespChange(event: any) {
        const channel: ChannelDetails = this.state.channel;
        // eslint-disable-next-line functional/no-let
        let value = event.value;
        if (value === 'null') {
            value = null;
        }
        // eslint-disable-next-line functional/immutable-data
        channel.serv_plugin = value;
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

    isNotValidPort(port: number) {
        return port ? port < 1 || port > 65535 : port;
    }

    isNotValidTimeout(no: number) {
        return no < 0;
    }

    isNotValidThread(no: number) {
        return no < 1;
    }

    validData() {
        if (this.isNotValidPort(this.state.channel.port) || this.isNotValidPort(this.state.channel.proxy_port as number)
            || this.isNotValidPort(this.state.channel.redirect_port as number)) {
            this.toastError("La porta deve avere un valore compreso tra 1 e 65535.");
            return false;
        }

        if (this.isNotValidThread(this.state.channel.thread_number)) {
            this.toastError("Il numero di thread deve essere un valore maggiore di 0.");
            return false;
        }

        if (this.isNotValidTimeout(this.state.channel.timeout_a)
            || this.isNotValidTimeout(this.state.channel.timeout_b) || this.isNotValidTimeout(this.state.channel.timeout_c)) {
            this.toastError("I timeout devono avere un valore maggiore o uguale a 0.");
            return false;
        }
        return true;
    }

    save(): void {
        if (!this.validData()) {
            return;
        }

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
                            this.toastError(message);
                        }
                    } else {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });
            });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    promiseWfespOptions(inputValue: string, callback: any) {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getWfespPlugins({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const items: Array<any> = [];
                        // eslint-disable-next-line functional/immutable-data
                        items.push({
                            value: 'null',
                            label: '-',
                        });
                        resp.right.value.wfesp_plugin_confs.map((plugin: any) => {
                            // eslint-disable-next-line functional/immutable-data
                            items.push({
                                value: plugin.id_serv_plugin,
                                label: plugin.id_serv_plugin,
                            });
                        });
                        callback(items);
                    } else {
                        callback([]);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    callback([]);
                });
            });
    }


    debouncedBrokerPspOptions = debounce((inputValue, callback) => {
        this.promiseBrokerPspOptions(inputValue, callback);
    }, 500);

    promiseBrokerPspOptions(inputValue: string, callback: any) {
        const limit = inputValue.length === 0 ? 10 : 99999;
        const code = inputValue.length === 0 ? "" : inputValue;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getBrokersPsp({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page: 0,
                    limit,
                    code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const items: Array<any> = [];
                        resp.right.value.brokers_psp.map((broker_psp: any) => {
                            // eslint-disable-next-line functional/immutable-data
                            items.push({
                                value: broker_psp.broker_psp_code,
                                label: broker_psp.broker_psp_code,
                            });
                        });
                        callback(items);
                    } else {
                        callback([]);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    callback([]);
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
                        <Card>
                            <Card.Header>
                                <h4>Anagrafica</h4>
                            </Card.Header>
                            <Card.Body>
                                <div className="row">

                                    <Form.Group controlId="channel_code" className="col-md-3">
                                        <Form.Label>Codice <span className="text-danger">*</span></Form.Label>
                                        <Form.Control name="channel_code" placeholder=""
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>

                                    <Form.Group controlId="enabled" className="col-md-2">
                                        <Form.Label>Stato <span className="text-danger">*</span></Form.Label>
                                        <Form.Control as="select" name="enabled" onChange={(e) => this.handleChange(e)}
                                                      defaultValue={String(this.state.channel.enabled)}>
                                            <option value="true">Abilitato</option>
                                            <option value="false">Non Abilitato</option>
                                        </Form.Control>
                                    </Form.Group>
                                    <Form.Group controlId="broker_psp_code" className="col-md-3">
                                        <Form.Label>Codice Intermediario PSP <span
                                            className="text-danger">*</span></Form.Label>
                                        <AsyncSelect
                                            cacheOptions defaultOptions
                                            loadOptions={this.debouncedBrokerPspOptions}
                                            placeholder="Cerca codice"
                                            menuPortalTarget={document.body}
                                            styles={{menuPortal: base => ({...base, zIndex: 9999})}}
                                            name="broker_code"
                                            onChange={(e) => this.handleBrokerPspChange(e)}
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="password" className="col-md-2">
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control name="password" placeholder=""
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>
                                </div>

                                <div className={"divider"}></div>
                                <h4>Servizio</h4>
                                <div className="row">
                                    <Form.Group controlId="protocol" className="col-md-2">
                                        <Form.Label>Protocollo <span
                                            className="text-danger">*</span></Form.Label>
                                        <Form.Control as="select" name="protocol"
                                                      defaultValue={String(this.state.channel.protocol)}
                                                      onChange={(e) => this.handleChange(e)}>
                                            <option value="HTTPS">HTTPS</option>
                                            <option value="HTTP">HTTP</option>
                                        </Form.Control>
                                    </Form.Group>

                                    <Form.Group controlId="ip" className="col-md-6">
                                        <Form.Label>IP</Form.Label>
                                        <Form.Control name="ip" placeholder=""

                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>
                                </div>
                                <div className="row">
                                    <Form.Group controlId="port" className="col-md-2">
                                        <Form.Label>Porta <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="number" name="port" placeholder="" min={1} max={65535}
                                                      value={String(this.state.channel.port)}
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>

                                    <Form.Group controlId="service" className="col-md-6">
                                        <Form.Label>Servizio</Form.Label>
                                        <Form.Control name="service" placeholder=""
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>
                                </div>

                                <div className={"divider"}></div>
                                <h4>Target</h4>
                                <p>Configurazione dell&apos;ente creditore aderente alla nuova connettività.</p>
                                <p className="alert alert-info">
                                    <FaInfoCircle /> Impostare la password a <span className="badge badge-light">PLACEHOLDER</span>, disabilitare il proxy se ambiente <span className="font-italic">OnCloud</span> e, viceversa, impostarlo per ambiente <span className="font-italic">OnPrem</span>.
                                </p>
                                <div className="row">
                                    <Form.Group controlId="target_host" className="col-md-5">
                                        <Form.Label>Indirizzo</Form.Label>
                                        <Form.Control name="target_host" onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>

                                    <Form.Group controlId="target_port" className="col-md-2">
                                        <Form.Label>Porta</Form.Label>
                                        <Form.Control name="proxy_port" type="number" min={1} max={65535}
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>

                                    <Form.Group controlId="target_path" className="col-md-5">
                                        <Form.Label>Servizio</Form.Label>
                                        <Form.Control name="target_path" onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>
                                </div>

                                <div className={"divider"}></div>
                                <h4>Redirect</h4>
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

                                    <Form.Group controlId="redirect_ip" className="col-md-6">
                                        <Form.Label>IP Redirect</Form.Label>
                                        <Form.Control name="redirect_ip" placeholder=""

                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>
                                </div>
                                <div className={"row"}>


                                    <Form.Group controlId="redirect_port" className="col-md-2">
                                        <Form.Label>Porta Redirect</Form.Label>
                                        <Form.Control name="redirect_port" placeholder="" type="number" min={1}
                                                      max={65535}
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>

                                    <Form.Group controlId="redirect_path" className="col-md-6">
                                        <Form.Label>Servizio Redirect</Form.Label>
                                        <Form.Control name="redirect_path" placeholder=""
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>

                                    <Form.Group controlId="redirect_query_string" className="col-md-4">
                                        <Form.Label>Parametri Redirect</Form.Label>
                                        <Form.Control name="redirect_query_string" placeholder=""
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>
                                </div>

                                <div className={"divider"}></div>
                                <h4>Proxy</h4>
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
                                        <Form.Control name="proxy_port" placeholder="" type="number" min={1} max={65535}
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>
                                </div>

                                <div className={"divider"}></div>
                                <h4>Altre Informazioni</h4>
                                <div className="row">
                                    <Form.Group controlId="payment_model" className="col-md-2">
                                        <Form.Label>Modello Pagamento <span
                                            className="text-danger">*</span></Form.Label>
                                        <Form.Control as="select" name="payment_model"
                                                      onChange={(e) => this.handleChange(e)}>
                                            <option value={"IMMEDIATE"}>IMMEDIATO</option>
                                            <option value={"IMMEDIATE_MULTIBENEFICIARY"}>IMMEDIATO_MULTIBENEFICIARIO
                                            </option>
                                            <option value={"DEFERRED"}>DIFFERITO</option>
                                            <option value={"ACTIVATED_AT_PSP"}>ATTIVATO_PRESSO_PSP</option>
                                        </Form.Control>
                                    </Form.Group>

                                    <Form.Group controlId="serv_plugin" className="col-md-2">
                                        <Form.Label>Plugin WFESP</Form.Label>
                                        <AsyncSelect
                                            cacheOptions defaultOptions
                                            loadOptions={this.promiseWfespOptions}
                                            placeholder={"-"}
                                            menuPortalTarget={document.body}
                                            styles={{menuPortal: base => ({...base, zIndex: 9999})}}
                                            name="serv_plugin"
                                            isSearchable={false}
                                            onChange={(e) => this.handleWfespChange(e)}
                                        />
                                    </Form.Group>

                                    <Form.Group controlId="thread_number" className="col-md-2">
                                        <Form.Label>Numero Thread <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="number" name="thread_number" placeholder="" min={1}
                                                      value={String(this.state.channel.thread_number)}
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>

                                    <Form.Group controlId="timeout_a" className="col-md-2">
                                        <Form.Label>Timeout A <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="number" name="timeout_a" placeholder="" min={0}
                                                      value={String(this.state.channel.timeout_a)}
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>

                                    <Form.Group controlId="timeout_b" className="col-md-2">
                                        <Form.Label>Timeout B <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="number" name="timeout_b" placeholder="" min={0}
                                                      value={String(this.state.channel.timeout_b)}
                                                      onChange={(e) => this.handleChange(e)}/>
                                    </Form.Group>

                                    <Form.Group controlId="timeout_c" className="col-md-2">
                                        <Form.Label>Timeout C <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="number" name="timeout_c" placeholder="" min={0}
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
                            </Card.Body>
                        </Card>

                        <div className="row justify-content-end m-3">
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
