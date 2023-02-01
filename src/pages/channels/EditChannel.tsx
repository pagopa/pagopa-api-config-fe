import React from "react";
import {Alert, Breadcrumb, Button, Card, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaInfoCircle, FaPlus, FaSpinner, FaTrash} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import AsyncSelect from "react-select/async";
import debounce from "lodash.debounce";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {ChannelDetails, Payment_modelEnum} from "../../../generated/api/ChannelDetails";
import ConfirmationModal from "../../components/ConfirmationModal";
import {PspChannelPaymentTypes} from "../../../generated/api/PspChannelPaymentTypes";
import {PaymentType} from "../../../generated/api/PaymentType";

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
    paymentTypeList: Array<string>;
    paymentTypeLegend: any;
    edit: boolean;
    newPaymentType: boolean;
    paymentType: string;
    paymentTypeToDelete: string;
    showDeleteModal: boolean;

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
            channel: {
                channel_code: "",
                enabled: false,
                broker_psp_code: "",
                password: "",
                new_password: "",
                protocol: "HTTPS",
                ip: "",
                port: 80,
                service: "",
                proxy_enabled: false,
                proxy_host: "",
                proxy_port: 80,
                target_host: "",
                target_port: 443,
                target_path: "",
                thread_number: 1,
                timeout_a: 15,
                timeout_b: 30,
                timeout_c: 120,
                primitive_version: 1,
                new_fault_code: false,
                redirect_protocol: "HTTPS",
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
                serv_plugin: null,
                flag_io: false,
                agid: false,
            } as any,
            paymentTypeList: [],
            paymentTypeLegend: {},
            edit: false,
            newPaymentType: false,
            paymentType: "",
            paymentTypeToDelete: "",
            showDeleteModal: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handlePaymentType = this.handlePaymentType.bind(this);
        this.saveChannel = this.saveChannel.bind(this);
        this.discard = this.discard.bind(this);
        this.newPaymentType = this.newPaymentType.bind(this);
        this.debouncedBrokerPspOptions = this.debouncedBrokerPspOptions.bind(this);
        this.promiseWfespOptions = this.promiseWfespOptions.bind(this);
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    updateBackup(section: string, data: ChannelDetails | any) {
        // eslint-disable-next-line functional/no-let
        let backup = {...this.state.backup};
        if (section === "channel") {
            const keys = ["new_password"];
            for (const key of keys) {
                // eslint-disable-next-line no-prototype-builtins
                if (!data.hasOwnProperty(key)) {
                    // eslint-disable-next-line functional/immutable-data
                    data[key] = "";
                }
            }
        }
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
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    channelcode: code
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        const channel = {...this.state.channel, ...response.right.value};
                        this.setState({channel});
                        this.setState({channelName: response.right.value.channel_code});
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

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({code, isError: false});
        this.getChannel(code);
        this.getPaymentTypeList(code);
        this.getPaymentTypeLegend();
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

    handlePaymentType(paymentType: string) {
        this.setState({paymentType});
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

    isNotValidPrimitiveVersion(no: number) {
        return no < 1 || no > 2;
    }

    saveChannel() {
        if (this.isNotValidPort(this.state.channel.port) || this.isNotValidPort(this.state.channel.proxy_port as number)
            || this.isNotValidPort(this.state.channel.redirect_port as number)) {
            this.toastError("La porta deve avere un valore compreso tra 1 e 65535.");
            return;
        }

        if (this.isNotValidThread(this.state.channel.thread_number)) {
            this.toastError("Il numero di thread deve essere un valore maggiore di 0.");
            return;
        }

        if (this.isNotValidTimeout(this.state.channel.timeout_a)
            || this.isNotValidTimeout(this.state.channel.timeout_b) || this.isNotValidTimeout(this.state.channel.timeout_c)) {
            this.toastError("I timeout devono avere un valore maggiore o uguale a 0.");
            return;
        }

        if (this.isNotValidPrimitiveVersion(this.state.channel.primitive_version)) {
            this.toastError("La versione delle primitive deve essere una tra le seguenti: 1 o 2");
            return;
        }

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updateChannel({
                    Authorization: `Bearer ${response.idToken}`,
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
                        this.toastError(message);
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

    handlePaymentTypeDelete(paymentType: string) {
        this.setState({showDeleteModal: true});
        this.setState({paymentTypeToDelete: paymentType});
    }

    hideDeleteModal = (status: string) => {
        if (status === "ok") {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    apiClient.deleteChannelPaymentType({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        channelcode: this.state.code,
                        paymenttypecode: this.state.paymentTypeToDelete
                    })
                        .then((res: any) => {
                            if (res.right.status === 200) {
                                toast.info("Rimozione avvenuta con successo");
                                this.removePaymentType(this.state.paymentTypeToDelete);
                            } else {
                                this.toastError(res.right.value.detail);
                            }
                        })
                        .catch(() => {
                            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                        });
                });
        }
        this.setState({showDeleteModal: false});
    };

    removePaymentType(paymentType: string) {
        this.setState({paymentTypeList: this.state.paymentTypeList.filter((p) => p !== paymentType)});
    }

    newPaymentType() {
        this.setState({newPaymentType: true, paymentType: ""});
    }

    discardPaymentType() {
        this.setState({newPaymentType: false});
    }

    savePaymentType() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                const ptList: Array<string> = [this.state.paymentType];
                const data = {
                    "payment_types": ptList
                } as PspChannelPaymentTypes;
                apiClient.createChannelPaymentType({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    channelcode: this.state.code,
                    body: data
                }).then((response: any) => {
                    if (response.right.status === 201) {
                        toast.info("Modifica avvenuta con successo.");
                        this.setState({paymentTypeList: response.right.value.payment_types});
                    } else {
                        const message = "detail" in response.right.value ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                        toast.error(message, {theme: "colored"});
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                }).finally(() => {
                    this.setState({newPaymentType: false});
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


    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;
        const newPaymentType = this.state.newPaymentType;
        const showDeleteModal = this.state.showDeleteModal;
        const paymentTypeToDelete = this.state.paymentTypeToDelete;

        const paymentTypeLegend: { [index: string]: string } = this.state.paymentTypeLegend;

        // create rows for payment types table
        const paymentTypeList: any = this.state.paymentTypeList.map((item: any, index: number) => (
            <tr key={index}>
                <td>{item}</td>
                <td>
                    {paymentTypeLegend[item]}
                    {
                        item === "OBEP" && <span className="badge badge-danger ml-2">DEPRECATO</span>
                    }
                </td>
                <td className={"text-right"}>
                    <OverlayTrigger placement="top"
                                    overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                        <FaTrash role="button" className="mr-3" onClick={() => this.handlePaymentTypeDelete(item)}/>
                    </OverlayTrigger>
                </td>
            </tr>
        ));

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href={this.service}>Canali</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.channelName || "-"}</Breadcrumb.Item>
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
                                            <h2>{this.state.channelName || "-"}</h2>
                                        </div>
                                    </div>

                                    <Card>
                                        <Card.Header>
                                            <h5>Anagrafica</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="row">
                                                <Form.Group controlId="channel_code" className="col-md-4">
                                                    <Form.Label>Codice <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control name="channel_code" placeholder=""
                                                                  value={this.state.channel.channel_code}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="enabled" className="col-md-2">
                                                    <Form.Label>Stato <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control as="select" name="enabled"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  value={String(this.state.channel.enabled)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>
                                                <Form.Group controlId="primitive_version" className="col-md-2">
                                                    <Form.Label>Versione primitive <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control type={"number"} name="version" min={1} max={2}
                                                                value={this.state.channel.primitive_version}
                                                                onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="broker_psp_code" className="col-md-4">
                                                    <Form.Label>Codice Intermediario PSP <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <AsyncSelect
                                                        cacheOptions defaultOptions
                                                        loadOptions={this.debouncedBrokerPspOptions}
                                                        placeholder="Cerca codice"
                                                        menuPortalTarget={document.body}
                                                        styles={{menuPortal: base => ({...base, zIndex: 9999})}}
                                                        name="broker_code"
                                                        value={{
                                                            label: this.state.channel.broker_psp_code,
                                                            value: this.state.channel.broker_psp_code
                                                        }}
                                                        onChange={(e) => this.handleBrokerPspChange(e)}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId="password" className="col-md-4">
                                                    <Form.Label>Password</Form.Label>
                                                    <Form.Control name="password" placeholder=""
                                                                  value={this.state.channel.password}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="new_password" className="col-md-4">
                                                    <Form.Label>Nuova Password</Form.Label>
                                                    <Form.Control name="new_password" placeholder=""
                                                                  value={this.state.channel.new_password}
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

                                                                  value={this.state.channel.ip}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="port" className="col-md-2">
                                                    <Form.Label>Porta <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control name="port" type="number" placeholder="" min={1}
                                                                  max={65535}
                                                                  value={this.state.channel.port}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="service" className="col-md-6">
                                                    <Form.Label>Servizio</Form.Label>
                                                    <Form.Control name="service" placeholder=""
                                                                  value={this.state.channel.service}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>

                                            <div className={"divider"}></div>
                                            <h4>Target</h4>
                                            <p>Configurazione del psp aderente alla nuova connettività.</p>
                                            <p className="alert alert-info">
                                                <FaInfoCircle /> Impostare la password a <span className="badge badge-light">PLACEHOLDER</span>, disabilitare il proxy se ambiente <span className="font-italic">OnCloud</span> e, viceversa, impostarlo per ambiente <span className="font-italic">OnPrem</span>.
                                            </p>
                                            <div className="row">
                                                <Form.Group controlId="target_host" className="col-md-5">
                                                    <Form.Label>Indirizzo</Form.Label>
                                                    <Form.Control name="target_host"
                                                                  value={this.state.channel.target_host}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="target_port" className="col-md-2">
                                                    <Form.Label>Porta</Form.Label>
                                                    <Form.Control name="target_port" type="number" min={1} max={65535}
                                                                  value={this.state.channel.target_port}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="target_path" className="col-md-5">
                                                    <Form.Label>Servizio</Form.Label>
                                                    <Form.Control name="target_path"
                                                                  value={this.state.channel.target_path}
                                                                  onChange={(e) => this.handleChange(e)}/>
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

                                                                  value={this.state.channel.redirect_ip}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>
                                            <div className={"row"}>


                                                <Form.Group controlId="redirect_port" className="col-md-2">
                                                    <Form.Label>Porta Redirect</Form.Label>
                                                    <Form.Control name="redirect_port" placeholder="" type="number"
                                                                  value={this.state.channel.redirect_port} min={1}
                                                                  max={65535}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="redirect_path" className="col-md-6">
                                                    <Form.Label>Servizio Redirect</Form.Label>
                                                    <Form.Control name="redirect_path" placeholder=""
                                                                  value={this.state.channel.redirect_path}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="redirect_query_string" className="col-md-4">
                                                    <Form.Label>Parametri Redirect</Form.Label>
                                                    <Form.Control name="redirect_query_string" placeholder=""
                                                                  value={this.state.channel.redirect_query_string}
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
                                                                  value={String(this.state.channel.proxy_enabled)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>

                                                <Form.Group controlId="proxy_host" className="col-md-2">
                                                    <Form.Label>Indirizzo Proxy</Form.Label>
                                                    <Form.Control name="proxy_host" placeholder=""
                                                                  value={this.state.channel.proxy_host}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="proxy_port" className="col-md-2">
                                                    <Form.Label>Porta Proxy</Form.Label>
                                                    <Form.Control name="proxy_port" placeholder="" type="number"
                                                                  value={this.state.channel.proxy_port} min={1} max={65535}
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
                                                                  value={this.state.channel.payment_model}
                                                                  onChange={(e) => this.handleChange(e)}>
                                                        <option value={"IMMEDIATE"}>IMMEDIATO</option>
                                                        <option
                                                            value={"IMMEDIATE_MULTIBENEFICIARY"}>IMMEDIATO_MULTIBENEFICIARIO
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
                                                        value={{
                                                            label: this.state.channel.serv_plugin,
                                                            value: this.state.channel.serv_plugin
                                                        }}
                                                        isSearchable={false}
                                                        onChange={(e) => this.handleWfespChange(e)}
                                                    />
                                                </Form.Group>

                                                <Form.Group controlId="thread_number" className="col-md-2">
                                                    <Form.Label>Numero Thread <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="thread_number" placeholder="" min={1}
                                                                  value={this.state.channel.thread_number}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="timeout_a" className="col-md-2">
                                                    <Form.Label>Timeout A <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="timeout_a" placeholder="" min={0}
                                                                  value={this.state.channel.timeout_a}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="timeout_b" className="col-md-2">
                                                    <Form.Label>Timeout B <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="timeout_b" placeholder="" min={0}
                                                                  value={this.state.channel.timeout_b}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="timeout_c" className="col-md-2">
                                                    <Form.Label>Timeout C <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="timeout_c" placeholder="" min={0}
                                                                  value={this.state.channel.timeout_c}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="flag_io" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        name="flag_io"
                                                        checked={this.state.channel.flag_io === true}
                                                        type={'checkbox'}
                                                        id={'flag_io'}
                                                        label={'PSP Notify Payment'}
                                                        onChange={(e) => this.handleChange(e)}
                                                    />
                                                </Form.Group>

                                                <Form.Group controlId="rt_push" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.state.channel.rt_push === true}
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
                                                        checked={this.state.channel.on_us === true}
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
                                                        checked={this.state.channel.card_chart === true}
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
                                                        checked={this.state.channel.recovery === true}
                                                        type={'checkbox'}
                                                        id={'recovery'}
                                                        label={'Processo di Recovery Pull'}
                                                        name="recovery"
                                                        onChange={(e) => this.handleChange(e)}
                                                    />
                                                </Form.Group>

                                                <Form.Group controlId="digital_stamp_brand"
                                                            className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.state.channel.digital_stamp_brand === true}
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

                                    <div className="row mt-3">
                                        <div className="col-md-12">
                                            <Card>
                                                <Card.Header>
                                                    <h5>Tipo Versamento</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    {Object.keys(paymentTypeList).length === 0 && !newPaymentType && (
                                                        <Alert className={'col-md-12'} variant={"warning"}><FaInfoCircle
                                                            className="mr-1"/>Tipi Versamento non presenti</Alert>
                                                    )}
                                                    {(Object.keys(paymentTypeList).length > 0 || newPaymentType) &&
                                                        <Table hover responsive size="sm">
                                                            <thead>
                                                            <tr>
                                                                <th className="">Codice</th>
                                                                <th>Descrizione</th>
                                                                <th></th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {paymentTypeList}
                                                            {
                                                                newPaymentType &&
                                                                <tr>
                                                                    <td>
                                                                        <Form.Control as="select" name="paymentToken"
                                                                                      onChange={(e) => this.handlePaymentType(e.target.value)}>
                                                                            <option></option>
                                                                            {
                                                                                Object.keys(paymentTypeLegend)
                                                                                    .filter((p: string) => this.state.paymentTypeList.indexOf(p) === -1)
                                                                                    .map((p, index) =>
                                                                                        <option key={index} value={p}>
                                                                                            {p} - {paymentTypeLegend[p]}
                                                                                            {
                                                                                                p === "OBEP" && " DEPRECATO"
                                                                                            }
                                                                                        </option>)
                                                                            }
                                                                        </Form.Control>
                                                                    </td>
                                                                    <td></td>
                                                                    <td></td>
                                                                </tr>
                                                            }

                                                            </tbody>
                                                        </Table>
                                                    }
                                                </Card.Body>
                                                <Card.Footer>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            {
                                                                !newPaymentType && <Button className="float-md-right"
                                                                                           onClick={() => this.newPaymentType()}>Nuovo <FaPlus/></Button>
                                                            }
                                                            {
                                                                newPaymentType &&
                                                                <Button className="ml-2 float-md-right" variant="secondary"
                                                                        onClick={() => {
                                                                            this.discardPaymentType();
                                                                        }}>Annulla</Button>
                                                            }
                                                            {
                                                                newPaymentType &&
                                                                <Button className="float-md-right" onClick={() => {
                                                                    this.savePaymentType();
                                                                }}>Salva</Button>
                                                            }

                                                        </div>
                                                    </div>
                                                </Card.Footer>
                                            </Card>
                                        </div>
                                    </div>
                                </>
                            )
                        }
                    </div>
                </div>
                <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                    <p>Sei sicuro di voler eliminare il seguente tipo versamento?</p>
                    <ul>
                        <li>{paymentTypeToDelete}</li>
                    </ul>
                </ConfirmationModal>
            </div>
        );
    }
}
