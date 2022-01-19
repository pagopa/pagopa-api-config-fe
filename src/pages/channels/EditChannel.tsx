import React from "react";
import {Alert, Breadcrumb, Button, Card, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {ChannelDetails} from "../../../generated/api/ChannelDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    backup: any;
    channelName: string;
    code: string;
    channel: ChannelDetails;
    edit: boolean;
}

export default class EditChannel extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/channels";

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            backup: {
                channel: {} as ChannelDetails
            },
            channelName: "",
            code: "",
            channel: {} as ChannelDetails,
            edit: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.saveChannel = this.saveChannel.bind(this);
        this.discard = this.discard.bind(this);
    }

    updateBackup(section: string, data: ChannelDetails | any) {
        // eslint-disable-next-line functional/no-let
        let backup = {...this.state.backup};
        backup = {...backup, [section]: data};
        this.setState({backup});
    }

    getChannel(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
                .then((response: any) => {
                    apiClient.getChannel({
                        Authorization: `Bearer ${response.accessToken}`,
                        ApiKey: "",
                        channelcode: code
                    }).then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({channel: response.right.value});
                            this.setState({channelName: response.right.value.description});
                            this.updateBackup("channel", response.right.value);
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
        this.setState({code, isError: false});
        this.getChannel(code);
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let channel: ChannelDetails = this.state.channel;
        const key = event.target.name as string;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        channel = {...channel, [key]: value};
        this.setState({channel});
    }

    saveChannel() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
                .then((response: any) => {
                    apiClient.updateChannel({
                        Authorization: `Bearer ${response.accessToken}`,
                        ApiKey: "",
                        channelcode: this.state.code,
                        body: this.state.channel
                    }).then((response: any) => {
                        if (response.right.status === 200) {
                            toast.info("Modifica avvenuta con successo.");
                            this.setState({channel: response.right.value});
                            this.setState({channelName: response.right.value.description});
                            this.updateBackup("channel", response.right.value);
                        } else {
                            const message = "detail" in response.right.value ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                            toast.error(message, {theme: "colored"});
                        }
                    }).catch(() => {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    });
                });
    }

    discard(section: string) {
        // "as any" is necessary because it seems to be a bug: https://github.com/Microsoft/TypeScript/issues/13948
        this.setState({[section]: Object.assign({}, this.state.backup[section])} as any);
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        return (
                <div className="container-fluid creditor-institutions">
                    <div className="row">
                        <div className="col-md-12 mb-5">
                            <Breadcrumb>
                                <Breadcrumb.Item href={this.service}>Canali</Breadcrumb.Item>
                                <Breadcrumb.Item active>{this.state.channelName}</Breadcrumb.Item>
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
                                                    <h2>{this.state.channelName}</h2>
                                                </div>
                                            </div>

                                            <Card>
                                                <Card.Header>
                                                    <h5>Anagrafica</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <div className="row">
                                                        <Form.Group controlId="description" className="col-md-4">
                                                            <Form.Label>Descrizione</Form.Label>
                                                            <Form.Control name="description" placeholder=""
                                                                          value={this.state.channel.description}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="channel_code" className="col-md-4">
                                                            <Form.Label>Codice</Form.Label>
                                                            <Form.Control name="channel_code" placeholder=""
                                                                          value={this.state.channel.channel_code}
                                                                          onChange={(e) => this.handleChange(e)} />
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
                                                                          value={this.state.channel.broker_psp_code}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>
                                                        <Form.Group controlId="password" className="col-md-3">
                                                            <Form.Label>Password</Form.Label>
                                                            <Form.Control name="password" placeholder=""
                                                                          value={this.state.channel.password}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>
                                                        <Form.Group controlId="new_password" className="col-md-3">
                                                            <Form.Label>Nuova Password</Form.Label>
                                                            <Form.Control name="new_password" placeholder=""
                                                                          value={this.state.channel.new_password}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>
                                                    </div>
                                                    <div className="row">
                                                        <Form.Group controlId="protocol" className="col-md-2">
                                                            <Form.Label>Protocollo</Form.Label>
                                                            <Form.Control name="protocol" placeholder=""
                                                                          value={this.state.channel.protocol}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="ip" className="col-md-2">
                                                            <Form.Label>IP</Form.Label>
                                                            <Form.Control name="ip" placeholder=""
                                                                          value={this.state.channel.ip}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="port" className="col-md-2">
                                                            <Form.Label>Porta</Form.Label>
                                                            <Form.Control name="port" placeholder=""
                                                                          value={this.state.channel.port}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="service" className="col-md-3">
                                                            <Form.Label>Servizio</Form.Label>
                                                            <Form.Control name="service" placeholder=""
                                                                          value={this.state.channel.service}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>
                                                    </div>
                                                    <div className="row">
                                                        <Form.Group controlId="redirect_protocol" className="col-md-2">
                                                            <Form.Label>Protocollo Redirect</Form.Label>
                                                            <Form.Control name="redirect_protocol" placeholder=""
                                                                          value={this.state.channel.redirect_protocol}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="redirect_ip" className="col-md-2">
                                                            <Form.Label>IP Redirect</Form.Label>
                                                            <Form.Control name="redirect_ip" placeholder=""
                                                                          value={this.state.channel.redirect_ip}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="redirect_port" className="col-md-2">
                                                            <Form.Label>Porta Redirect</Form.Label>
                                                            <Form.Control name="redirect_port" placeholder=""
                                                                          value={this.state.channel.redirect_port}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="redirect_path" className="col-md-3">
                                                            <Form.Label>Servizio Redirect</Form.Label>
                                                            <Form.Control name="redirect_path" placeholder=""
                                                                          value={this.state.channel.redirect_path}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="redirect_query_string" className="col-md-3">
                                                            <Form.Label>Parametri Redirect</Form.Label>
                                                            <Form.Control name="redirect_query_string" placeholder=""
                                                                          value={this.state.channel.redirect_query_string}
                                                                          onChange={(e) => this.handleChange(e)} />
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
                                                                          value={this.state.channel.proxy_host}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="proxy_port" className="col-md-2">
                                                            <Form.Label>Porta Proxy</Form.Label>
                                                            <Form.Control name="proxy_port" placeholder=""
                                                                          value={this.state.channel.proxy_port}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>
                                                    </div>
                                                    <div className="row">
                                                        <Form.Group controlId="payment_model" className="col-md-2">
                                                            <Form.Label>Modello Pagamento</Form.Label>
                                                            <Form.Control name="payment_model" placeholder=""
                                                                          value={this.state.channel.payment_model}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="serv_plugin" className="col-md-2">
                                                            <Form.Label>Plugin WFESP</Form.Label>
                                                            <Form.Control name="serv_plugin" placeholder=""
                                                                          value={this.state.channel.serv_plugin}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="thread_number" className="col-md-2">
                                                            <Form.Label>Numero Thread</Form.Label>
                                                            <Form.Control name="thread_number" placeholder=""
                                                                          value={this.state.channel.thread_number}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="timeout_a" className="col-md-2">
                                                            <Form.Label>Timeout A</Form.Label>
                                                            <Form.Control name="timeout_a" placeholder=""
                                                                          value={this.state.channel.timeout_a}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="timeout_b" className="col-md-2">
                                                            <Form.Label>Timeout B</Form.Label>
                                                            <Form.Control name="timeout_b" placeholder=""
                                                                          value={this.state.channel.timeout_b}
                                                                          onChange={(e) => this.handleChange(e)} />
                                                        </Form.Group>

                                                        <Form.Group controlId="timeout_c" className="col-md-2">
                                                            <Form.Label>Timeout C</Form.Label>
                                                            <Form.Control name="timeout_c" placeholder=""
                                                                          value={this.state.channel.timeout_c}
                                                                          onChange={(e) => this.handleChange(e)} />
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
                                                                    onChange={(e) => this.handleChange(e)}
                                                            />
                                                        </Form.Group>
                                                    </div>
                                                </Card.Body>
                                                <Card.Footer>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            <Button className="ml-2 float-md-right" variant="secondary"
                                                                    onClick={() => {
                                                                        this.discard("channel");
                                                                    }}>Annulla</Button>
                                                            <Button className="float-md-right" onClick={() => {
                                                                this.saveChannel();
                                                            }}>Salva</Button>
                                                        </div>
                                                    </div>
                                                </Card.Footer>
                                            </Card>
                                        </>
                                )
                            }
                        </div>
                    </div>
                </div>
        );
    }
}
