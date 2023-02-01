import React from "react";
import {Alert, Breadcrumb, Button, Card, Form} from "react-bootstrap";
import {MsalContext} from "@azure/msal-react";
import {FaInfoCircle, FaSpinner} from "react-icons/fa";
import {StationDetails} from "../../../generated/api/StationDetails";
import AsyncSelect from "react-select/async";
import debounce from "lodash.debounce";
import {loginRequest} from "../../authConfig";
import {apiClient} from "../../util/apiClient";
import {toast} from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";


interface IProps {
    station: StationDetails;
    setStation: (station: StationDetails) => void;
    saveStation: () => void;
    setShowModal: (showModal: boolean) => void;
    showModal: boolean;
    isLoading: boolean;
    history: any;
}

interface IState {
    isError: boolean;

}

export default class StationView extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/stations";

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.debouncedBrokerOptions = this.debouncedBrokerOptions.bind(this);
        this.discard = this.discard.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.validData = this.validData.bind(this);
    }

    hideModal(status: string): void {
        if (status === "ok") {
            this.props.history.push(this.service);
        }
        this.props.setShowModal(false);
    }

    discard() {
        this.props.setShowModal(true);
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

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    validData() {
        if (this.isNotValidPort(this.props.station.port) || this.isNotValidPort(this.props.station.port_4mod as number)
            || this.isNotValidPort(this.props.station.proxy_port as number)
            || this.isNotValidPort(this.props.station.redirect_port as number)) {
            this.toastError("La porta deve avere un valore compreso tra 1 e 65535.");
            return false;
        }
        if (this.isNotValidThread(this.props.station.thread_number)) {
            this.toastError("Il numero di thread deve essere un valore maggiore di 0.");
            return false;
        }

        if (this.isNotValidTimeout(this.props.station.timeout_a)
            || this.isNotValidTimeout(this.props.station.timeout_b) || this.isNotValidTimeout(this.props.station.timeout_c)) {
            this.toastError("I timeout devono avere un valore maggiore o uguale a 0.");
            return false;
        }

        if (this.isNotValidPrimitiveVersion(this.props.station.primitive_version)) {
            this.toastError("La versione delle primitive deve essere una tra le seguenti: 1 o 2");
            return;
        }
        return true;
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        const key = event.target.name as string;
        // eslint-disable-next-line functional/no-let
        let value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        if (value === 'null') {
            value = null;
        }
        const station = {...this.props.station, [key]: value};
        this.props.setStation(station);
    }

    handleBrokerChange(event: any) {
        const station: StationDetails = this.props.station;
        // eslint-disable-next-line functional/immutable-data
        station.broker_code = event.value;
        this.props.setStation(station);
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.props.isLoading;

        return (
                <div className="container-fluid creditor-institutions">
                    <div className="row">
                        <div className="col-md-12 mb-5">
                            <Breadcrumb>
                                <Breadcrumb.Item href={this.service}>Stazioni</Breadcrumb.Item>
                                <Breadcrumb.Item active>{this.props.station.station_code || "-"}</Breadcrumb.Item>
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
                                                        <h2>{this.props.station.station_code || "-"}</h2>
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
                                                                            value={this.props.station.station_code}
                                                                            onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>
                                                           <Form.Group controlId="enabled" className="col-md-2">
                                                               <Form.Label>Stato <span className="text-danger">*</span></Form.Label>
                                                               <Form.Control as="select" name="enabled" placeholder="stato"
                                                                            onChange={(e) => this.handleChange(e)}
                                                                            value={String(this.props.station.enabled)}>
                                                                   <option value="true">Abilitato</option>
                                                                   <option value="false">Non Abilitato</option>
                                                               </Form.Control>
                                                           </Form.Group>

                                                            <Form.Group controlId="version" className="col-md-2">
                                                                <Form.Label>Versione <span className="text-danger">*</span></Form.Label>
                                                                <Form.Control type={"number"} name="version" min={1} max={2}
                                                                            value={this.props.station.version}
                                                                            onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="primitive_version" className="col-md-2">
                                                                <Form.Label>Versione primitive <span className="text-danger">*</span></Form.Label>
                                                                <Form.Control type="number" name="primitive_version" min={1} max={2}
                                                                              value={this.props.station.primitive_version}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>
                                                        </div>
                                                        <div className="row">

                                                            <Form.Group controlId="broker_code" className="col-md-3">
                                                                <Form.Label>Codice Intermediario <span
                                                                        className="text-danger">*</span></Form.Label>
                                                                <AsyncSelect
                                                                        cacheOptions defaultOptions
                                                                        loadOptions={this.debouncedBrokerOptions}
                                                                        placeholder="Cerca codice"
                                                                        menuPortalTarget={document.body}
                                                                        styles={{menuPortal: base => ({...base, zIndex: 9999})}}
                                                                        name="broker_code"
                                                                        value={{label: this.props.station.broker_code, value: this.props.station.broker_code}}
                                                                        onChange={(e) => this.handleBrokerChange(e)}
                                                                />
                                                            </Form.Group>

                                                            <Form.Group controlId="password" className="col-md-4">
                                                                <Form.Label>Password</Form.Label>
                                                                <Form.Control name="password"
                                                                              value={this.props.station.password}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="new_password" className="col-md-4">
                                                                <Form.Label>Nuova Password</Form.Label>
                                                                <Form.Control name="new_password"
                                                                              value={this.props.station.new_password}
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
                                                                              defaultValue={String(this.props.station.protocol)}
                                                                              onChange={(e) => this.handleChange(e)} >
                                                                    <option value="HTTPS">HTTPS</option>
                                                                    <option value="HTTP">HTTP</option>
                                                                </Form.Control>
                                                            </Form.Group>

                                                            <Form.Group controlId="ip" className="col-md-5">
                                                                <Form.Label>IP</Form.Label>
                                                                <Form.Control name="ip"

                                                                              value={this.props.station.ip}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>
                                                        </div>
                                                        <div className="row">
                                                            <Form.Group controlId="port" className="col-md-2">
                                                                <Form.Label>Porta <span className="text-danger">*</span></Form.Label>
                                                                <Form.Control type="number" name="port" min={1} max={65535}
                                                                              value={this.props.station.port}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="service" className="col-md">
                                                                <Form.Label>Servizio</Form.Label>
                                                                <Form.Control name="service"
                                                                              value={this.props.station.service}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>


                                                            <Form.Group controlId="pof_service" className="col-md">
                                                                <Form.Label>Servizio POF</Form.Label>
                                                                <Form.Control name="pof_service"
                                                                              value={this.props.station.pof_service}
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
                                                                <Form.Control name="target_host"
                                                                              value={this.props.station.target_host}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="target_port" className="col-md-2">
                                                                <Form.Label>Porta</Form.Label>
                                                                <Form.Control name="target_port" type="number" min={1} max={65535}
                                                                              value={this.props.station.target_port}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>
                                                            <Form.Group controlId="target_path" className="col-md-5">
                                                                <Form.Label>Servizio</Form.Label>
                                                                <Form.Control name="target_path"
                                                                              value={this.props.station.target_path}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>
                                                        </div>

                                                        <div className={"divider"}></div>
                                                        <h4>Modello 4</h4>
                                                        <div className={"row"}>
                                                            <Form.Group controlId="protocol_4mod" className={"col-md-2"}>
                                                                <Form.Label>Protocollo Modello 4</Form.Label>
                                                                <Form.Control as="select" name="protocol_4mod"
                                                                              defaultValue={String(this.props.station.protocol_4mod)}
                                                                              onChange={(e) => this.handleChange(e)} >
                                                                    <option value="HTTPS">HTTPS</option>
                                                                    <option value="HTTP">HTTP</option>
                                                                </Form.Control>
                                                            </Form.Group>

                                                            <Form.Group controlId="ip_4mod" className="col-md-7">
                                                                <Form.Label>IP Modello 4</Form.Label>
                                                                <Form.Control name="ip_4mod"

                                                                              value={this.props.station.ip_4mod}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="port_4mod" className="col-md-2">
                                                                <Form.Label>Porta Modello 4</Form.Label>
                                                                <Form.Control name="port_4mod" type="number" min={1} max={65535}
                                                                              value={this.props.station.port_4mod}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="service_4mod" className="col-md-7">
                                                                <Form.Label>Servizio Modello 4</Form.Label>
                                                                <Form.Control name="service_4mod"
                                                                              value={this.props.station.service_4mod}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>
                                                        </div>

                                                        <div className={"divider"}></div>
                                                        <h4>Redirect</h4>
                                                        <div className="row">
                                                            <Form.Group controlId="redirect_protocol" className="col-md-2">
                                                                <Form.Label>Protocollo Redirect</Form.Label>
                                                                <Form.Control as="select" name="redirect_protocol"
                                                                              defaultValue={String(this.props.station.redirect_protocol)}
                                                                              onChange={(e) => this.handleChange(e)} >
                                                                    <option value="HTTPS">HTTPS</option>
                                                                    <option value="HTTP">HTTP</option>
                                                                </Form.Control>
                                                            </Form.Group>

                                                            <Form.Group controlId="redirect_ip" className="col-md-7">
                                                                <Form.Label>IP Redirect</Form.Label>
                                                                <Form.Control name="redirect_ip"

                                                                              value={this.props.station.redirect_ip}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>
                                                        </div>
                                                        <div className={"row"}>

                                                            <Form.Group controlId="redirect_port" className="col-md-2">
                                                                <Form.Label>Porta Redirect</Form.Label>
                                                                <Form.Control name="redirect_port" type="number" min={1} max={65535}
                                                                              value={this.props.station.redirect_port}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="redirect_path" className="col-md">
                                                                <Form.Label>Servizio Redirect</Form.Label>
                                                                <Form.Control name="redirect_path"
                                                                              value={this.props.station.redirect_path}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="redirect_query_string" className="col-md-3">
                                                                <Form.Label>Parametri Redirect</Form.Label>
                                                                <Form.Control name="redirect_query_string"
                                                                              value={this.props.station.redirect_query_string}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>
                                                        </div>

                                                        <div className={"divider"}></div>
                                                        <h4>Proxy</h4>
                                                        <div className="row">
                                                            <Form.Group controlId="proxy_enabled" className="col-md-2">
                                                                <Form.Label>Proxy</Form.Label>
                                                                <Form.Control as="select" name="proxy_enabled" placeholder="stato"
                                                                              onChange={(e) => this.handleChange(e)}
                                                                              value={String(this.props.station.proxy_enabled)}>
                                                                    <option value="true">Abilitato</option>
                                                                    <option value="false">Non Abilitato</option>
                                                                </Form.Control>
                                                            </Form.Group>

                                                            <Form.Group controlId="proxy_host" className="col-md-2">
                                                                <Form.Label>Indirizzo Proxy</Form.Label>
                                                                <Form.Control name="proxy_host"
                                                                              value={this.props.station.proxy_host}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="proxy_port" className="col-md-2">
                                                                <Form.Label>Porta Proxy</Form.Label>
                                                                <Form.Control name="proxy_port" type="number" min={1} max={65535}
                                                                              value={this.props.station.proxy_port}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="proxy_username" className="col-md-3">
                                                                <Form.Label>Username Proxy</Form.Label>
                                                                <Form.Control name="proxy_username"
                                                                              value={this.props.station.proxy_username}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="proxy_password" className="col-md-3">
                                                                <Form.Label>Password Proxy</Form.Label>
                                                                <Form.Control name="proxy_password"
                                                                              value={this.props.station.proxy_password}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>
                                                        </div>

                                                        <div className={"divider"}></div>
                                                        <h4>Altre Informazioni</h4>
                                                        <div className="row">

                                                            <Form.Group controlId="flag_online" className="col-md-2">
                                                                <Form.Label>Flag Online</Form.Label>
                                                                <Form.Control as="select" name="flag_online" placeholder="stato"
                                                                              onChange={(e) => this.handleChange(e)}
                                                                              value={String(this.props.station.flag_online)}>
                                                                    <option value="true">Abilitato</option>
                                                                    <option value="false">Non Abilitato</option>
                                                                </Form.Control>
                                                            </Form.Group>

                                                            <Form.Group controlId="invio_rt_istantaneo" className="col-md-2">
                                                                <Form.Label>Invio RT Istantaneo</Form.Label>
                                                                <Form.Control as="select" name="invio_rt_istantaneo" placeholder="stato"
                                                                              onChange={(e) => this.handleChange(e)}
                                                                              value={String(this.props.station.invio_rt_istantaneo)}>
                                                                    <option value="true">Abilitato</option>
                                                                    <option value="false">Non Abilitato</option>
                                                                </Form.Control>
                                                            </Form.Group>

                                                            <Form.Group controlId="thread_number" className="col-md-2">
                                                                <Form.Label>Numero Thread <span
                                                                        className="text-danger">*</span></Form.Label>
                                                                <Form.Control type="number" name="thread_number" min={1}
                                                                              value={this.props.station.thread_number}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="timeout_a" className="col-md-2">
                                                                <Form.Label>Timeout A <span className="text-danger">*</span></Form.Label>
                                                                <Form.Control type="number" name="timeout_a" min={0}
                                                                              value={this.props.station.timeout_a}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="timeout_b" className="col-md-2">
                                                                <Form.Label>Timeout B <span className="text-danger">*</span></Form.Label>
                                                                <Form.Control type="number" name="timeout_b" min={0}
                                                                              value={this.props.station.timeout_b}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                            <Form.Group controlId="timeout_c" className="col-md-2">
                                                                <Form.Label>Timeout C <span className="text-danger">*</span></Form.Label>
                                                                <Form.Control type="number" name="timeout_c" min={0}
                                                                              value={this.props.station.timeout_c}
                                                                              onChange={(e) => this.handleChange(e)}/>
                                                            </Form.Group>

                                                        </div>

                                                    </Card.Body>
                                                    <Card.Footer>
                                                        <div className="row">
                                                            <div className="col-md-12">
                                                                <Button className="ml-2 float-md-right" variant="secondary"
                                                                        onClick={() => {
                                                                            this.discard();
                                                                        }}>Annulla</Button>
                                                                <Button className="float-md-right" onClick={() => { this.validData() &&
                                                                    this.props.saveStation();
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
                    <ConfirmationModal show={this.props.showModal} handleClose={this.hideModal}>
                        <p>Sei sicuro di voler annullare le modifiche?</p>
                    </ConfirmationModal>
                </div>
        );
    }
}
