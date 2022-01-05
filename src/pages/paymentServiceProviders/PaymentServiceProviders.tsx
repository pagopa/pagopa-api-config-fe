import React from 'react';
import {Button, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaEdit, FaEye, FaPlus, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import Paginator from "../../components/Paginator";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import {getConfig} from "../../util/config";

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    payment_service_providers: any;
    page_info: {
        page: 0;
        limit: 50;
        items_found: 0;
        total_pages: 1;
    };
    isLoading: boolean;
    showDeleteModal: boolean;
    paymentServiceProviderToDelete: any;
    paymentServiceProviderIndex: number;
}

export default class PaymentServiceProviders extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/payment-service-providers";

    baseUrl = getConfig("APICONFIG_HOST") as string;
    basePath = getConfig("APICONFIG_BASEPATH") as string;

    constructor(props: IProps) {
        super(props);

        this.state = {
            payment_service_providers: [],
            page_info: {
                page: 0,
                limit: 50,
                items_found: 0,
                total_pages: 1
            },
            isLoading: false,
            showDeleteModal: false,
            paymentServiceProviderToDelete: {},
            paymentServiceProviderIndex: -1
        };

        this.handlePageChange = this.handlePageChange.bind(this);
        this.create = this.create.bind(this);
    }

    getPage(page: number) {
        this.setState({isLoading: true});

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getPaymentServiceProviders({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    limit: 10,
                    page
                }).then((response: any) => {
                        this.setState({
                            payment_service_providers: response.right.value.payment_service_providers,
                            page_info: response.right.value.page_info
                        });
                })
                .catch(() => {
                    toast.error("Problema nel recuperare i prestatori servizi di pagamento", {theme: "colored"});
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
        // this.props.history.push(this.service + "/create");
        return false;
    }

    handlePageChange(requestedPage: number) {
        this.getPage(requestedPage);
    }

    handleDetails(code: string) {
        this.props.history.push( this.service + "/" + code);
    }

    handleEdit(code: string) {
        this.props.history.push(this.service + "/" + code + "?edit");
    }

    handleDelete(paymentServiceProvider: string, index: number) {
        this.setState({showDeleteModal: true});
        this.setState({paymentServiceProviderToDelete: paymentServiceProvider});
        this.setState({paymentServiceProviderIndex: index});
    }

    removeCreditorInstitution() {
        const filteredPSP = this.state.payment_service_providers.filter((ci: any) => ci.psp_code !== this.state.paymentServiceProviderToDelete.psp_code);
        this.setState({payment_service_providers: filteredPSP});

        if (filteredPSP.length === 0 && this.state.page_info.total_pages > 1) {
            this.getPage(0);
        }
    }

    hideDeleteModal = (status: string) => {
        console.log("TODO", status);
        /*
        if (status === "ok") {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    apiClient.deleteCreditorInstitution({
                        Authorization: `Bearer ${response.accessToken}`,
                        ApiKey: "",
                        creditorinstitutioncode: this.state.creditorInstitutionToDelete.creditor_institution_code
                    })
                        .then((res: any) => {
                            if (res.right.status === 200) {
                                toast.info("Rimozione avvenuta con successo");
                                this.removeCreditorInstitution();
                            } else {
                                toast.error(res.right.value.title, {theme: "colored"});
                            }
                        })
                        .catch(() => {
                            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                        });
                });
        }
        this.setState({showDeleteModal: false});
        */
    };

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const pageInfo = this.state.page_info;
        const showDeleteModal = this.state.showDeleteModal;
        const pspList: any = [];
        const pspToDeleteName = this.state.paymentServiceProviderToDelete.business_name;
        const pspToDeleteCode = this.state.paymentServiceProviderToDelete.psp_code;

        this.state.payment_service_providers.map((psp: any, index: number) => {
            const code = (
                <tr key={index}>
                    <td>{psp.business_name}</td>
                    <td>{psp.psp_code}</td>
                    <td className="text-center">
                        {psp.enabled && <FaCheck className="text-success"/>}
                        {!psp.enabled && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-right">
                        {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-details-${index}`}>Visualizza</Tooltip>}>
                            <FaEye role="button" className="mr-3"
                                   onClick={() => this.handleDetails(psp.psp_code)}/>
                        </OverlayTrigger>
                        {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                            {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                            <FaEdit role="button" className="mr-3 disabled" onClick={() => false && this.handleEdit(psp.psp_code)}/>
                        </OverlayTrigger>
                        {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                            {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                            <FaTrash role="button" className="mr-3 disabled" onClick={() => false && this.handleDelete(psp, index)}/>
                        </OverlayTrigger>
                    </td>
                </tr>
            );
            pspList.push(code);
        });

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-10 mb-3">
                        <h2>Prestatori Servizio di Pagamento</h2>
                    </div>
                    <div className="col-md-2 text-right">
                        <Button className="disabled" onClick={this.create}>Nuovo <FaPlus/></Button>
                    </div>
                    <div className="col-md-12">
                        {isLoading && (<FaSpinner className="spinner"/>)}
                        {
                            !isLoading && (
                                <>
                                    <Table hover responsive size="sm">
                                        <thead>
                                        <tr>
                                            <th className="fixed-td-width">Prestatore Servizio di Pagamento</th>
                                            <th className="fixed-td-width">Codice</th>
                                            <th className="text-center">Abilitato</th>
                                            <th/>
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
                    </div>
                </div>
                <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                    <p>Sei sicuro di voler eliminare il seguente prestatore servizio di pagamento?</p>
                    <ul>
                        <li>{pspToDeleteName} - {pspToDeleteCode}</li>
                    </ul>
                </ConfirmationModal>

            </div>
        );
    }
}
