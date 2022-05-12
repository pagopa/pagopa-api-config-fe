import React from "react";
import {Alert, Breadcrumb, Card, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaCloudDownloadAlt, FaEye, FaInfoCircle, FaSpinner, FaTimes} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import axios, {AxiosRequestConfig} from "axios";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {StationDetails} from "../../../generated/api/StationDetails";
import Paginator from "../../components/Paginator";
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
    station: StationDetails;
    edit: boolean;
    ci: any;
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
            edit: false,
            ci: {}
        };

        this.handlePageChange = this.handlePageChange.bind(this);
    }

    getStationCall(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getStation({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    stationcode: code
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            this.getStationCI(code, 0);
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

    getStationCI(code: string, page: number): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getStationCreditorInstitutions({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    stationcode: code,
                    page,
                    limit: 5
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({ci: response.right.value});
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

    handlePageChange(requestedPage: number) {
        const code: string = this.props.match.params.code as string;
        this.getStationCI(code, requestedPage);
    }

    handleDetails(code: string) {
        this.props.history.push("/creditor-institutions/" + code);
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({isError: false});
        this.getStationCall(code);
    }

    getCIList(): any {
        // eslint-disable-next-line functional/no-let
        let ciList = [];
        if (this.state.ci.creditor_institutions) {
            ciList = this.state.ci.creditor_institutions.map((item: any, index: number) => (
                <tr key={index}>
                    <td>{item.business_name}</td>
                    <td>{item.creditor_institution_code}</td>
                    <td className="text-center">
                        {item.enabled && <FaCheck className="text-success"/>}
                        {!item.enabled && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-center">{item.application_code}</td>
                    <td className="text-center">{item.segregation_code}</td>
                    <td className="text-center">{item.aux_digit}</td>
                    <td className="text-center">
                        {item.mod4 && <FaCheck className="text-success"/>}
                        {!item.mod4 && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-center">
                        {item.broadcast && <FaCheck className="text-success"/>}
                        {!item.broadcast && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-right">
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-details-${index}`}>Visualizza</Tooltip>}>
                            <FaEye role="button" className="mr-3"
                                   onClick={() => this.handleDetails(item.creditor_institution_code)}/>
                        </OverlayTrigger>
                    </td>
                </tr>
            ));
        }
        return ciList;
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
            const url = `${String(baseUrl)}${String(basePath)}/stations/${this.state.station.station_code}/creditorinstitutions/csv`;
            axios.get(url, config)
                .then((res: any) => {
                    if (res.data.size > 1) {
                        const objectUrl = window.URL.createObjectURL(res.data);
                        // eslint-disable-next-line functional/immutable-data
                        anchor.href = objectUrl;
                        // eslint-disable-next-line functional/immutable-data
                        anchor.download = this.state.station.station_code + '-enti_creditori.csv';
                        anchor.click();
                        window.URL.revokeObjectURL(objectUrl);
                    }
                    else {
                        toast.warn("Problemi nella generazione del file CSV richiesto.", {theme: "colored"});
                    }
                })
                .catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });
        });
    }


    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        // create rows for ci table
        const ciList = this.getCIList();

        return (
            <div className="container-fluid station">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/stations">Stazioni</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.station.station_code || "-"}</Breadcrumb.Item>
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
                                            <h2>{this.state.station.station_code || "-"}</h2>
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
                                            <Form.Control placeholder="-" value={this.state.station.new_password} readOnly/>
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
                                        <Form.Group controlId="pof_service" className="col-md-3">
                                            <Form.Label>Servizio POF</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.pof_service} readOnly/>
                                        </Form.Group>
                                    </div>

                                    <div className="row">
                                        <Form.Group controlId="protocol_4mod" className="col-md-2">
                                            <Form.Label>Protocollo Modello 4</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.protocol_4mod}
                                                          readOnly/>
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
                                            <Form.Control placeholder="-" value={this.state.station.redirect_protocol}
                                                          readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_ip" className="col-md-2">
                                            <Form.Label>IP Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.redirect_ip} readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_port" className="col-md-2">
                                            <Form.Label>Porta Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.redirect_port}
                                                          readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_path" className="col-md-3">
                                            <Form.Label>Servizio Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.redirect_path}
                                                          readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="redirect_query_string" className="col-md-3">
                                            <Form.Label>Parametri Redirect</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.redirect_query_string}
                                                          readOnly/>
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
                                            <Form.Control placeholder="-" value={this.state.station.proxy_username}
                                                          readOnly/>
                                        </Form.Group>

                                        <Form.Group controlId="proxy_password" className="col-md-3">
                                            <Form.Label>Password Proxy</Form.Label>
                                            <Form.Control placeholder="-" value={this.state.station.proxy_password}
                                                          readOnly/>
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
                                            <Form.Control placeholder="-" value={this.state.station.thread_number}
                                                          readOnly/>
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

                                    <div className="row mt-3">
                                        <div className="col-md-12">
                                            <Card>
                                                <Card.Header>
                                                    <div className={"d-flex justify-content-between align-items-center"}>
                                                        <h5>Enti Creditori</h5>
                                                        <OverlayTrigger placement="top"
                                                                        overlay={<Tooltip>Scarica</Tooltip>}>
                                                            <FaCloudDownloadAlt role="button" className="mr-3"
                                                                                onClick={() => this.downloadCsv()}/>
                                                        </OverlayTrigger>

                                                    </div>
                                                </Card.Header>
                                                <Card.Body>
                                                    {Object.keys(ciList).length === 0 && (
                                                        <Alert className={'col-md-12'} variant={"warning"}><FaInfoCircle
                                                            className="mr-1"/>EC non presenti</Alert>
                                                    )}
                                                    {Object.keys(ciList).length > 0 &&
													<Table hover responsive size="sm">
														<thead>
														<tr>
															<th className="">Ente creditore</th>
															<th className="">Codice</th>
															<th className="text-center">Abilitato</th>
															<th className="text-center">Application Code</th>
															<th className="text-center">Segregation Code</th>
															<th className="text-center">Aux Digit</th>
															<th className="text-center">Mod4</th>
															<th className="text-center">Broadcast</th>
															<th className="text-center"></th>
														</tr>
														</thead>
														<tbody>
                                                        {ciList}
														</tbody>
													</Table>
                                                    }
                                                    {
                                                        this.state.ci.page_info &&
                                                        <Paginator pageInfo={this.state.ci.page_info}
                                                                   onPageChanged={this.handlePageChange}/>
                                                    }
                                                </Card.Body>
                                            </Card>
                                        </div>
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
