import React from "react";
import {Alert, Breadcrumb, Button, Card, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import debounce from "lodash.debounce";
import AsyncSelect from "react-select/async";
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
    backup: any;
    stationName: string;
    code: string;
    station: StationDetails;
    edit: boolean;
}

export default class EditStation extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/stations";

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            backup: {
                station: {} as StationDetails
            },
            stationName: "",
            code: "",
            station: {} as StationDetails,
            edit: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.saveStation = this.saveStation.bind(this);
        this.discard = this.discard.bind(this);
        this.debouncedBrokerOptions = this.debouncedBrokerOptions.bind(this);

    }

    updateBackup(section: string, data: StationDetails | any) {
        // eslint-disable-next-line functional/no-let
        let backup = {...this.state.backup};
        backup = {...backup, [section]: data};
        const ports = ["port", "port_4mod", "proxy_port", "redirect_port"];
        for (const key of ports) {
            // eslint-disable-next-line no-prototype-builtins
            if (!backup.station.hasOwnProperty(key)) {
                // eslint-disable-next-line functional/immutable-data
                backup.station[key] = "";
            }
        }
        this.setState({backup});
    }

    getStation(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getStation({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    stationcode: code
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        this.setState({station: response.right.value});
                        this.setState({stationName: response.right.value.station_code});
                        this.updateBackup("station", response.right.value);
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
        this.getStation(code);
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let station: StationDetails = this.state.station;
        const key = event.target.name as string;
        // eslint-disable-next-line functional/no-let
        let value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        if (value === 'null'){
            value = null;
        }
        station = {...station, [key]: value};
        this.setState({station});
    }

    handleBrokerChange(event: any) {
        const station: StationDetails = this.state.station;
        // eslint-disable-next-line functional/immutable-data
        station.broker_code = event.value;
        this.setState({station});
    }


    saveStation() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updateStation({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    stationcode: this.state.code,
                    body: this.state.station
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        toast.info("Modifica avvenuta con successo.");
                        this.setState({station: response.right.value});
                        this.setState({stationName: response.right.value.station_code});
                        this.updateBackup("station", response.right.value);
                    } else {
                        const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                        this.toastError(message);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });
            });
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    discard(section: string) {
        // "as any" is necessary because it seems to be a bug: https://github.com/Microsoft/TypeScript/issues/13948
        this.setState({[section]: Object.assign({}, this.state.backup[section])} as any);
    }

    debouncedBrokerOptions = debounce((inputValue, callback) => {
        this.promiseBrokerOptions(inputValue, callback);
    }, 500);

    promiseBrokerOptions(inputValue: string, callback: any) {
        const limit = inputValue.length === 0 ? 10 : 99999;
        const code = inputValue.length === 0 ? "" : inputValue;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getBrokers({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page: 0,
                    limit,
                    code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const items: Array<any> = [];
                        resp.right.value.brokers.map((broker: any) => {
                            // eslint-disable-next-line functional/immutable-data
                            items.push({
                                value: broker.broker_code,
                                label: broker.broker_code,
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

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href={this.service}>Stazioni</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.stationName || "-"}</Breadcrumb.Item>
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
                                            <h2>{this.state.stationName || "-"}</h2>
                                        </div>
                                    </div>

                                    <Card>
                                        <Card.Header>
                                            <h5>Anagrafica</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="row">
                                                <Form.Group controlId="station_code" className="col-md-3">
                                                    <Form.Label>Codice <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control name="station_code" placeholder=""
                                                                  value={this.state.station.station_code}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="enabled" className="col-md-2">
                                                    <Form.Label>Stato <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control as="select" name="enabled" placeholder="stato"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  value={String(this.state.station.enabled)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>

                                                <Form.Group controlId="version" className="col-md-1">
                                                    <Form.Label>Versione <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control type={"number"} name="version"
                                                                  value={this.state.station.version}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="broker_code" className="col-md-2">
                                                    <Form.Label>Codice Intermediario <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <AsyncSelect
                                                        cacheOptions defaultOptions
                                                        loadOptions={this.debouncedBrokerOptions}
                                                        placeholder="Cerca codice"
                                                        menuPortalTarget={document.body}
                                                        styles={{menuPortal: base => ({...base, zIndex: 9999})}}
                                                        name="broker_code"
                                                        value={{label: this.state.station.broker_code, value: this.state.station.broker_code}}
                                                        onChange={(e) => this.handleBrokerChange(e)}
                                                    />
                                                </Form.Group>

                                                <Form.Group controlId="password" className="col-md-2">
                                                    <Form.Label>Password</Form.Label>
                                                    <Form.Control name="password"
                                                                  value={this.state.station.password}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="new_password" className="col-md-2">
                                                    <Form.Label>Nuova Password</Form.Label>
                                                    <Form.Control name="new_password"
                                                                  value={this.state.station.new_password}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>

                                            <div className="row">
                                                <Form.Group controlId="protocol" className="col-md-2">
                                                    <Form.Label>Protocollo <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control as="select" name="protocol"
                                                                  defaultValue={String(this.state.station.protocol)}
                                                                  onChange={(e) => this.handleChange(e)} >
                                                        <option value="HTTPS">HTTPS</option>
                                                        <option value="HTTP">HTTP</option>
                                                    </Form.Control>
                                                </Form.Group>

                                                <Form.Group controlId="ip" className="col-md-2">
                                                    <Form.Label>IP</Form.Label>
                                                    <Form.Control name="ip"

                                                                  value={this.state.station.ip}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="port" className="col-md-2">
                                                    <Form.Label>Porta <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="port" value={this.state.station.port}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="service" className="col-md-3">
                                                    <Form.Label>Servizio</Form.Label>
                                                    <Form.Control name="service"
                                                                  value={this.state.station.service}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>


                                                <Form.Group controlId="pof_service" className="col-md-3">
                                                    <Form.Label>Servizio POF</Form.Label>
                                                    <Form.Control name="pof_service"
                                                                  value={this.state.station.pof_service}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>

                                            <div className="row">
                                                <Form.Group controlId="protocol_4mod" className="col-md-2">
                                                    <Form.Label>Protocollo Modello 4</Form.Label>
                                                    <Form.Control as="select" name="protocol_4mod"
                                                                  defaultValue={String(this.state.station.protocol_4mod)}
                                                                  onChange={(e) => this.handleChange(e)} >
                                                        <option value="HTTPS">HTTPS</option>
                                                        <option value="HTTP">HTTP</option>
                                                    </Form.Control>
                                                </Form.Group>

                                                <Form.Group controlId="ip_4mod" className="col-md-2">
                                                    <Form.Label>IP Modello 4</Form.Label>
                                                    <Form.Control name="ip_4mod"

                                                                  value={this.state.station.ip_4mod}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="port_4mod" className="col-md-2">
                                                    <Form.Label>Porta Modello 4</Form.Label>
                                                    <Form.Control name="port_4mod" type="number"
                                                                  value={this.state.station.port_4mod}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="service_4mod" className="col-md-3">
                                                    <Form.Label>Servizio Modello 4</Form.Label>
                                                    <Form.Control name="service_4mod"
                                                                  value={this.state.station.service_4mod}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>

                                            <div className="row">
                                                <Form.Group controlId="redirect_protocol" className="col-md-2">
                                                    <Form.Label>Protocollo Redirect</Form.Label>
                                                    <Form.Control as="select" name="redirect_protocol"
                                                                  defaultValue={String(this.state.station.redirect_protocol)}
                                                                  onChange={(e) => this.handleChange(e)} >
                                                        <option value="HTTPS">HTTPS</option>
                                                        <option value="HTTP">HTTP</option>
                                                    </Form.Control>
                                                </Form.Group>

                                                <Form.Group controlId="redirect_ip" className="col-md-2">
                                                    <Form.Label>IP Redirect</Form.Label>
                                                    <Form.Control name="redirect_ip"

                                                                  value={this.state.station.redirect_ip}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="redirect_port" className="col-md-2">
                                                    <Form.Label>Porta Redirect</Form.Label>
                                                    <Form.Control name="redirect_port" type="number"
                                                                  value={this.state.station.redirect_port}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="redirect_path" className="col-md-3">
                                                    <Form.Label>Servizio Redirect</Form.Label>
                                                    <Form.Control name="redirect_path"
                                                                  value={this.state.station.redirect_path}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="redirect_query_string" className="col-md-3">
                                                    <Form.Label>Parametri Redirect</Form.Label>
                                                    <Form.Control name="redirect_query_string"
                                                                  value={this.state.station.redirect_query_string}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>

                                            <div className="row">
                                                <Form.Group controlId="proxy_enabled" className="col-md-2">
                                                    <Form.Label>Proxy</Form.Label>
                                                    <Form.Control as="select" name="proxy_enabled" placeholder="stato"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  value={String(this.state.station.proxy_enabled)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>

                                                <Form.Group controlId="proxy_host" className="col-md-2">
                                                    <Form.Label>Indirizzo Proxy</Form.Label>
                                                    <Form.Control name="proxy_host"
                                                                  value={this.state.station.proxy_host}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="proxy_port" className="col-md-2">
                                                    <Form.Label>Porta Proxy</Form.Label>
                                                    <Form.Control name="proxy_port" type="number"
                                                                  value={this.state.station.proxy_port}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="proxy_username" className="col-md-3">
                                                    <Form.Label>Username Proxy</Form.Label>
                                                    <Form.Control name="proxy_username"
                                                                  value={this.state.station.proxy_username}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="proxy_password" className="col-md-3">
                                                    <Form.Label>Password Proxy</Form.Label>
                                                    <Form.Control name="proxy_password"
                                                                  value={this.state.station.proxy_password}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>

                                            <div className="row">

                                                <Form.Group controlId="flag_online" className="col-md-2">
                                                    <Form.Label>Flag Online</Form.Label>
                                                    <Form.Control as="select" name="flag_online" placeholder="stato"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  value={String(this.state.station.flag_online)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>

                                                <Form.Group controlId="thread_number" className="col-md-2">
                                                    <Form.Label>Numero Thread <span
                                                        className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="thread_number"
                                                                  value={this.state.station.thread_number}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="timeout_a" className="col-md-2">
                                                    <Form.Label>Timeout A <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="timeout_a"
                                                                  value={this.state.station.timeout_a}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="timeout_b" className="col-md-2">
                                                    <Form.Label>Timeout B <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="timeout_b"
                                                                  value={this.state.station.timeout_b}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="timeout_c" className="col-md-2">
                                                    <Form.Label>Timeout C <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control type="number" name="timeout_c"
                                                                  value={this.state.station.timeout_c}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                            </div>


                                        </Card.Body>
                                        <Card.Footer>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <Button className="ml-2 float-md-right" variant="secondary"
                                                            onClick={() => {
                                                                this.discard("station");
                                                            }}>Annulla</Button>
                                                    <Button className="float-md-right" onClick={() => {
                                                        this.saveStation();
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
