import React from "react";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
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
    isError: boolean;
    isLoading: boolean;
    backup: any;
    stationName: string;
    code: string;

    station: StationDetails;
    edit: boolean;
    showModal: boolean;
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
            edit: false,
            showModal: false
        };

        this.saveStation = this.saveStation.bind(this);
        this.discard = this.discard.bind(this);
        this.setStation = this.setStation.bind(this);
        this.hideModal = this.hideModal.bind(this);

    }

    setStation(station: StationDetails): void {
        this.setState({ station });
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({code: code, isLoading: true});
        getStation(this.context, code).then((data: any) => {
            const station = {...data, station_code: code} as StationDetails;
            console.warn(station);
            this.setStation(station);
            this.setState({isError: false});      
        }).catch((error) => {
            console.log("TODO ERROR IN CREATE", error);
            this.setState({isError: true});
        }).finally(() => this.setState({ isLoading: false }));
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

    hideModal(status: string): void {
        if (status === "ok") {
            this.props.history.push(this.service);
        }
        this.setState({showModal: false});
    }

    saveStation() {
        if (this.isNotValidPort(this.state.station.port) || this.isNotValidPort(this.state.station.port_4mod as number)
                || this.isNotValidPort(this.state.station.proxy_port as number)
                || this.isNotValidPort(this.state.station.redirect_port as number)) {
            this.toastError("La porta deve avere un valore compreso tra 1 e 65535.");
            return;
        }
        if (this.isNotValidThread(this.state.station.thread_number)){
            this.toastError("Il numero di thread deve essere un valore maggiore di 0.");
            return;
        }

        if (this.isNotValidTimeout(this.state.station.timeout_a)
                || this.isNotValidTimeout(this.state.station.timeout_b) || this.isNotValidTimeout(this.state.station.timeout_c)) {
            this.toastError("I timeout devono avere un valore maggiore o uguale a 0.");
            return;
        }

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
                        this.setStation(response.right.value);
                        this.setState({stationName: response.right.value.station_code});
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

    discard() {
        this.setState({showModal: true});
    }
    
    render(): React.ReactNode {
        return (
            <StationView station={this.state.station} 
            setStation={this.setStation} 
            isLoading={this.state.isLoading} 
            discard={this.discard} 
            saveStation={this.saveStation}
            showModal={this.state.showModal}
            hideModal={this.hideModal}/>
        );
    }

}
