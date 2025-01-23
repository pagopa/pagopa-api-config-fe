import React from "react";
import {Alert, Card, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaCloudDownloadAlt, FaEye, FaInfoCircle, FaTimes} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import axios, {AxiosRequestConfig} from "axios";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {StationDetails} from "../../../generated/api/StationDetails";
import Paginator from "../../components/Paginator";
import {getConfig} from "../../util/config";
import {getStation} from "./Services";
import StationView from "./StationView";

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

        this.setStation = this.setStation.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.getStationCI = this.getStationCI.bind(this);
        this.getCIElement = this.getCIElement.bind(this);
    }

    setStation(station: StationDetails): void {
        this.setState({ station });
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({code, isLoading: true});
        getStation(this.context, code).then((data: any) => {
            const station = {...data, station_code: code} as StationDetails;
            this.setStation(station);
            this.getStationCI(code, 0);
            this.setState({isError: false});      
        }).catch(() => {
            this.setState({isError: true});
        }).finally(() => this.setState({ isLoading: false }));
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
                    <td className="text-center">{item.aux_digit}</td>
                    <td className="text-center">{item.application_code}</td>
                    <td className="text-center">{item.segregation_code}</td>
                    <td className="text-center">
                        {item.mod4 && <FaCheck className="text-success"/>}
                        {!item.mod4 && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-center">
                        {item.broadcast && <FaCheck className="text-success"/>}
                        {!item.broadcast && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-center">
                        {item.aca && <FaCheck className="text-success"/>}
                        {!item.aca && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-center">
                        {item.stand_in && <FaCheck className="text-success"/>}
                        {!item.stand_in && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-center">
                        {item.spontaneous_payment && <FaCheck className="text-success"/>}
                        {!item.spontaneous_payment && <FaTimes className="text-danger"/>}
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
                    } else {
                        toast.warn("Problemi nella generazione del file CSV richiesto.", {theme: "colored"});
                    }
                })
                .catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });
        });
    }

    getCIElement() {
        const ciList = this.getCIList();
        return <div className="col-md-12">
            <Card>
                <Card.Header>
                    <div className={"d-flex justify-content-between align-items-center"}>
                        <h5>Enti Creditori</h5>
                        {Object.keys(ciList).length > 0 &&
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
                                <th className="text-center">Aux Digit</th>
                                <th className="text-center">Application Code</th>
                                <th className="text-center">Segregation Code</th>
                                <th className="text-center">Modello 4</th>
                                <th className="text-center">Broadcast</th>
                                <th className="text-center">ACA</th>
                                <th className="text-center">Stand In</th>
                                <th className="text-center">Pagamento spontaneo</th>
                                <th className="text-center"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {ciList}
                            </tbody>
                        </Table>
                    }
                    {
                        Object.keys(ciList).length > 0 && this.state.ci.page_info &&
                        <Paginator pageInfo={this.state.ci.page_info}
                                   onPageChanged={this.handlePageChange}/>
                    }
                </Card.Body>
            </Card>
        </div>;
    }

    render(): React.ReactNode {
        return (
            <StationView
                    station={this.state.station}
                    setStation={this.setStation}
                    isLoading={this.state.isLoading}
                    isError={this.state.isError}
                    history={this.props.history}
                    readOnly={true}
                    getCiList={this.getCIElement}
                    showModal={false}
            />
        );
    }
}
