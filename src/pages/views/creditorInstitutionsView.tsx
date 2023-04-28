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
    auxDigitFilter?: number;
    segregationCodeFilter?: number;
    applicationCodeFilter?: number;
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
            auxDigitFilter: undefined,
            segregationCodeFilter: undefined,
            applicationCodeFilter: undefined,
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
        this.debouncedStationOptions = this.debouncedStationOptions.bind(this);
        this.debouncedCreditorInstitutionsOptions = this.debouncedCreditorInstitutionsOptions.bind(this);
        this.debouncedBrokerOptions = this.debouncedBrokerOptions.bind(this);
        this.handleStationChange = this.handleStationChange.bind(this);
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
                    auxDigit: this.state.auxDigitFilter,
                    applicationCode: this.state.applicationCodeFilter,
                    segregationCode: this.state.segregationCodeFilter,
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


    handlePageChange(requestedPage: number) {
        this.getPage(requestedPage);
    }

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
    }

    handleCreditorInstitutionChange(event: any){
        this.setState({creditorInstitutionFilter: event.value.code});
    }

    handleBrokerChange(event: any){
        this.setState({brokerFilter: event.value.code});
    }

    handleAuxDigitChange(event: any){
        if(event.target.value === "1" || event.target.value === "2"){
            this.setState({auxDigitFilter: event.target.value})
        }
        else{
            this.setState({auxDigitFilter: undefined})
        }
    }

    handleSegregationCodeChange(event: any){
        this.setState({segregationCodeFilter: event.target.value});
    }

    handleApplicationCodeChange(event: any){
        this.setState({applicationCodeFilter: event.target.value});
    }

    handleMod4Change(event: any){
        this.setState({mod4Filter: event.target.value === "true"})
    }

    handleSearch(){
        this.getPage(0);
    }

    handleReset(){
        window.location.reload();
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
                        items.push({
                            value: "",
                            label: "-"
                        });
                        resp.right.value.stations.filter((retrievedStation: any) => alreadyAssignedStationIds.indexOf(retrievedStation.station_code) === -1)
                            .forEach((retrievedStation: any) => {                            
                                // eslint-disable-next-line functional/immutable-data
                                items.push({
                                    value: {code: retrievedStation.station_code, version: retrievedStation.version},
                                    label: retrievedStation.station_code,
                                });    
                            });
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
                        items.push({
                            value: "",
                            label: "-"
                        });
                        resp.right.value.creditor_institutions.filter((retrievedEC: any) => alreadyAssignedECIds.indexOf(retrievedEC.creditor_institution_code) === -1)
                            .forEach((retrievedEC: any) => {                            
                                // eslint-disable-next-line functional/immutable-data
                                items.push({
                                    value: {code: retrievedEC.creditor_institution_code, version: retrievedEC.version},
                                    label: retrievedEC.creditor_institution_code,
                                });    
                            });
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
                        items.push({
                            value: "",
                            label: "-"
                        });
                        resp.right.value.brokers.filter((retrievedBroker: any) => alreadyAssignedBrokerIds.indexOf(retrievedBroker.broker_code) === -1)
                            .forEach((retrievedBroker: any) => {                            
                                // eslint-disable-next-line functional/immutable-data
                                items.push({
                                    value: {code: retrievedBroker.broker_code, version: retrievedBroker.version},
                                    label: retrievedBroker.broker_code,
                                });    
                            });
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
        const creditorInstitutionList: any = [];

        this.state.creditor_institution_list.map((creditorInstitutionView: any, index: number) => {
            const code = (
                <tr key={index}>
                    <td>{creditorInstitutionView.creditor_institution_code}</td>
                    <td>{creditorInstitutionView.broker_code}</td>
                    <td>{creditorInstitutionView.station_code}</td>
                    <td className="text-center">{creditorInstitutionView.auxDigit}</td>
                    <td className="text-center">{creditorInstitutionView.application_code}</td>
                    <td className="text-center">{creditorInstitutionView.segregation_code}</td>
                    <td className="text-center">
                        {creditorInstitutionView.mod4 && <FaCheck className="text-success"/>}
                        {!creditorInstitutionView.mod4 && <FaTimes className="text-danger"/>}
                    </td>
                </tr>
            );
            creditorInstitutionList.push(code);
        });

        return (
            <div className="container-fluid creditor-institutions">
                <div>
                    <div className="col-md-9 mb-3">
                        <h2>Vista Enti Creditori</h2>
                    </div>
                    {<div className="col-md-12">
                        <div className="row">
                            <div className="col-md-4">
                                <AsyncSelect
                                        cacheOptions defaultOptions
                                        loadOptions={this.debouncedStationOptions}
                                        placeholder="Cerca codice stazione"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        name="station_code"
                                        onChange={(e) => this.handleStationChange(e)}
                                        isClearable={true}
                                />
                            </div>
                            <div className="col-md-4">
                                <AsyncSelect
                                        cacheOptions defaultOptions
                                        loadOptions={this.debouncedCreditorInstitutionsOptions}
                                        placeholder="Cerca codice EC"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        name="creditor_institution_code"
                                        onChange={(e) => this.handleCreditorInstitutionChange(e)}
                                />
                            </div>
                            <div className="col-md-4">
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
                        </div>
                        {<div className="row">
                            {(this.filter.aux_digit?.visible &&
                                <div className="col-md-3">
                                    <Form.Group controlId="auxDigit">
                                    <Form.Label>Aux Digit:</Form.Label>
                                        <Form.Control as="select" name="filter_aux_digit" 
                                                    placeholder="Aux Digit"
                                                    onChange={(e) => this.handleAuxDigitChange(e)}>
                                            <option value="0">0</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                        </Form.Control>
                                    </Form.Group>
                                </div>
                                )}
                            {(this.filter.segregation_code?.visible &&
                                <div className="col-md-3">
                                    <Form.Group controlId="segregationCode">
                                    <Form.Label>Segregation code:</Form.Label>
                                        <Form.Control name="filter_segregation_code" 
                                                    placeholder="Segregation Code"
                                                    onChange={(e) => this.handleSegregationCodeChange(e)}>
                                        </Form.Control>
                                    </Form.Group>
                                </div>
                                )}
                            {(this.filter.application_code?.visible &&
                                <div className="col-md-3">
                                    <Form.Group controlId="applicationCode">
                                    <Form.Label>Application code:</Form.Label>
                                        <Form.Control name="filter_application_code" 
                                                    placeholder="Application Code"
                                                    onChange={(e) => this.handleApplicationCodeChange(e)}>
                                        </Form.Control>
                                    </Form.Group>
                                </div>
                                )}
                            <div className="col-md-3">
                                <Form.Group controlId="mod4">
                                    <Form.Label>Mod4:</Form.Label>
                                    <Form.Control as="select" name="mod4"
                                                onChange={(e) => this.handleMod4Change(e)}
                                                placeholder="Mod4"
                                                value={String(this.state.mod4Filter)}>
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                    </Form.Control>
                                </Form.Group>
                            </div>
                        </div>
                        }
                        <div className="row">
                            <div className="col-md-12 text-left">
                                <Button className="mr-1"
                                    onClick={() => {
                                        this.handleSearch();
                                    }}>Cerca</Button>
                                <Button
                                    onClick={() => {
                                        this.handleReset();
                                    }}>Reset</Button>
                            </div>
                        </div>
                        {isLoading && (<FaSpinner className="spinner"/>)}
                        {
                            !isLoading && (
                                <>
                                    <Table hover responsive size="sm">
                                        <thead>
                                        <tr>
                                            <th className="fixed-td-width">EC</th>
                                            <th className="fixed-td-width">Intermediario</th>
                                            <th className="fixed-td-width">Stazione</th>
                                            <th className="text-center">Aux digit</th>
                                            <th className="text-center">Application Code</th>
                                            <th className="text-center">Codice segregazione</th>
                                            <th className="text-center">Modello 4</th>
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
            </div>
        );
    }
}
