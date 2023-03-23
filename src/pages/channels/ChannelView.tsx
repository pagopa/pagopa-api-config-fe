import React from "react";
import {Alert, Breadcrumb, Button, Card, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {MsalContext} from "@azure/msal-react";
import {FaCheck, FaCloudDownloadAlt, FaEye, FaInfoCircle, FaPlus, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";
import AsyncSelect from "react-select/async";
import debounce from "lodash.debounce";
import {toast} from "react-toastify";
import {ChannelDetails} from "../../../generated/api/ChannelDetails";
import {loginRequest} from "../../authConfig";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import Paginator from "../../components/Paginator";

interface IProps {
    channel: ChannelDetails;
    setChannel: (channel: ChannelDetails) => void;
    saveChannel?: () => void;
    showModal: boolean;
    setShowModal?: (showModal: boolean) => void;
    paymentTypeList: Array<string>;
    isLoading: boolean;
    isError: boolean;
    history: any;
    readOnly: boolean;
    showPaymentTypeList: boolean;
    newPaymentType?: boolean;
    setNewPaymentType?: () => void;
    handlePaymentType?: (paymentType: string) => void;
    paymentTypeLegend?: any;
    discardPaymentType?: () => void;
    savePaymentType?: () => void;
    removePaymentType?: (paymentTypeDelete: string) => void;
    downloadCsv?: () => void;
    pspList: [];
    pageInfo?: any;
    handlePspDetails?: (code: string) => void;
    // eslint-disable-next-line @typescript-eslint/ban-types
    handlePageChange?: Function;
}

export default class ChannelView extends React.Component<IProps> {
    static contextType = MsalContext;

    service = "/channels";

    constructor(props: IProps) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.debouncedBrokerPspOptions = this.debouncedBrokerPspOptions.bind(this);
        this.discard = this.discard.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.promiseWfespOptions = this.promiseWfespOptions.bind(this);
    }

    hideModal(status: string): void {
        if (status === "ok") {
            this.props.history.push(this.service);
        }
        if (this.props.setShowModal) {
            this.props.setShowModal(false);
        }
    }

    discard() {
        if (this.props.setShowModal) {
            this.props.setShowModal(true);
        }
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
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

    validData() {
        if (this.isNotValidPort(this.props.channel.port) || this.isNotValidPort(this.props.channel.proxy_port as number)
            || this.isNotValidPort(this.props.channel.redirect_port as number)) {
            this.toastError("La porta deve avere un valore compreso tra 1 e 65535.");
            return false;
        }

        if (this.isNotValidThread(this.props.channel.thread_number)) {
            this.toastError("Il numero di thread deve essere un valore maggiore di 0.");
            return false;
        }

        if (this.isNotValidTimeout(this.props.channel.timeout_a)
            || this.isNotValidTimeout(this.props.channel.timeout_b) || this.isNotValidTimeout(this.props.channel.timeout_c)) {
            this.toastError("I timeout devono avere un valore maggiore o uguale a 0.");
            return false;
        }

        if (this.isNotValidPrimitiveVersion(this.props.channel.primitive_version)) {
            this.toastError("La versione delle primitive deve essere una tra le seguenti: 1 o 2");
            return;
        }
        return true;
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
                this.toastError("Operazione non avvenuta a causa di un errore");
                callback([]);
            });
        });
    }

    promiseWfespOptions(_label: string, callback: any) {
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
                            value: '-',
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

    handleWfespChange(event: any) {
        const channel: ChannelDetails = this.props.channel;
        // eslint-disable-next-line functional/no-let
        const value = event.value;
        // eslint-disable-next-line functional/immutable-data
        channel.serv_plugin = value;
        this.props.setChannel(channel);
    }

    handlePaymentTypeDelete(paymentType: string) {
        this.props.removePaymentType?.(paymentType);
    }

    handleEdit() {
        this.props.history.push("/channels/" + String(this.props.channel.channel_code) + "?edit");
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        const key = event.target.name as string;
        // eslint-disable-next-line functional/no-let
        let value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        if (value === '-') {
            value = null;
        }
        const channel = {...this.props.channel, [key]: value};
        this.props.setChannel(channel);
    }

    handleBrokerPspChange(event: any) {
        const channel: ChannelDetails = this.props.channel;
        // eslint-disable-next-line functional/immutable-data
        channel.broker_psp_code = event.value;
        this.props.setChannel(channel);
    }

    fillPaymentTypeList(paymentTypeList: any = []) {
        if(this.props.showPaymentTypeList){
            this.props.paymentTypeList.forEach((item: any, index: number) => {
                const row = (
                    <tr key={index}>
                        <td>{item}</td>
                        <td>
                            {this.props.paymentTypeLegend[item]}
                            {
                                item === "OBEP" && <span className="badge badge-danger ml-2">DEPRECATO</span>
                            }
                        </td>
                        {!this.props.readOnly &&
                            <td className={"text-right"}>
                                <OverlayTrigger placement="top"
                                                overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                    <FaTrash role="button" className="mr-3" onClick={() => this.handlePaymentTypeDelete(item)}/>
                                </OverlayTrigger>
                            </td>
                        }
                    </tr>
                );
                paymentTypeList.push(row);
            });
        }
    }

    fillPspList(pspList: any = []) {
        if(this.props.readOnly){
            this.props.pspList.map((item: any, index: number) => {
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
                                    onClick={() => this.props.handlePspDetails && this.props.handlePspDetails(item.psp_code)}/>
                            </OverlayTrigger>
                        </td>
                    </tr>
                );
                pspList.push(row);
            });
        }
    }

    renderPaymentListFooter(newPaymentType?: boolean) {
        return(
                <div className="row">
                <div className="col-md-12">
                    {
                        !newPaymentType && <Button className="float-md-right"
                                                onClick={() => this.props.setNewPaymentType && this.props.setNewPaymentType()}>Nuovo <FaPlus/></Button>
                    }
                    {
                        newPaymentType &&
                        <Button className="ml-2 float-md-right" variant="secondary"
                                onClick={() => this.props.discardPaymentType?.()}>Annulla</Button>
                    }
                    {
                        newPaymentType &&
                        <Button className="float-md-right" onClick={(event) => {
                            // eslint-disable-next-line functional/immutable-data
                            (event.currentTarget as HTMLButtonElement).disabled = true;
                            this.props.savePaymentType?.();
                        }}>Salva</Button>
                    }

                </div>
            </div>
        );
    }

    renderPaymentTypeList(paymentTypeList: Array<string>, newPaymentType?: boolean) {
        return(
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
                                                        onChange={(e) => this.props.handlePaymentType && this.props.handlePaymentType(e.target.value)}>
                                                <option></option>
                                                {
                                                    Object.keys(this.props.paymentTypeLegend)
                                                        .filter((p: string) => this.props.paymentTypeList.indexOf(p) === -1)
                                                        .map((p, index) =>
                                                            <option key={index} value={p}>
                                                                {p} - {this.props.paymentTypeLegend[p]}
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
                    {!this.props.readOnly && this.props.showPaymentTypeList &&
                        <Card.Footer>
                            {this.renderPaymentListFooter(newPaymentType)}
                        </Card.Footer>
                    }
                </Card>
            </div>
        </div>
        );
    }

    renderPspList(pspList: [], pageInfo: any, paymentTypeLegend: any) {
        return(
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
                                                        onClick={() => this.props.downloadCsv && this.props.downloadCsv()}/>
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
                            <>
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
                            <Paginator pageInfo={pageInfo} onPageChanged={this.props.handlePageChange!}/>
                            </>
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
        );
    }

    render(): React.ReactNode {
        const isError = this.props.isError;
        const isLoading = this.props.isLoading;
        const newPaymentType = this.props.newPaymentType;

        const paymentTypeLegend: any = this.props.paymentTypeLegend && Object.keys(this.props.paymentTypeLegend).map((item: any, index: number) => (
                <span key={index} className="mr-2 badge badge-secondary">
                    {item}: {this.props.paymentTypeLegend[item]}
                    {item === "OBEP" && <span className="badge badge-danger ml-2">DEPRECATO</span>}
                </span>
        ));
        const paymentTypeList: any = [];
        this.fillPaymentTypeList(paymentTypeList);
        const pspList: any = [];
        this.fillPspList(pspList);
        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href={this.service}>Canali</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.props.channel.channel_code || "-"}</Breadcrumb.Item>
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
                                            <h2>{this.props.channel.channel_code || "-"}</h2>
                                        </div>
                                        {(this.props.readOnly && 
                                        <div className="col-md-2 text-right">
                                            <button className={"btn btn-primary"}
                                                onClick={() => this.handleEdit()}>Edit
                                            </button>
                                        </div>)}
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
                                                                  value={this.props.channel.channel_code}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}
                                                                  />
                                                </Form.Group>

                                                <Form.Group controlId="enabled" className="col-md-2">
                                                    <Form.Label>Stato <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control as="select" name="enabled"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}
                                                                  value={String(this.props.channel.enabled)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>
                                                <Form.Group controlId="primitive_version" className="col-md-2">
                                                    <Form.Label>Versione primitive <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control type={"number"} name="primitive_version" min={1} max={2}
                                                                value={this.props.channel.primitive_version}
                                                                onChange={(e) => this.handleChange(e)}
                                                                readOnly={this.props.readOnly}/>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="broker_psp_code" className="col-md-4">
                                                    <Form.Label>Codice Intermediario PSP <span
                                                        className="text-danger">*</span></Form.Label>
                                                    {(!this.props.readOnly &&
                                                        <AsyncSelect
                                                            cacheOptions defaultOptions
                                                            loadOptions={this.debouncedBrokerPspOptions}
                                                            placeholder="Cerca codice"
                                                            menuPortalTarget={document.body}
                                                            styles={{menuPortal: base => ({...base, zIndex: 9999})}}
                                                            name="broker_code"
                                                            value={{
                                                                label: this.props.channel.broker_psp_code,
                                                                value: this.props.channel.broker_psp_code
                                                            }}
                                                            onChange={(e) => this.handleBrokerPspChange(e)}
                                                    />
                                                    )}
                                                    {(this.props.readOnly &&
                                                        <Form.Control name="broker_psp_code"
                                                                value={this.props.channel.broker_psp_code}
                                                                readOnly={this.props.readOnly}/>
                                                    )}
                                                </Form.Group>
                                                <Form.Group controlId="password" className="col-md-4">
                                                    <Form.Label>Password</Form.Label>
                                                    <Form.Control name="password" placeholder=""
                                                                  value={this.props.channel.password}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>
                                                <Form.Group controlId="new_password" className="col-md-4">
                                                    <Form.Label>Nuova Password</Form.Label>
                                                    <Form.Control name="new_password" placeholder=""
                                                                  value={this.props.channel.new_password}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>
                                            </div>

                                            <div className={"divider"}></div>
                                            <h4>Endpoint</h4>
                                            <div className="row">
                                                <Form.Group controlId="protocol" className="col-md-2">
                                                    <Form.Label>Protocollo <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control as="select" name="protocol"
                                                                  value={String(this.props.channel.protocol)}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}>
                                                        <option value="HTTPS">HTTPS</option>
                                                        <option value="HTTP">HTTP</option>
                                                    </Form.Control>
                                                </Form.Group>

                                                <Form.Group controlId="ip" className="col-md-5">
                                                    <Form.Label>Indirizzo</Form.Label>
                                                    <Form.Control name="ip" placeholder=""
                                                                  value={this.props.channel.ip}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="port" className="col-md-2">
                                                    <Form.Label>Porta <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control name="port" type="number" placeholder="" min={1}
                                                                  max={65535}
                                                                  value={this.props.channel.port}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>

                                                <Form.Group controlId="service" className="col-md-5">
                                                    <Form.Label>Servizio</Form.Label>
                                                    <Form.Control name="service" placeholder=""
                                                                  value={this.props.channel.service}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>

                                                <Form.Group controlId="nmp_service" className="col-md-5">
                                                    <Form.Label>Servizio NMP</Form.Label>
                                                    <Form.Control name="nmp_service" placeholder=""
                                                                  value={this.props.channel.nmp_service}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>
                                            </div>

                                            <div className={"divider"}></div>
                                            <h4>Target</h4>
                                            <p>Configurazione del psp aderente alla nuova connettività.</p>
                                            <p className="alert alert-info">
                                                <FaInfoCircle /> Impostare la password a <span className="badge badge-light">PLACEHOLDER</span> e disabilitare il proxy.
                                            </p>
                                            <div className="card">
                                                <div className="card-header">Configurazione per endpoint <b>Servizio</b></div>
                                                <div className="card-body">
                                                    <div className="row">
                                                        <Form.Group controlId="target_host" className="col-md-5">
                                                            <Form.Label>Indirizzo</Form.Label>
                                                            <Form.Control name="target_host"
                                                                          value={this.props.channel.target_host}
                                                                          onChange={(e) => this.handleChange(e)}
                                                                          readOnly={this.props.readOnly}/>
                                                        </Form.Group>

                                                        <Form.Group controlId="target_port" className="col-md-2">
                                                            <Form.Label>Porta</Form.Label>
                                                            <Form.Control name="target_port" type="number" min={1} max={65535}
                                                                          value={this.props.channel.target_port}
                                                                          onChange={(e) => this.handleChange(e)}
                                                                          readOnly={this.props.readOnly}/>
                                                        </Form.Group>
                                                        <Form.Group controlId="target_path" className="col-md-5">
                                                            <Form.Label>Path</Form.Label>
                                                            <Form.Control name="target_path"
                                                                          value={this.props.channel.target_path}
                                                                          onChange={(e) => this.handleChange(e)}
                                                                          readOnly={this.props.readOnly}/>
                                                        </Form.Group>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card mt-2">
                                                <div className="card-header">Configurazione per endpoint <b>Servizio NMP</b></div>
                                                <div className="card-body">
                                                    <div className="row">
                                                        <Form.Group controlId="target_host_nmp" className="col-md-5">
                                                            <Form.Label>Indirizzo</Form.Label>
                                                            <Form.Control name="target_host_nmp"
                                                                          value={this.props.channel.target_host_nmp}
                                                                          onChange={(e) => this.handleChange(e)}
                                                                          readOnly={this.props.readOnly}/>
                                                        </Form.Group>

                                                        <Form.Group controlId="target_port_nmp" className="col-md-2">
                                                            <Form.Label>Porta</Form.Label>
                                                            <Form.Control name="target_port_nmp" type="number" min={1} max={65535}
                                                                          value={this.props.channel.target_port_nmp}
                                                                          onChange={(e) => this.handleChange(e)}
                                                                          readOnly={this.props.readOnly}/>
                                                        </Form.Group>
                                                        <Form.Group controlId="target_path_nmp" className="col-md-5">
                                                            <Form.Label>Path</Form.Label>
                                                            <Form.Control name="target_path_nmp"
                                                                          value={this.props.channel.target_path_nmp}
                                                                          onChange={(e) => this.handleChange(e)}
                                                                          readOnly={this.props.readOnly}/>
                                                        </Form.Group>
                                                    </div>
                                                </div>
                                            </div>
                                                        
                                            <div className={"divider"}></div>
                                            <h4>Redirect</h4>
                                            <div className="row">
                                                <Form.Group controlId="redirect_protocol" className="col-md-2">
                                                    <Form.Label>Protocollo Redirect</Form.Label>
                                                    <Form.Control as="select" name="redirect_protocol"
                                                                  value={String(this.props.channel.redirect_protocol)}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}>
                                                        <option value="HTTPS">HTTPS</option>
                                                        <option value="HTTP">HTTP</option>
                                                    </Form.Control>
                                                </Form.Group>

                                                <Form.Group controlId="redirect_ip" className="col-md-6">
                                                    <Form.Label>IP Redirect</Form.Label>
                                                    <Form.Control name="redirect_ip" placeholder=""
                                                                  value={this.props.channel.redirect_ip}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>
                                            </div>
                                            <div className={"row"}>


                                                <Form.Group controlId="redirect_port" className="col-md-2">
                                                    <Form.Label>Porta Redirect</Form.Label>
                                                    <Form.Control name="redirect_port" placeholder="" type="number"
                                                                  value={this.props.channel.redirect_port} min={1}
                                                                  max={65535}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>

                                                <Form.Group controlId="redirect_path" className="col-md-6">
                                                    <Form.Label>Servizio Redirect</Form.Label>
                                                    <Form.Control name="redirect_path" placeholder=""
                                                                  value={this.props.channel.redirect_path}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>

                                                <Form.Group controlId="redirect_query_string" className="col-md-4">
                                                    <Form.Label>Parametri Redirect</Form.Label>
                                                    <Form.Control name="redirect_query_string" placeholder=""
                                                                  value={this.props.channel.redirect_query_string}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>
                                            </div>

                                            <div className={"divider"}></div>
                                            <h4>Proxy</h4>
                                            <div className="row">
                                                <Form.Group controlId="proxy_enabled" className="col-md-2">
                                                    <Form.Label>Proxy</Form.Label>
                                                    <Form.Control as="select" onChange={(e) => this.handleChange(e)}
                                                                  name="proxy_enabled"
                                                                  readOnly={this.props.readOnly}
                                                                  value={String(this.props.channel.proxy_enabled)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>

                                                <Form.Group controlId="proxy_host" className="col-md-2">
                                                    <Form.Label>Indirizzo Proxy</Form.Label>
                                                    <Form.Control name="proxy_host" placeholder=""
                                                                  value={this.props.channel.proxy_host}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>

                                                <Form.Group controlId="proxy_port" className="col-md-2">
                                                    <Form.Label>Porta Proxy</Form.Label>
                                                    <Form.Control name="proxy_port" placeholder="" type="number"
                                                                  value={this.props.channel.proxy_port} min={1} max={65535}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>
                                            </div>

                                            <div className={"divider"}></div>
                                            <h4>Altre Informazioni</h4>
                                            <div className="row">
                                                <Form.Group controlId="payment_model" className="col-md-2">
                                                    <Form.Label>Modello Pagamento <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control as="select" name="payment_model"
                                                                  value={this.props.channel.payment_model}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}>
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
                                                    {(!this.props.readOnly &&
                                                        <AsyncSelect
                                                            cacheOptions defaultOptions
                                                            loadOptions={this.promiseWfespOptions}
                                                            placeholder={"-"}
                                                            menuPortalTarget={document.body}
                                                            styles={{menuPortal: base => ({...base, zIndex: 9999})}}
                                                            name="serv_plugin"
                                                            value={{
                                                                label: this.props.channel.serv_plugin,
                                                                value: this.props.channel.serv_plugin
                                                            }}
                                                            isSearchable={false}
                                                            onChange={(e) => this.handleWfespChange(e)}
                                                        />
                                                    )}
                                                    {(this.props.readOnly && 
                                                        <Form.Control name="serv_plugin"
                                                                value={this.props.channel.serv_plugin}
                                                                readOnly={this.props.readOnly}/>
                                                    )}
                                                </Form.Group>

                                                <Form.Group controlId="thread_number" className="col-md-2">
                                                    <Form.Label>Numero Thread <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="thread_number" placeholder="" min={1}
                                                                  value={this.props.channel.thread_number}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>

                                                <Form.Group controlId="timeout_a" className="col-md-2">
                                                    <Form.Label>Timeout A <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="timeout_a" placeholder="" min={0}
                                                                  value={this.props.channel.timeout_a}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>

                                                <Form.Group controlId="timeout_b" className="col-md-2">
                                                    <Form.Label>Timeout B <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="timeout_b" placeholder="" min={0}
                                                                  value={this.props.channel.timeout_b}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>

                                                <Form.Group controlId="timeout_c" className="col-md-2">
                                                    <Form.Label>Timeout C <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="timeout_c" placeholder="" min={0}
                                                                  value={this.props.channel.timeout_c}
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  readOnly={this.props.readOnly}/>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="flag_io" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        name="flag_io"
                                                        checked={this.props.channel.flag_io === true}
                                                        type={'checkbox'}
                                                        id={'flag_io'}
                                                        label={'PSP Notify Payment'}
                                                        onChange={(e) => this.handleChange(e)}
                                                        readOnly={this.props.readOnly}
                                                    />
                                                </Form.Group>

                                                <Form.Group controlId="rt_push" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.props.channel.rt_push === true}
                                                        type={'checkbox'}
                                                        id={'rt_push'}
                                                        label={'Push Ricevuta Telematica'}
                                                        name="rt_push"
                                                        onChange={(e) => this.handleChange(e)}
                                                        readOnly={this.props.readOnly}
                                                    />
                                                </Form.Group>

                                                <Form.Group controlId="on_us" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.props.channel.on_us === true}
                                                        type={'checkbox'}
                                                        id={'on_us'}
                                                        label={'On Us'}
                                                        name="on_us"
                                                        onChange={(e) => this.handleChange(e)}
                                                        readOnly={this.props.readOnly}
                                                    />
                                                </Form.Group>

                                                <Form.Group controlId="card_chart" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.props.channel.card_chart === true}
                                                        type={'checkbox'}
                                                        id={'card_chart'}
                                                        label={'Carrello RPT'}
                                                        name="card_chart"
                                                        onChange={(e) => this.handleChange(e)}
                                                        readOnly={this.props.readOnly}
                                                    />
                                                </Form.Group>

                                                <Form.Group controlId="recovery" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.props.channel.recovery === true}
                                                        type={'checkbox'}
                                                        id={'recovery'}
                                                        label={'Processo di Recovery Pull'}
                                                        name="recovery"
                                                        onChange={(e) => this.handleChange(e)}
                                                        readOnly={this.props.readOnly}
                                                    />
                                                </Form.Group>

                                                <Form.Group controlId="digital_stamp_brand"
                                                            className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.props.channel.digital_stamp_brand === true}
                                                        type={'checkbox'}
                                                        id={'digital_stamp_brand'}
                                                        label={'Marca Bollo Digitale'}
                                                        name="digital_stamp_brand"
                                                        onChange={(e) => this.handleChange(e)}
                                                        readOnly={this.props.readOnly}
                                                    />
                                                </Form.Group>
                                            </div>
                                        </Card.Body>
                                        {!this.props.readOnly &&
                                            <Card.Footer>
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <Button className="ml-2 float-md-right" variant="secondary"
                                                                onClick={() => {
                                                                    this.discard();
                                                                }}>Annulla</Button>
                                                        <Button className="float-md-right" onClick={() => 
                                                            this.validData() && this.props.saveChannel && this.props.saveChannel()
                                                            }>Salva</Button>
                                                    </div>
                                                </div>
                                            </Card.Footer>
                                        }
                                    </Card>
                                {this.props.showPaymentTypeList &&
                                    this.renderPaymentTypeList(paymentTypeList, newPaymentType)
                                }
                                </>
                            )
                        }
                    </div>
                </div>
                {this.props.readOnly && 
                    this.renderPspList(pspList, this.props.pageInfo, paymentTypeLegend)
                }
                <ConfirmationModal show={this.props.showModal} handleClose={this.hideModal}>
                    <p>Sei sicuro di voler annullare le modifiche?</p>
                </ConfirmationModal>
            </div>
        );
    }
}
