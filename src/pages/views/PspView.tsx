import React from 'react';
import {Button, Form, Table} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
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
    psp_list: any;
    page_info: {
        page: 0;
        limit: 50;
        items_found: 0;
        total_pages: 1;
    };
    isLoading: boolean;
    order: any;
    channelList: [];
    channelFilter: string;
    pspList: [];
    pspFilter: string;
    brokerPspList: [];
    brokerPspFilter: string;
    paymentTypeFilter?: string;
    paymentModelFilter?: string;
}

export default class PspView extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/views";

    constructor(props: IProps) {
        super(props);

        this.state = {
            psp_list: [],
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
            channelList: [],
            channelFilter: "",
            pspList: [],
            pspFilter: "",
            brokerPspList: [],
            brokerPspFilter: "",
            paymentTypeFilter: undefined,
            paymentModelFilter: undefined,

        };

        this.handleOrder = this.handleOrder.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.debouncedChannelOptions = this.debouncedChannelOptions.bind(this);
        this.debouncedPspOptions = this.debouncedPspOptions.bind(this);
        this.debouncedBrokerPspOptions = this.debouncedBrokerPspOptions.bind(this);
    }

    getPage(page: number) {
        this.setState({isLoading: true});

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getPaymentServiceProvidersView({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    limit: 10,
                    page,
                    pspCode: this.state.pspFilter,
                    pspBrokerCode: this.state.brokerPspFilter,
                    channelCode: this.state.channelFilter,
                    paymentType: this.state.paymentTypeFilter,
                    paymentModel: this.state.paymentModelFilter,
                }).then((response: any) => {
                    this.setState({
                        psp_list: response.right.value.payment_service_providers,
                        page_info: response.right.value.page_info
                    });
                })
                    .catch(() => {
                        toast.error("Problema nel recuperare la vista", {theme: "colored"});
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

    handleOrder(orderBy: string, ordering: string) {
        this.setState({
            order: {
                by: orderBy,
                ing: ordering
            }
        });
        this.getPage(0);
    }

    handleChannelChange(event: any){
        this.setState({channelFilter: event.value.code});
    }

    handlePspChange(event: any){
        this.setState({pspFilter: event.value.code});
    }

    handleBrokerPspChange(event: any){
        this.setState({brokerPspFilter: event.value.code});
    }

    handlePaymentTypeChange(event: any){
        this.setState({paymentTypeFilter: event.target.value});
    }

    handlePaymentModelChange(event: any){
        if (event.target.value === '') {
            this.setState({paymentModelFilter: undefined});
        }
        else{
            this.setState({paymentModelFilter: event.target.value});
        }
    }

    handleSearch(){
        this.getPage(0);
    }

    handleReset(){
        window.location.reload();
    }

    debouncedChannelOptions = debounce((inputValue, callback) => {
        this.promiseChannelOptions(inputValue, callback);
    }, 500);

    promiseChannelOptions(inputValue: string, callback: any) {
        const limit = inputValue.length === 0 ? 10 : 99999;
        const code = inputValue.length === 0 ? "" : inputValue;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getChannels({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page: 0,
                    limit,
                    code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const alreadyAssignedChannelIds = this.state.channelList.map((channel: any) => channel.channel_code);
                        const items: Array<any> = [];
                        resp.right.value.channels.filter((retrievedChannel: any) => alreadyAssignedChannelIds.indexOf(retrievedChannel.channel_code) === -1)
                            .forEach((retrievedChannel: any) => {                            
                                // eslint-disable-next-line functional/immutable-data
                                items.push({
                                    value: {code: retrievedChannel.channel_code},
                                    label: retrievedChannel.channel_code,
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

    debouncedPspOptions = debounce((inputValue, callback) => {
        this.promisePspOptions(inputValue, callback);
    }, 500);

    promisePspOptions(inputValue: string, callback: any) {
        const limit = inputValue.length === 0 ? 10 : 99999;
        const code = inputValue.length === 0 ? "" : inputValue;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getPaymentServiceProviders({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page: 0,
                    limit,
                    code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const alreadyAssignedPspIds = this.state.pspList.map((psp: any) => psp.psp_code);
                        const items: Array<any> = [];
                        resp.right.value.payment_service_providers.filter((payment_service_providers: any) => alreadyAssignedPspIds.indexOf(payment_service_providers.psp_code) === -1)
                            .forEach((retrievedPsp: any) => {                            
                                // eslint-disable-next-line functional/immutable-data
                                items.push({
                                    value: {code: retrievedPsp.psp_code},
                                    label: retrievedPsp.psp_code,
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

    debouncedBrokerPspOptions = debounce((inputValue, callback) => {
        this.promiseBrokerPspOptions(inputValue, callback);
    }, 500);

    promiseBrokerPspOptions(inputValue: string, callback: any) {
        const limit = inputValue.length === 0 ? 10 : 99999;
        const code = inputValue.length === 0 ? "" : inputValue;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getBrokersPsp({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page: 0,
                    limit,
                    code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const alreadyAssignedBrokerPspIds = this.state.brokerPspList.map((brokerPsp: any) => brokerPsp.broker_code);
                        const items: Array<any> = [];
                        resp.right.value.brokers_psp.filter((retrievedBrokerPsp: any) => alreadyAssignedBrokerPspIds.indexOf(retrievedBrokerPsp.broker_psp_code) === -1)
                            .forEach((retrievedBrokerPsp: any) => {                            
                                // eslint-disable-next-line functional/immutable-data
                                items.push({
                                    value: {code: retrievedBrokerPsp.broker_psp_code},
                                    label: retrievedBrokerPsp.broker_psp_code,
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
        const pspList: any = [];

        this.state.psp_list.map((pspView: any, index: number) => {
            const code = (
                <tr key={index}>
                    <td>
                        <NavLink className="navlink"
                            to = {`/payment-service-providers/${pspView.psp_code}`}>
                            {pspView.psp_code}
                        </NavLink>
                    </td>
                    <td>
                        <NavLink className="navlink"
                            to = {`/brokers-psp/${pspView.broker_psp_code}`}>
                            {pspView.broker_psp_code}
                        </NavLink>
                    </td>
                    <td>
                        <NavLink className="navlink"
                            to = {`/channels/${pspView.channel_code}`}>
                            {pspView.channel_code}
                        </NavLink>
                    </td>
                    <td className="text-center">{pspView.payment_type}</td>
                    <td className="text-center">{pspView.payment_method}</td>
                </tr>
            );
            pspList.push(code);
        });

        return (
            <div className="container-fluid payment-service-provides">
                <div className="row">
                    <div className="col-md-9 mb-3">
                        <h2>Vista PSP/Intermediario/Canale</h2>
                    </div>
                    {<div className="col-md-12">
                        <div className="row">
                            <div className="col-md-4">
                                <Form.Label>Codice PSP</Form.Label>
                                <AsyncSelect
                                        cacheOptions defaultOptions
                                        loadOptions={this.debouncedPspOptions}
                                        placeholder="Cerca codice PSP"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        name="psp_code"
                                        onChange={(e) => this.handlePspChange(e)}
                                />
                            </div>
                            <div className="col-md-4">
                                <Form.Label>Codice intermediario</Form.Label>
                                <AsyncSelect
                                        cacheOptions defaultOptions
                                        loadOptions={this.debouncedBrokerPspOptions}
                                        placeholder="Cerca codice Intermediario PSP"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        name="broker_psp_code"
                                        onChange={(e) => this.handleBrokerPspChange(e)}
                                />
                            </div>
                            <div className="col-md-4">
                                <Form.Label>Codice Canale</Form.Label>
                                <AsyncSelect
                                        cacheOptions defaultOptions
                                        loadOptions={this.debouncedChannelOptions}
                                        placeholder="Cerca codice canale"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        name="channel_code"
                                        onChange={(e) => this.handleChannelChange(e)}
                                />
                            </div>
                        </div>
                        <div className="row mt-2">
                            <div className="col-md-2">
                                <Form.Group controlId="paymentType">
                                <Form.Label>Tipo versamento</Form.Label>
                                    <Form.Control name="filter_payment_type" 
                                                placeholder="Payment type"
                                                onChange={(e) => this.handlePaymentTypeChange(e)}>
                                    </Form.Control>
                                </Form.Group>
                            </div>
                            <div className="col-md-2">
                                <Form.Group controlId="paymentModel">
                                <Form.Label>Modello di pagamento</Form.Label>
                                    <Form.Control as="select" name="filter_payment_model" 
                                                placeholder="Payment model"
                                                onChange={(e) => this.handlePaymentModelChange(e)}>
                                            <option value="">-</option>
                                            <option value="IMMEDIATO">IMMEDIATO</option>
                                            <option value="IMMEDIATO_MULTIBENEFICIARIO">IMMEDIATO_MULTIBENEFICIARIO</option>
                                            <option value="DIFFERITO">DIFFERITO</option>
                                            <option value="ATTIVATO_PRESSO_PSP">ATTIVATO_PRESSO_PSP</option>
                                    </Form.Control>
                                </Form.Group>
                            </div>
                            <div className="col-md-4">
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
                        {isLoading && (<FaSpinner className="spinner"/>)}
                        {
                            !isLoading && (
                                <>
                                    <Table hover responsive size="sm" className="mt-3">
                                        <thead>
                                        <tr>
                                            <th className="text-left">PSP</th>
                                            <th className="text-left">Intermediario</th>
                                            <th className="text-left">Canale</th>
                                            <th className="text-center">Tipo versamento</th>
                                            <th className="text-center">Modello di pagamento</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {pspList}
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