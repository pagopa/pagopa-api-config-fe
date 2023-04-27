import React from 'react';
import {Button, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
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
import debounce from "lodash.debounce";
import AsyncSelect from 'react-select/async';
import {getConfig} from "../../util/config";
import FiltersView from '../../components/FiltersView';

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    creditor_institution_list: any;
    page_info: {
        page: 0;
        limit: 50;
        items_found: 0;
        total_pages: 1;
    };
    filters: {
        aux_digit?: number;
        application_code?: number;
        segregation_code?: number;
    };
    isLoading: boolean;
    showDeleteModal: boolean;
    stationToDelete: any;
    stationIndex: number;
    order: any;
    stationList: [];
    stationFilter: string;
    creditorInstitutionList: [];
    creditorInstitutionFilter: string;
    brokerList: [];
    brokerFilter: string;
    mod4Filter?: boolean;
}

export default class CreditorInstitutionView extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: { [item: string]: any };

    service = "/views";

    constructor(props: IProps) {
        super(props);

        this.state = {
            creditor_institution_list: [],
            page_info: {
                page: 0,
                limit: 50,
                items_found: 0,
                total_pages: 1
            },
            isLoading: false,
            showDeleteModal: false,
            stationToDelete: {},
            stationIndex: -1,
            order: {
                by: "CODE",
                ing: "DESC"
            },
            filters: {
                aux_digit: undefined,
                application_code: undefined,
                segregation_code: undefined,
            },
            stationList: [],
            stationFilter: "",
            creditorInstitutionList: [],
            creditorInstitutionFilter: "",
            brokerList: [],
            brokerFilter: "",
            mod4Filter: undefined,
        };

        this.filter = {
            aux_digit: {
                visible: true,
                placeholder: "AUX digit"
            },
            application_code: {
                visible: true,
                placeholder: "Progressivo"
            },
            segregation_code: {
                visible: true,
                placeholder: "Segregazione"
            }
        };

        this.handleOrder = this.handleOrder.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.create = this.create.bind(this);
        this.download = this.download.bind(this);
        this.debouncedStationOptions = this.debouncedStationOptions.bind(this);
        this.debouncedCreditorInstitutionsOptions = this.debouncedCreditorInstitutionsOptions.bind(this);
    }

    getPage(page: number) {
        this.setState({isLoading: true});

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getCreditorInstitutionsView({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    limit: 10,
                    page,
                    creditorInstitutionCode: this.state.creditorInstitutionFilter,
                    paBrokerCode: this.state.brokerFilter,
                    stationCode: this.state.stationFilter,
                    auxDigit: this.state.filters.aux_digit,
                    applicationCode: this.state.filters.application_code,
                    segregationCode: this.state.filters.segregation_code,
                    mod4: this.state.mod4Filter
                }).then((response: any) => {
                    this.setState({
                        creditor_institution_list: response.right.value.creditor_institutions,
                        page_info: response.right.value.page_info
                    });
                })
                    .catch(() => {
                        toast.error("Problema nel recuperare le stazioni", {theme: "colored"});
                    })
                    .finally(() => {
                        this.setState({isLoading: false});
                    });
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
        }).then((response: any) => {
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
    //     const filteredStations = this.state.stations.filter((item: any) => item.station_code !== this.state.stationToDelete.station_code);
    //     this.setState({stations: filteredStations});

    //     if (filteredStations.length === 0 && this.state.page_info.total_pages > 1) {
    //         this.getPage(0);
    //     }
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

    handleStationChange(event: any){
        this.setState({stationFilter: event.value.code});
        this.getPage(0);
    }

    handleCreditorInstitutionChange(event: any){
        this.setState({creditorInstitutionFilter: event.value.code});
        this.getPage(0);
    }

    handleBrokerChange(event: any){
        this.setState({brokerFilter: event.value.code});
        this.getPage(0);
    }

    handleMod4Change(event: any){
        if(event.target.value === ""){
            this.setState({mod4Filter: undefined});
        }
        else{
            this.setState({mod4Filter: event.target.value === "true"})
        }
        this.getPage(0);
    }

    debouncedStationOptions = debounce((inputValue, callback) => {
        this.promiseStationOptions(inputValue, callback);
    }, 500);

    promiseStationOptions(inputValue: string, callback: any) {
        const limit = inputValue.length === 0 ? 10 : 99999;
        const code = inputValue.length === 0 ? "" : inputValue;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getStations({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page: 0,
                    limit,
                    code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const alreadyAssignedStationIds = this.state.stationList.map((station: any) => station.station_code);
                        const items: Array<any> = [];
                        resp.right.value.stations.filter((retrievedStation: any) => alreadyAssignedStationIds.indexOf(retrievedStation.station_code) === -1)
                            .forEach((retrievedStation: any) => {                            
                                // eslint-disable-next-line functional/immutable-data
                                items.push({
                                    value: {code: retrievedStation.station_code, version: retrievedStation.version},
                                    label: retrievedStation.station_code,
                                });    
                            });
                        items.push({
                            value: "",
                            label: "-"
                        })
                        callback(items);
                    }
                    else {
                        callback([]);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    callback([]);
                });
            });
    }

    debouncedCreditorInstitutionsOptions = debounce((inputValue, callback) => {
        this.promiseCreditorInstitutionsOptions(inputValue, callback);
    }, 500);

    promiseCreditorInstitutionsOptions(inputValue: string, callback: any) {
        const limit = inputValue.length === 0 ? 10 : 99999;
        const code = inputValue.length === 0 ? "" : inputValue;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getCreditorInstitutions({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page: 0,
                    limit,
                    code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const alreadyAssignedECIds = this.state.creditorInstitutionList.map((ec: any) => ec.creditor_institution_code);
                        const items: Array<any> = [];
                        resp.right.value.creditor_institutions.filter((retrievedEC: any) => alreadyAssignedECIds.indexOf(retrievedEC.creditor_institution_code) === -1)
                            .forEach((retrievedEC: any) => {                            
                                // eslint-disable-next-line functional/immutable-data
                                items.push({
                                    value: {code: retrievedEC.creditor_institution_code, version: retrievedEC.version},
                                    label: retrievedEC.creditor_institution_code,
                                });    
                            });
                        items.push({
                            value: "",
                            label: "-"
                        })
                        callback(items);
                    }
                    else {
                        callback([]);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    callback([]);
                });
            });
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
                        const alreadyAssignedBrokerIds = this.state.brokerList.map((broker: any) => broker.broker_code);
                        const items: Array<any> = [];
                        resp.right.value.brokers.filter((retrievedBroker: any) => alreadyAssignedBrokerIds.indexOf(retrievedBroker.broker_code) === -1)
                            .forEach((retrievedBroker: any) => {                            
                                // eslint-disable-next-line functional/immutable-data
                                items.push({
                                    value: {code: retrievedBroker.broker_code, version: retrievedBroker.version},
                                    label: retrievedBroker.broker_code,
                                });    
                            });
                        items.push({
                            value: "",
                            label: "-"
                        })
                        callback(items);
                    }
                    else {
                        callback([]);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    callback([]);
                });
            });
    }


    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const pageInfo = this.state.page_info;
        const showDeleteModal = this.state.showDeleteModal;
        const creditorInstitutionList: any = [];
        const stationToDeleteCode = this.state.stationToDelete.station_code;

        this.state.creditor_institution_list.map((creditorInstitutionView: any, index: number) => {
            const code = (
                <tr key={index}>
                    <td>{creditorInstitutionView.creditor_institution_code}</td>
                    <td>{creditorInstitutionView.broker_code}</td>
                    <td>{creditorInstitutionView.station_code}</td>
                    <td>{creditorInstitutionView.auxDigit}</td>
                    <td>{creditorInstitutionView.application_code}</td>
                    <td>{creditorInstitutionView.segregation_code}</td>
                    <td className="text-center">
                        {creditorInstitutionView.mod4 && <FaCheck className="text-success"/>}
                        {!creditorInstitutionView.mod4 && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-right">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-details-${index}`}>Visualizza</Tooltip>}>
                            <FaEye role="button" className="mr-3"
                                   onClick={() => this.handleDetails(creditorInstitutionView.station_code)}/>
                        </OverlayTrigger>
                        {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                            {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                            <FaEdit role="button" className="mr-3"
                                    onClick={() => this.handleEdit(creditorInstitutionView.station_code)}/>
                        </OverlayTrigger>
                        {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-clone-${index}`}>Clona</Tooltip>}>
                            {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                            <FaClone role="button" className="mr-3"
                                     onClick={() => this.handleClone(creditorInstitutionView.station_code)}/>
                        </OverlayTrigger>
                        {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                            {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                            <FaTrash role="button" className="mr-3" onClick={() => this.handleDelete(creditorInstitutionView, index)}/>
                        </OverlayTrigger>
                    </td>
                </tr>
            );
            creditorInstitutionList.push(code);
        });

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-9 mb-3">
                        <h2>Vista enti creditori</h2>
                    </div>
                    {<div className="col-md-12">
                        <div className="col-md-12">
                            <AsyncSelect
                                    cacheOptions defaultOptions
                                    loadOptions={this.debouncedStationOptions}
                                    placeholder="Cerca codice stazione"
									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
									name="station_code"
                                    onChange={(e) => this.handleStationChange(e)}
                            />
                            <AsyncSelect
                                    cacheOptions defaultOptions
                                    loadOptions={this.debouncedCreditorInstitutionsOptions}
                                    placeholder="Cerca codice EC"
									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
									name="creditor_institution_code"
                                    onChange={(e) => this.handleCreditorInstitutionChange(e)}
                            />
                            <AsyncSelect
                                    cacheOptions defaultOptions
                                    loadOptions={this.debouncedBrokerOptions}
                                    placeholder="Cerca codice Intermediario EC"
									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
									name="broker_code"
                                    onChange={(e) => this.handleBrokerChange(e)}
                            />
                        </div>
                        <div className="col-md-12">
                            <FiltersView configuration={this.filter} onFilter={this.handleFilterCallback} />
                        </div>
                        <Form.Group controlId="mod4" className="col-md-2">
                            <Form.Label>Mod4<span
                                className="text-danger">*</span></Form.Label>
                            <Form.Control as="select" name="mod4"
                                          onChange={(e) => this.handleMod4Change(e)}>
                                <option value="true">True</option>
                                <option value="false">False</option>
                                <option value="">-</option>
                            </Form.Control>
                        </Form.Group>
                        {isLoading && (<FaSpinner className="spinner"/>)}
                        {
                            !isLoading && (
                                <>
                                    <Table hover responsive size="sm">
                                        <thead>
                                        <tr>
                                            <th className="fixed-td-width">Pa</th>
                                            <th className="fixed-td-width">Intermediario</th>
                                            <th className="fixed-td-width">Stazione</th>
                                            <th className="text-center">AUX digit</th>
                                            <th className="text-center">Progressivo</th>
                                            <th className="text-right">Codice segregazione</th>
                                            <th className="text-center">Quarto modello</th>
                                            <th/>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {creditorInstitutionList}
                                        </tbody>
                                    </Table>

                                    <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange}/>
                                </>
                            )
                        }
                    </div>}
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
