import React from 'react';
import {Button, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaEdit, FaEye, FaPlus, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import Paginator from "../../components/Paginator";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import Filters from "../../components/Filters";
import Ordering from "../../components/Ordering";

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    brokers_psp: any;
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
    brokerToDelete: any;
    brokerIndex: number;
    order: any;
}

export default class BrokersPSP extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: {[item: string]: any};

    service = "/brokers-psp";

    constructor(props: IProps) {
        super(props);

        this.state = {
            brokers_psp: [],
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
            brokerToDelete: {},
            brokerIndex: -1,
            order: {
                by: "CODE",
                ing: "DESC"
            }
        };

        this.filter = {
            name: {
                visible: true,
                placeholder: "Descrizione"
            },
            code: {
                visible: true,
                placeholder: "Codice"
            }
        };

        this.handleOrder = this.handleOrder.bind(this);
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
                    apiClient.getBrokersPsp({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        limit: 10,
                        page,
                        code: this.state.filters.code,
                        name: this.state.filters.name,
                        orderby: this.state.order.by,
                        ordering: this.state.order.ing
                    }).then((response: any) => {
                        this.setState({
                            brokers_psp: response.right.value.brokers_psp,
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
        this.props.history.push(this.service + "/create");
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

    handleDelete(brokerPSP: string, index: number) {
        this.setState({showDeleteModal: true});
        this.setState({brokerToDelete: brokerPSP});
        this.setState({brokerIndex: index});
    }

    removeCreditorInstitution() {
        const filteredPSP = this.state.brokers_psp.filter((ci: any) => ci.psp_code !== this.state.brokerToDelete.psp_code);
        this.setState({brokers_psp: filteredPSP});

        if (filteredPSP.length === 0 && this.state.page_info.total_pages > 1) {
            this.getPage(0);
        }
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

    hideDeleteModal = (status: string) => {

        if (status === "ok") {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                    .then((response: any) => {
                        apiClient.deleteBrokerPsp({
                            Authorization: `Bearer ${response.idToken}`,
                            ApiKey: "",
                            brokerpspcode: this.state.brokerToDelete.broker_psp_code
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
    };

    handleFilterCallback = (filters: any) => {
        this.setState({filters});
        this.getPage(0);
    };

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const pageInfo = this.state.page_info;
        const showDeleteModal = this.state.showDeleteModal;
        const brokerPSPList: any = [];
        const brokerPSPToDeleteName = this.state.brokerToDelete.description;
        const brokerPSPToDeleteCode = this.state.brokerToDelete.broker_psp_code;

        this.state.brokers_psp.map((broker: any, index: number) => {
            const code = (
                    <tr key={index}>
                        <td>{broker.broker_psp_code}</td>
                        <td>{broker.description}</td>
                        <td className="text-center">
                            {broker.enabled && <FaCheck className="text-success"/>}
                            {!broker.enabled && <FaTimes className="text-danger"/>}
                        </td>
                        <td className="text-right">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-details-${index}`}>Visualizza</Tooltip>}>
                                <FaEye role="button" className="mr-3"
                                       onClick={() => this.handleDetails(broker.broker_psp_code)}/>
                            </OverlayTrigger>
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                                {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                                <FaEdit role="button" className="mr-3" onClick={() => this.handleEdit(broker.broker_psp_code)}/>
                            </OverlayTrigger>
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                                <FaTrash role="button" className="mr-3" onClick={() => this.handleDelete(broker, index)}/>
                            </OverlayTrigger>
                        </td>
                    </tr>
            );
            brokerPSPList.push(code);
        });

        return (
                <div className="container-fluid creditor-institutions">
                    <div className="row">
                        <div className="col-md-10 mb-3">
                            <h2>Intermediari PSP</h2>
                        </div>
                        <div className="col-md-2 text-right">
                            <Button onClick={this.create}>Nuovo <FaPlus/></Button>
                        </div>
                        <div className="col-md-12">
                            <Filters configuration={this.filter} onFilter={this.handleFilterCallback} />

                            {isLoading && (<FaSpinner className="spinner"/>)}
                            {
                                !isLoading && (
                                        <>
                                            <Table hover responsive size="sm">
                                                <thead>
                                                <tr>
                                                    <th className="fixed-td-width">
                                                        <Ordering currentOrderBy={this.state.order.by} currentOrdering={this.state.order.ing} orderBy={"CODE"} ordering={"DESC"} handleOrder={this.handleOrder} />
                                                        Codice
                                                    </th>
                                                    <th className="fixed-td-width">
                                                        <Ordering currentOrderBy={this.state.order.by} currentOrdering={this.state.order.ing} orderBy={"NAME"} ordering={"DESC"} handleOrder={this.handleOrder} />
                                                        Descrizione
                                                    </th>
                                                    <th className="text-center">Abilitato</th>
                                                    <th/>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {brokerPSPList}
                                                </tbody>
                                            </Table>

                                            <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange}/>
                                        </>
                                )
                            }
                        </div>
                    </div>
                    <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                        <p>Sei sicuro di voler eliminare il seguente intermediario PSP?</p>
                        <ul>
                            <li>{brokerPSPToDeleteName} - {brokerPSPToDeleteCode}</li>
                        </ul>
                    </ConfirmationModal>

                </div>
        );
    }
}
