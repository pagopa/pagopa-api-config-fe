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
        this.setStation = this.setStation.bind(this);
        this.setModal = this.setModal.bind(this);
    }

    setStation(station: StationDetails): void {
        this.setState({ station });
    }

    setModal(modal: boolean): void{
        this.setState({showModal: modal})
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({code: code, isLoading: true});
        getStation(this.context, code).then((data: any) => {
            const station = {...data, station_code: code} as StationDetails;
            this.setStation(station);
            this.setState({isError: false});      
        }).catch((error) => {
            console.log("TODO ERROR IN CREATE", error);
            this.setState({isError: true});
        }).finally(() => this.setState({ isLoading: false }));
    }

    goBack(): void {
        this.props.history.push(this.service);
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
                        this.setStation(response.right.value);
                        this.setState({stationName: response.right.value.station_code});
                        setTimeout(this.goBack.bind(this), 2000);
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
    
    render(): React.ReactNode {
        return (
            <StationView station={this.state.station} 
            setStation={this.setStation} 
            saveStation={this.saveStation}
            isLoading={this.state.isLoading} 
            isError={this.state.isError}
            showModal={this.state.showModal}
            setShowModal={this.setModal}
            history={this.props.history}
            readOnly={false}
            getCiList={() => void 0}/>
        );
    }
}
