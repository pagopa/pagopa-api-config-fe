import React from "react";
import {Alert, Breadcrumb, Card, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaCloudDownloadAlt, FaEye, FaInfoCircle, FaSpinner, FaTimes} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import axios, {AxiosRequestConfig} from "axios";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {ChannelDetails, Payment_modelEnum} from "../../../generated/api/ChannelDetails";
import {PaymentType} from "../../../generated/api/PaymentType";
import {getConfig} from "../../util/config";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    code: string;
    channel: ChannelDetails;
    paymentTypeList: [];
    paymentTypeLegend: any;
    pspList: any;
    edit: boolean;
}

export default class Channel extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private pspService: string = '/payment-service-providers';

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
            channel: {
                channel_code: "",
                enabled: false,
                broker_psp_code: "",
                password: "",
                new_password: "",
                protocol: "",
                ip: "",
                port: 80,
                service: "",
                proxy_enabled: false,
                proxy_host: "",
                proxy_port: 80,
                thread_number: 2,
                timeout_a: 15,
                timeout_b: 30,
                timeout_c: 120,
                new_fault_code: false,
                redirect_protocol: "",
                redirect_ip: "",
                redirect_port: 80,
                redirect_path: "",
                redirect_query_string: "",
                payment_model: Payment_modelEnum.IMMEDIATE,
                rt_push: false,
                on_us: false,
                card_chart: false,
                recovery: false,
                digital_stamp_brand: false,
                serv_plugin: "",
                flag_io: false,
                agid: false,
                description: "",
            } as any,
            paymentTypeList: [],
            paymentTypeLegend: {},
            pspList: [],
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
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    channelcode: code
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            const channel = {...this.state.channel, ...response.right.value};
                            this.setState({channel});
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

    getPaymentTypeList(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getChannelPaymentTypes({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    channelcode: code
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({paymentTypeList: response.right.value.payment_types});
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

    getPaymentTypeLegend(): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getPaymentTypes({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: ""
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            const paymentTypeLegend = {} as any;
                            response.right.value.payment_types.forEach((pt: PaymentType) => {
                                // eslint-disable-next-line functional/immutable-data
                                paymentTypeLegend[pt.payment_type] = pt.description;
                            });
                            this.setState({paymentTypeLegend});
                        }
                    })
                    .catch(() => {
                        this.setState({isError: true});
                    });
            });
    }

    getPspList(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getChannelPaymentServiceProviders({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    channelcode: code
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({pspList: response.right.value.payment_service_providers});
                        } else if (response.right.status === 404) {
                            this.setState({pspList: []});
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

    handleEdit() {
        this.props.history.push("/channels/" + String(this.props.match.params.code) + "?edit");
    }


    handlePspDetails(code: string) {
        this.props.history.push(this.pspService + "/" + code);
    }

    downloadCsv() {
        const baseUrl = getConfig("APICONFIG_HOST") as string;
        const basePath = getConfig("APICONFIG_BASEPATH") as string;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        }).then((response: any) => {
            const config = {
                headers: {
                    Authorization: `Bearer ${response.idToken}`
                },
                responseType: 'blob'
            } as AxiosRequestConfig;
            const anchor = document.createElement("a");
            document.body.appendChild(anchor);
            const url = `${String(baseUrl)}${String(basePath)}/channels/${this.state.channel.channel_code}/paymentserviceproviders/csv`;
            axios.get(url, config)
                .then((res: any) => {
                    if (res.data.size > 1) {
                        const objectUrl = window.URL.createObjectURL(res.data);
                        // eslint-disable-next-line functional/immutable-data
                        anchor.href = objectUrl;
                        // eslint-disable-next-line functional/immutable-data
                        anchor.download = this.state.channel.channel_code + '-psp.csv';
                        anchor.click();
                        window.URL.revokeObjectURL(objectUrl);
                    } else {
                        toast.warn("Problemi nella generazione del file CSV richiesto.", {theme: "colored"});
                    }
                })
                .catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });
        });
    }


    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({isError: false});
        this.getChannel(code);
        this.getPaymentTypeList(code);
        this.getPaymentTypeLegend();
        this.getPspList(code);
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        // eslint-disable-next-line sonarjs/no-unused-collection
        const pspList: any = [];
        this.state.pspList.map((item: any, index: number) => {
            const row = (
                <tr key={index}>
                    <td>{item.business_name}</td>
                    <td>{item.psp_code}</td>
                    <td className="text-center">
                        {item.enabled && <FaCheck className="text-success"/>}
                        {!item.enabled && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-center">{item.payment_types.join(" ")}</td>
                    <td className="text-right">
                        {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-details-${index}`}>Visualizza</Tooltip>}>
                            <FaEye role="button" className="mr-3"
                                   onClick={() => this.handlePspDetails(item.psp_code)}/>
                        </OverlayTrigger>
                    </td>
                </tr>
            );
            pspList.push(row);
        });

        // create rows for payment types table
        const paymentTypeList: any = this.state.paymentTypeList.map((item: any, index: number) => (
            <tr key={index}>
                <td>{item}</td>
                <td>
                    {
                        this.state.paymentTypeLegend[item]
                    }
                    {
                        item === "OBEP" && <span className="badge badge-danger ml-2">DEPRECATO</span>
                    }
                </td>
            </tr>
        ));

        const getPaymentTypeContent = () => {
                if (Object.keys(paymentTypeList).length > 0) {
                    return (
                        <Table hover responsive size="sm">
                            <thead>
                            <tr>
                                <th className="">Codice</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {paymentTypeList}
                            </tbody>
                        </Table>
                    );
                } else {
                    return (
                        <Alert className={'col-md-12'} variant={"warning"}>
                            <FaInfoCircle className="mr-1"/>Tipi Versamento non presenti
                        </Alert>
                    );
                }
            }
        ;

        const paymentTypeLegend: any = Object.keys(this.state.paymentTypeLegend).map((item: any, index: number) => (
            <span key={index} className="mr-2 badge badge-secondary">
                    {item}: {this.state.paymentTypeLegend[item]}
                {item === "OBEP" && <span className="badge badge-danger ml-2">DEPRECATO</span>}
                </span>
        ));

        return (
            <div className="container-fluid channel">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/channels">Canali</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.channel.channel_code || "-"}</Breadcrumb.Item>
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
                                        <div className="col-md-10">
                                            <h2>{this.state.channel.channel_code || "-"}</h2>
                                        </div>
                                        <div className="col-md-2 text-right">
                                            <button className={"btn btn-primary"} onClick={() => this.handleEdit()}>Edit
                                            </button>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <Form.Group controlId="code" className="col-md-3">
                                            <Form.Label>Codice</Form.Label>
                                            <Form.Control type="code" placeholder="-"
                                                          value={this.state.channel.channel_code} readOnly/>
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
                                            <Form.Control placeholder="-" value={this.state.channel.broker_psp_code}
                                                          readOnly/>
                                        </Form.Group>
                                        <Form.Group controlId="password" className="col-md-2">
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control placeholder="" value={this.state.channel.password} readOnly/>
                                        </Form.Group>
                                        <Form.Group controlId="new_password" className="col-md-2">
                                            <Form.Label>Nuova Password</Form.Label>
                                            <Form.Control placeholder="" value={this.state.channel.new_password} readOnly/>
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
                                            <Form.Control placeholder="-" value={this.state.channel.redirect_protocol}
                                                          readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_ip" className="col-md-2">
                                            <Form.Label>IP Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.redirect_ip} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_port" className="col-md-2">
                                            <Form.Label>Porta Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.redirect_port}
                                                          readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_path" className="col-md-3">
                                            <Form.Label>Servizio Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.redirect_path}
                                                          readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_query_string" className="col-md-3">
                                            <Form.Label>Parametri Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.redirect_query_string}
                                                          readOnly/>
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
                                            <Form.Control placeholder="-" value={this.state.channel.payment_model}
                                                          readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="serv_plugin" className="col-md-2">
                                            <Form.Label>Plugin WFESP</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.serv_plugin} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="thread_number" className="col-md-2">
                                            <Form.Label>Numero Thread</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.channel.thread_number}
                                                          readOnly/>
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
                                                checked={this.state.channel.flag_io === true}
                                                type={'checkbox'}
                                                id={'flag_io'}
                                                label={'PSP Notify Payment'}
                                            />
                                        </Form.Group>

                                        <Form.Group controlId="rt_push" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                custom
                                                disabled
                                                checked={this.state.channel.rt_push === true}
                                                type={'checkbox'}
                                                id={'rt_push'}
                                                label={'Push Ricevuta Telematica'}
                                            />
                                        </Form.Group>

                                        <Form.Group controlId="on_us" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                custom
                                                disabled
                                                checked={this.state.channel.on_us === true}
                                                type={'checkbox'}
                                                id={'on_us'}
                                                label={'On Us'}
                                            />
                                        </Form.Group>

                                        <Form.Group controlId="card_chart" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                custom
                                                disabled
                                                checked={this.state.channel.card_chart === true}
                                                type={'checkbox'}
                                                id={'card_chart'}
                                                label={'Carrello RPT'}
                                            />
                                        </Form.Group>

                                        <Form.Group controlId="recovery" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                custom
                                                disabled
                                                checked={this.state.channel.recovery === true}
                                                type={'checkbox'}
                                                id={'recovery'}
                                                label={'Processo di Recovery Pull'}
                                            />
                                        </Form.Group>

                                        <Form.Group controlId="digital_stamp_brand" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                custom
                                                disabled
                                                checked={this.state.channel.digital_stamp_brand === true}
                                                type={'checkbox'}
                                                id={'digital_stamp_brand'}
                                                label={'Marca Bollo Digitale'}
                                            />
                                        </Form.Group>
                                    </div>

                                    <div className="row mt-3">
                                        <div className="col-md-12">
                                            <Card>
                                                <Card.Header>
                                                    <h5>Tipo Versamento</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    {getPaymentTypeContent()}
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    </div>
                                </>
                            )
                        }
                    </div>
                </div>
                <div className="row mt-3">
                    <div className="col-md-12">
                        <Card>
                            <Card.Header>
                                <div className={"d-flex justify-content-between align-items-center"}>
                                    <h5>PSP</h5>
                                    {Object.keys(pspList).length > 0 &&
                                        <OverlayTrigger placement="top"
                                                        overlay={<Tooltip
                                                            id="csv-download">Scarica</Tooltip>}>
                                            <FaCloudDownloadAlt role="button" className="mr-3"
                                                                onClick={() => this.downloadCsv()}/>
                                        </OverlayTrigger>
                                    }
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {Object.keys(pspList).length === 0 && (
                                    <Alert className={'col-md-12'} variant={"warning"}><FaInfoCircle
                                        className="mr-1"/>PSP non presenti</Alert>
                                )}
                                {Object.keys(pspList).length > 0 &&
                                    <Table hover responsive size="sm">
                                        <thead>
                                        <tr>
                                            <th className="">Nome</th>
                                            <th className="">Codice</th>
                                            <th className="text-center">Abilitato</th>
                                            <th className="text-center">Tipo Versamento</th>
                                            <th className="text-right"></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {pspList}
                                        </tbody>
                                    </Table>
                                }
                            </Card.Body>
                            <Card.Footer>
                                <div className="legend">
                                    <span className="font-weight-bold mr-2">Legenda:</span>
                                    {paymentTypeLegend}
                                </div>
                            </Card.Footer>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
}
