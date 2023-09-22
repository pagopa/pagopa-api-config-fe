import React from 'react';
import {Button, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaClone, FaCheck, FaEdit, FaEye, FaFileDownload, FaPlus, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import axios, {AxiosRequestConfig} from "axios";
import {apiClient} from "../../util/apiClient";
import Paginator from "../../components/Paginator";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import Filters from "../../components/Filters";
import Ordering from "../../components/Ordering";
import {getConfig} from "../../util/config";

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    stations: any;
    page_info: {
        page: 0;
        limit: 50;
        items_found: 0;
        total_pages: 1;
    };
    filters: {
        code: string;
        name: string;
    };
    isLoading: boolean;
    showDeleteModal: boolean;
    stationToDelete: any;
    stationIndex: number;
    order: any;
}

export default class Stations extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: { [item: string]: any };

    service = "/stations";

    constructor(props: IProps) {
        super(props);

        this.state = {
            stations: [],
            page_info: {
                page: 0,
                limit: 50,
                items_found: 0,
                total_pages: 1
            },
            filters: {
                code: "",
                name: "",
            },
            isLoading: false,
            showDeleteModal: false,
            stationToDelete: {},
            stationIndex: -1,
            order: {
                by: "CODE",
                ing: "DESC"
            }
        };

        this.filter = {
            name: {
                visible: true,
                placeholder: "Descrizione Intermediario EC"
            },
            code: {
                visible: true,
                placeholder: "Codice"
            }
        };

        this.handleOrder = this.handleOrder.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.create = this.create.bind(this);
        this.download = this.download.bind(this);
    }

    getPage(page: number) {
        this.setState({isLoading: true});

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
                .then((response: any) => {
                    apiClient.getStations({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        limit: 10,
                        page,
                        code: this.state.filters.code,
                        brokerdescription: this.state.filters.name,
                        ordering: this.state.order.ing
                    }).then((response: any) => {
                        this.setState({
                            stations: response.right.value.stations,
                            page_info: response.right.value.page_info
                        });
                    })
                            .catch(() => {
                                toast.error("Problema nel recuperare le stazioni", {theme: "colored"});
                            })
                            .finally(() => {
                                this.setState({isLoading: false});
                            });
                })
                .catch(() => {
                    this.context.instance.logoutPopup({
                        postLogoutRedirectUri: "/",
                        mainWindowRedirectUri: "/"
                    }).then(() => window.sessionStorage.removeItem("secret"));
                });

    }

    componentDidMount(): void {
        this.getPage(0);
    }

    create() {
        this.props.history.push(this.service + "/create");
    }

    download() {
        const baseUrl = getConfig("APICONFIG_HOST") as string;
        const basePath = getConfig("APICONFIG_BASEPATH") as string;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
                .then((response: any) => {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${response.idToken}`
                        },
                        responseType: 'blob'
                    } as AxiosRequestConfig;
                    const anchor = document.createElement("a");
                    document.body.appendChild(anchor);
                    const url = `${String(baseUrl)}${String(basePath)}${this.service}/csv`;
                    axios.get(url, config)
                            .then((res: any) => {
                                if (res.data.size > 1) {
                                    const objectUrl = window.URL.createObjectURL(res.data);
                                    // eslint-disable-next-line functional/immutable-data
                                    anchor.href = objectUrl;
                                    // eslint-disable-next-line functional/immutable-data
                                    anchor.download = `${this.service.substring(1)}.csv`;
                                    anchor.click();
                                    window.URL.revokeObjectURL(objectUrl);
                                } else {
                                    toast.warn("Problemi nella generazione del CSV richiesto.", {theme: "colored"});
                                }
                            })
                            .catch(() => {
                                toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                            });
                })
                // eslint-disable-next-line sonarjs/no-identical-functions
                .catch(() => {
                    this.context.instance.logoutPopup({
                        postLogoutRedirectUri: "/",
                        mainWindowRedirectUri: "/"
                    }).then(() => window.sessionStorage.removeItem("secret"));
                });
    }

    handlePageChange(requestedPage: number) {
        this.getPage(requestedPage);
    }

    handleDetails(code: string) {
        this.props.history.push(this.service + "/" + code);
    }

    handleClone(code: string) {
        this.props.history.push(this.service + "/create?clone=" + code);
    }

    handleEdit(code: string) {
        this.props.history.push(this.service + "/" + code + "?edit");
    }

    handleDelete(station: string, index: number) {
        this.setState({showDeleteModal: true});
        this.setState({stationToDelete: station});
        this.setState({stationIndex: index});
    }

    removeStation() {
        const filteredStations = this.state.stations.filter((item: any) => item.station_code !== this.state.stationToDelete.station_code);
        this.setState({stations: filteredStations});

        if (filteredStations.length === 0 && this.state.page_info.total_pages > 1) {
            this.getPage(0);
        }
    }

    hideDeleteModal = (status: string) => {
        if (status === "ok") {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                    .then((response: any) => {
                        apiClient.deleteStation({
                            Authorization: `Bearer ${response.idToken}`,
                            ApiKey: "",
                            stationcode: this.state.stationToDelete.station_code
                        })
                                .then((res: any) => {
                                    if (res.right.status === 200) {
                                        toast.info("Rimozione avvenuta con successo");
                                        this.removeStation();
                                    } else {
                                        this.toastError(res.right.value.detail);
                                    }
                                })
                                .catch(() => {
                                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                                });
                        // eslint-disable-next-line sonarjs/no-identical-functions
                    }).catch(() => {
                this.context.instance.logoutPopup({
                    postLogoutRedirectUri: "/",
                    mainWindowRedirectUri: "/"
                }).then(() => window.sessionStorage.removeItem("secret"));
            });
        }
        this.setState({showDeleteModal: false});
    };

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    handleFilterCallback = (filters: any) => {
        this.setState({filters});
        this.getPage(0);
    };

    handleOrder(orderBy: string, ordering: string) {
        this.setState({
            order: {
                by: orderBy,
                ing: ordering
            }
        });
        this.getPage(0);
    }

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const pageInfo = this.state.page_info;
        const showDeleteModal = this.state.showDeleteModal;
        const stationList: any = [];
        const stationToDeleteCode = this.state.stationToDelete.station_code;

        this.state.stations.map((station: any, index: number) => {
            const code = (
                    <tr key={index}>
                        <td>{station.broker_description}</td>
                        <td>{station.station_code}</td>
                        <td className="text-center">
                            {station.enabled && <FaCheck className="text-success"/>}
                            {!station.enabled && <FaTimes className="text-danger"/>}
                        </td>
                        <td className="text-center">{station.version}</td>
                        <td className="text-right">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-details-${index}`}>Visualizza</Tooltip>}>
                                <FaEye role="button" className="mr-3"
                                       onClick={() => this.handleDetails(station.station_code)}/>
                            </OverlayTrigger>
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                                {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                                <FaEdit role="button" className="mr-3"
                                        onClick={() => this.handleEdit(station.station_code)}/>
                            </OverlayTrigger>
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-clone-${index}`}>Clona</Tooltip>}>
                                {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                                <FaClone role="button" className="mr-3"
                                         onClick={() => this.handleClone(station.station_code)}/>
                            </OverlayTrigger>
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                                <FaTrash role="button" className="mr-3"
                                         onClick={() => this.handleDelete(station, index)}/>
                            </OverlayTrigger>
                        </td>
                    </tr>
            );
            stationList.push(code);
        });

        return (
                <div className="container-fluid creditor-institutions">
                    <div className="row">
                        <div className="col-md-9 mb-3">
                            <h2>Stazioni</h2>
                        </div>
                        <div className="col-md-12">
                            <div className="row">
                                <div className="col-md-9">
                                    <Filters configuration={this.filter} onFilter={this.handleFilterCallback}/>
                                </div>
                                <div className="col-md-3 text-right">
                                    <OverlayTrigger placement="bottom"
                                                    overlay={<Tooltip id={`tooltip-download`}>Esporta
                                                        tabella</Tooltip>}>
                                        <Button className="mr-1"
                                                onClick={this.download}>Export <FaFileDownload/></Button>
                                    </OverlayTrigger>
                                    <OverlayTrigger placement="bottom"
                                                    overlay={<Tooltip id={`tooltip-new`}>Crea nuova stazione</Tooltip>}>
                                        <Button onClick={this.create}>Nuovo <FaPlus/></Button>
                                    </OverlayTrigger>
                                </div>
                            </div>
                            {isLoading && (<FaSpinner className="spinner"/>)}
                            {
                                    !isLoading && (
                                            <>
                                                <Table hover responsive size="sm">
                                                    <thead>
                                                    <tr>
                                                        <th className="fixed-td-width">Descrizione Intermediario EC</th>
                                                        <th className="fixed-td-width">
                                                            <Ordering currentOrderBy={this.state.order.by}
                                                                      currentOrdering={this.state.order.ing} orderBy={"CODE"}
                                                                      ordering={"DESC"} handleOrder={this.handleOrder}/>
                                                            Codice
                                                        </th>
                                                        <th className="text-center">Abilitato</th>
                                                        <th className="text-center">Versione</th>
                                                        <th/>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {stationList}
                                                    </tbody>
                                                </Table>

                                                <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange}/>
                                            </>
                                    )
                            }
                        </div>
                    </div>
                    <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                        <p>Sei sicuro di voler eliminare la seguente stazione?</p>
                        <ul>
                            <li>{stationToDeleteCode}</li>
                        </ul>
                    </ConfirmationModal>

                </div>
        );
    }
}
