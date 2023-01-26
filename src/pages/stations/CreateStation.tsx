import React from "react";
// import {Breadcrumb, Button, Card, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
// import AsyncSelect from "react-select/async";
import debounce from "lodash.debounce";
// import {FaInfoCircle} from "react-icons/fa";
import {apiClient} from "../../util/apiClient";
// import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import {StationDetails} from "../../../generated/api/StationDetails";
import StationView from "./StationView";
import {getStation} from "./Services";


interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };

    location?: any;
}

interface IState {
    code: string;
    isLoading: boolean;
    station: StationDetails;
    showModal: boolean;
}

export default class CreateStation extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/stations";
    constructor(props: IProps) {
        super(props);

        this.state = {
            code: "",
            isLoading: false,
            station: {
                broker_code: "",
                enabled: false,
                ip: "",
                password: "",
                port: 443,
                protocol: "HTTPS",
                service: "",
                station_code: "",
                thread_number: 1,
                timeout_a: 15,
                timeout_b: 30,
                timeout_c: 120,
                version: 1,
                flag_online: false,
                invio_rt_istantaneo: false,
                ip_4mod: false,
                new_password: "",
                port_4mod: 0,
                protocol_4mod: "HTTPS",
                proxy_enabled: false,
                proxy_host: "",
                proxy_password: "",
                proxy_port: 0,
                proxy_username: "",
                redirect_ip: "",
                redirect_path: "",
                redirect_port: 0,
                redirect_protocol: "HTTPS",
                redirect_query_string: "",
                service_4mod: "",
                target_host: "",
                target_port: 443,
                target_path: ""
            } as unknown as StationDetails,
            showModal: false
        };

        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.debouncedBrokerOptions = this.debouncedBrokerOptions.bind(this);
        this.setStation = this.setStation.bind(this);
    }

    setStation(station: StationDetails): void {
        this.setState({ station });
    }

    componentDidMount(): void {
        const code = new URLSearchParams(this.props.location.search).get("clone") as string;
        if (code) {
            this.setState({code, isLoading: true});

            getStation(this.context, code).then((data: any) => {
                const station = {...data, station_code: ""} as StationDetails;
                this.setStation(station);
            }).catch((error) => {
                console.log("TODO ERROR IN CREATE", error);
            }).finally(() => this.setState({isLoading: false}));
        }
        else {
            this.setState({isLoading: false});
        }
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let station: StationDetails = this.state.station;
        const key = event.target.name as string;
        // eslint-disable-next-line functional/no-let
        let value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        if (value === 'null') {
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
        if (this.isNotValidPort(this.state.station.port) || this.isNotValidPort(this.state.station.port_4mod as number)
            || this.isNotValidPort(this.state.station.proxy_port as number)
            || this.isNotValidPort(this.state.station.redirect_port as number)) {
            this.toastError("La porta deve avere un valore compreso tra 1 e 65535.");
            return false;
        }
        if (this.isNotValidThread(this.state.station.thread_number)) {
            this.toastError("Il numero di thread deve essere un valore maggiore di 0.");
            return false;
        }

        if (this.isNotValidTimeout(this.state.station.timeout_a)
            || this.isNotValidTimeout(this.state.station.timeout_b) || this.isNotValidTimeout(this.state.station.timeout_c)) {
            this.toastError("I timeout devono avere un valore maggiore o uguale a 0.");
            return false;
        }
        return true;
    }

    save() {
        if (!this.validData()) {
            return;
        }

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createStation({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    body: this.state.station
                }).then((response: any) => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (response.hasOwnProperty("right")) {
                        if (response.right.status === 201) {
                            // eslint-disable-next-line no-console
                            toast.info("Creazione avvenuta con successo.");
                            setTimeout(this.goBack.bind(this), 2000);
                        } else {
                            const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
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

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
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
        return (
            <StationView station={this.state.station} setStation={this.setStation} isLoading={this.state.isLoading} />
        );
    }
}
