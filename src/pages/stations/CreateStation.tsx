import React from "react";
// import {Breadcrumb, Button, Card, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
// import AsyncSelect from "react-select/async";
// import debounce from "lodash.debounce";
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
    isError: boolean;
}

export default class CreateStation extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/stations";
    constructor(props: IProps) {
        super(props);

        this.state = {
            code: "",
            isLoading: false,
            isError: false,
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
                flag_standin: false,
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
                target_path: "",
                primitive_version: 1
            } as unknown as StationDetails,
            showModal: false
        };

        this.save = this.save.bind(this);
        this.setStation = this.setStation.bind(this);
        this.setModal = this.setModal.bind(this);
    }

    setStation(station: StationDetails): void {
        this.setState({ station });
    }

    setModal(modal: boolean): void{
        this.setState({showModal: modal});
    }

    componentDidMount(): void {
        const code = new URLSearchParams(this.props.location.search).get("clone") as string;
        if (code) {
            this.setState({code, isLoading: true});
            getStation(this.context, code).then((data: any) => {
                const station = {...data, station_code: ""} as StationDetails;
                this.setStation(station);
                this.setState({isError: false});      
            }).catch(() => {
                this.setState({isError: true});
            }).finally(() => this.setState({ isLoading: false }));
        }
        else {
            this.setState({ isLoading: false });
            this.setState({isError: false});
        }
    }

    goBack(): void {
        this.props.history.push(this.service);
    }

    save() {

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

    render(): React.ReactNode {
        return (
            <StationView station={this.state.station} 
            setStation={this.setStation} 
            saveStation={this.save}
            isLoading={this.state.isLoading} 
            isError={this.state.isError}
            setShowModal={this.setModal}
            showModal={this.state.showModal}
            history={this.props.history}
            readOnly={false}
            getCiList={() => void 0}/>
        );
    }
}
