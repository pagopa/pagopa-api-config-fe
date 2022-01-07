import React from "react";
import {Alert, Breadcrumb, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
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
    code: string;
    channel: ChannelDetails;
    edit: boolean;
}

export default class Channel extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
            channel: {} as ChannelDetails,
            edit: false
        };
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
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({channel: response.right.value});
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
        this.getChannel(code);
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        return (
            <div className="container-fluid channel">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/channels">Canali</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.channel.description}</Breadcrumb.Item>
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
                                            <h2>{this.state.channel.description}</h2>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <Form.Group controlId="code" className="col-md-4">
                                            <Form.Label>Codice</Form.Label>
                                            <Form.Control type="code" placeholder="-" value={this.state.channel.channel_code} readOnly/>
                                        </Form.Group>
                                        <Form.Group controlId="enabled" className="col-md-2">
                                            <Form.Label>Stato</Form.Label>
                                            <Form.Control as="select" type="enabled" placeholder="stato" readOnly>
                                                {this.state.channel.enabled && <option>Abilitato</option>}
                                                {!this.state.channel.enabled && <option>Non Abilitato</option>}
                                            </Form.Control>
                                        </Form.Group>
                                        <Form.Group controlId="broker_psp_code" className="col-md-3">
                                            <Form.Label>Codice Intermediario PSP</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.broker_psp_code} readOnly/>
                                        </Form.Group>
                                        <Form.Group controlId="password" className="col-md-3">
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.password} readOnly/>
                                        </Form.Group>
                                    </div>
                                    <div className="row">
                                        <Form.Group controlId="protocol" className="col-md-2">
                                            <Form.Label>Protocollo</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.protocol} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="ip" className="col-md-2">
                                            <Form.Label>IP</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.ip} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="port" className="col-md-2">
                                            <Form.Label>Porta</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.port} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="service" className="col-md-3">
                                            <Form.Label>Servizio</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.service} readOnly/>
                                        </Form.Group>
                                    </div>

                                    <div className="row">
                                        <Form.Group controlId="redirect_protocol" className="col-md-2">
                                            <Form.Label>Protocollo Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.redirect_protocol} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_ip" className="col-md-2">
                                            <Form.Label>IP Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.redirect_ip} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_port" className="col-md-2">
                                            <Form.Label>Porta Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.redirect_port} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_path" className="col-md-3">
                                            <Form.Label>Servizio Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.redirect_path} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_query_string" className="col-md-3">
                                            <Form.Label>Parametri Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.redirect_query_string} readOnly/>
                                        </Form.Group>
                                    </div>

                                    <div className="row">
                                        <Form.Group controlId="proxy_enabled" className="col-md-2">
                                            <Form.Label>Proxy</Form.Label>
                                            <Form.Control as="select" placeholder="stato" readOnly>
                                                {this.state.channel.proxy_enabled && <option>Abilitato</option>}
                                                {!this.state.channel.proxy_enabled && <option>Non Abilitato</option>}
                                            </Form.Control>
                                        </Form.Group>

                                        <Form.Group controlId="proxy_host" className="col-md-2">
                                            <Form.Label>Indirizzo Proxy</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.proxy_host} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="proxy_port" className="col-md-2">
                                            <Form.Label>Porta Proxy</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.proxy_port} readOnly/>
                                        </Form.Group>
                                    </div>

                                    <div className="row">
                                        <Form.Group controlId="payment_model" className="col-md-2">
                                            <Form.Label>Modello Pagamento</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.payment_model} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="serv_plugin" className="col-md-2">
                                            <Form.Label>Plugin WFESP</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.serv_plugin} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="thread_number" className="col-md-2">
                                            <Form.Label>Numero Thread</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.thread_number} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="timeout_a" className="col-md-2">
                                            <Form.Label>Timeout A</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.timeout_a} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="timeout_b" className="col-md-2">
                                            <Form.Label>Timeout B</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.timeout_b} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="timeout_c" className="col-md-2">
                                            <Form.Label>Timeout C</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.timeout_c} readOnly/>
                                        </Form.Group>

                                    </div>

                                    <div className="row">

                                        <Form.Group controlId="flag_io" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                    custom
                                                    disabled
                                                    defaultChecked={this.state.channel.flag_io === true}
                                                    type={'checkbox'}
                                                    id={'flag_io'}
                                                    label={'PSP Notify Payment'}
                                            />
                                        </Form.Group>

                                        <Form.Group controlId="rt_push" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                    custom
                                                    disabled
                                                    defaultChecked={this.state.channel.rt_push === true}
                                                    type={'checkbox'}
                                                    id={'rt_push'}
                                                    label={'Push Ricevuta Telematica'}
                                            />
                                        </Form.Group>

                                        <Form.Group controlId="on_us" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                    custom
                                                    disabled
                                                    defaultChecked={this.state.channel.on_us === true}
                                                    type={'checkbox'}
                                                    id={'on_us'}
                                                    label={'On Us'}
                                            />
                                        </Form.Group>

                                        <Form.Group controlId="card_chart" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                    custom
                                                    disabled
                                                    defaultChecked={this.state.channel.card_chart === true}
                                                    type={'checkbox'}
                                                    id={'card_chart'}
                                                    label={'Carrello RPT'}
                                            />
                                        </Form.Group>

                                        <Form.Group controlId="recovery" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                    custom
                                                    disabled
                                                    defaultChecked={this.state.channel.recovery === true}
                                                    type={'checkbox'}
                                                    id={'recovery'}
                                                    label={'Processo di Recovery Pull'}
                                            />
                                        </Form.Group>

                                        <Form.Group controlId="digital_stamp_brand" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                    custom
                                                    disabled
                                                    defaultChecked={this.state.channel.digital_stamp_brand === true}
                                                    type={'checkbox'}
                                                    id={'digital_stamp_brand'}
                                                    label={'Marca Bollo Digitale'}
                                            />
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
