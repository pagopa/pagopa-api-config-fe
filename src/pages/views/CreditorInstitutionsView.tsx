import React from 'react';
import {Button, Form, Table} from "react-bootstrap";
import {FaCheck, FaSpinner, FaTimes} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import debounce from "lodash.debounce";
import AsyncSelect from 'react-select/async';
import { NavLink } from 'react-router-dom';
import {apiClient} from "../../util/apiClient";
import Paginator from "../../components/Paginator";
import {loginRequest} from "../../authConfig";

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
    isLoading: boolean;
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
            order: {
                by: "CODE",
                ing: "DESC"
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

        this.handleOrder = this.handleOrder.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.debouncedStationOptions = this.debouncedStationOptions.bind(this);
        this.debouncedCreditorInstitutionsOptions = this.debouncedCreditorInstitutionsOptions.bind(this);
        this.debouncedBrokerOptions = this.debouncedBrokerOptions.bind(this);
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
                        toast.error("Problema nel recuperare la vista", {theme: "colored"});
                    })
                    .finally(() => {
                        this.setState({isLoading: false});
                    });
            }).catch(() => {
            this.context.instance.logoutPopup({
                postLogoutRedirectUri: "/",
                mainWindowRedirectUri: "/"
            }).then(() => window.sessionStorage.removeItem("secret"));
        });
    }

    componentDidMount(): void {
        this.getPage(0);
    }


    handlePageChange(requestedPage: number) {
        this.getPage(requestedPage);
    }

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
            this.setState({auxDigitFilter: event.target.value});
        }
        else{
            this.setState({auxDigitFilter: undefined});
        }
    }

    handleSegregationCodeChange(event: any){
        this.setState({segregationCodeFilter: event.target.value});
    }

    handleApplicationCodeChange(event: any){
        this.setState({applicationCodeFilter: event.target.value});
    }

    handleMod4Change(event: any){
        if(event.target.value === ''){
            this.setState({mod4Filter: undefined});
        }
        else{
            this.setState({mod4Filter: event.target.value});
        }
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
                    <td>
                        <NavLink className="navlink"
                            to = {`/creditor-institutions/${creditorInstitutionView.creditor_institution_code}`}>
                            {creditorInstitutionView.creditor_institution_code}
                        </NavLink>
                    </td>
                    <td>
                        <NavLink className="navlink"
                            to = {`/brokers/${creditorInstitutionView.broker_code}`}>
                            {creditorInstitutionView.broker_code}
                        </NavLink>
                    </td>
                    <td>
                        <NavLink className="navlink"
                            to = {`/stations/${creditorInstitutionView.station_code}`}>
                            {creditorInstitutionView.station_code}
                        </NavLink>
                    </td>
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
                <div className="row">
                    <div className="col-md-9 mb-3">
                        <h2>Vista EC/Intermediario/Stazione</h2>
                    </div>
                    {<div className="col-md-12">
                        <div className="row">
                            <div className="col-md-4">
                                <Form.Label>Codice EC</Form.Label>
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
                                <Form.Label>Codice intermediario</Form.Label>
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
                            <div className="col-md-4">
                                <Form.Label>Codice Stazione</Form.Label>
                                <AsyncSelect
                                        cacheOptions defaultOptions
                                        loadOptions={this.debouncedStationOptions}
                                        placeholder="Cerca codice stazione"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        name="station_code"
                                        onChange={(e) => this.handleStationChange(e)}
                                />
                            </div>
                        </div>
                        {<div className="row mt-2">
                            <div className="col-md-2">
                                <Form.Group controlId="auxDigit">
                                <Form.Label>Aux Digit</Form.Label>
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
                            <div className="col-md-2">
                                <Form.Group controlId="applicationCode">
                                <Form.Label>Application code</Form.Label>
                                    <Form.Control name="filter_application_code" 
                                                placeholder="Application Code"
                                                onChange={(e) => this.handleApplicationCodeChange(e)}>                                        
                                    </Form.Control>
                                </Form.Group>
                            </div>
                            <div className="col-md-2">
                                <Form.Group controlId="segregationCode">
                                <Form.Label>Segregation code</Form.Label>
                                    <Form.Control name="filter_segregation_code" 
                                                placeholder="Segregation Code"
                                                onChange={(e) => this.handleSegregationCodeChange(e)}>
                                    </Form.Control>
                                    </Form.Group>
                            </div>
                            <div className="col-md-2">
                                <Form.Group controlId="mod4">
                                    <Form.Label>Modello 4</Form.Label>
                                    <Form.Control as="select" name="mod4"
                                                onChange={(e) => this.handleMod4Change(e)}
                                                placeholder="Modello 4"
                                                value={String(this.state.mod4Filter)}>
                                        <option value="">-</option>
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                    </Form.Control>
                                </Form.Group>
                            </div>
                            <div className="col-md-4 align-self-md-center text-right">
                            <Button className="mr-4 mt-3"
                                    onClick={() => {
                                        this.handleSearch();
                                    }}>Cerca</Button>
                                <Button className="mt-3"
                                    onClick={() => {
                                        this.handleReset();
                                    }}>Reset</Button>
                            </div>
                        </div>
                        }
                        {isLoading && (<FaSpinner className="spinner"/>)}
                        {
                            !isLoading && (
                                <>
                                    <Table hover responsive size="sm" className="mt-3">
                                        <thead>
                                        <tr>
                                            <th className="text-left">EC</th>
                                            <th className="text-left">Intermediario</th>
                                            <th className="text-left">Stazione</th>
                                            <th className="text-center">Aux Digit</th>
                                            <th className="text-center">Application Code</th>
                                            <th className="text-center">Segregation Code</th>
                                            <th className="text-center">Modello 4</th>
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
