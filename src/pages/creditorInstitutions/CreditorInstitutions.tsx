import React from 'react';
import {Button, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {
    FaCheck,
    FaEdit,
    FaEye,
    FaPlus,
    FaSearch,
    FaSpinner,
    FaTimes,
    FaTrash
} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import Paginator from "../../components/Paginator";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import Filters from "../../components/Filters";
import Ordering from "../../components/Ordering";
import CITableModal from "../../components/CITableModal";
import CIEncodingModal from '../../components/CIEncodingModal';

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    creditor_institutions: any;
    page_info: {
        page: 0;
        limit: 50;
        items_found: 0;
        total_pages: 1;
        total_items: 0;
    };
    filters: {
        code: string;
        name: string;
    };
    isLoading: boolean;
    showDeleteModal: boolean;
    creditorInstitutionToDelete: any;
    creditorInstitutionIndex: number;
    order: any;
    iban: any;
    encoding: any;
}

export default class CreditorInstitutions extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: {[item: string]: any};

    constructor(props: IProps) {
        super(props);

        this.state = {
            creditor_institutions: [],
            page_info: {
                page: 0,
                limit: 50,
                items_found: 0,
                total_pages: 1,
                total_items: 0
            },
            filters: {
                code: "",
                name: "",
            },
            isLoading: false,
            showDeleteModal: false,
            creditorInstitutionToDelete: {},
            creditorInstitutionIndex: -1,
            order: {
                by: "NAME",
                ing: "DESC"
            },
            iban: {
                search: "",
                showModal: false,
                ciList: []
            },
            encoding: {
                search: "",
                showModal: false,
                ciList: []
            }
        };

        this.filter = {
            name: {
                visible: true,
                placeholder: "Ente Creditore"
            },
            code: {
                visible: true,
                placeholder: "Codice"
            }
        };

        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleOrder = this.handleOrder.bind(this);
        this.createCreditorInstitution = this.createCreditorInstitution.bind(this);
        this.searchIban = this.searchIban.bind(this);
        this.searchEncoding = this.searchEncoding.bind(this);
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    getPage(page: number) {
        this.setState({isLoading: true});

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getCreditorInstitutions({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    limit: 10,
                    page,
                    code: this.state.filters.code,
                    name: this.state.filters.name,
                    orderby: this.state.order.by,
                    ordering: this.state.order.ing
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({
                                creditor_institutions: response.right.value.creditor_institutions,
                                page_info: response.right.value.page_info
                            });
                        }

                    })
                    .catch(() => {
                        this.toastError("Problema nel recuperare gli enti creditori");
                    })
                    .finally(() => {
                        this.setState({isLoading: false});
                    });
            });

    }

    componentDidMount(): void {
        this.getPage(0);
    }

    createCreditorInstitution() {
        this.props.history.push("/creditor-institutions/create");
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

    handlePageChange(requestedPage: number) {
        this.getPage(requestedPage);
    }

    handleDetails(code: string) {
        this.props.history.push("/creditor-institutions/" + code);
    }

    handleEdit(code: string) {
        this.props.history.push("/creditor-institutions/" + code + "?edit");
    }

    handleDelete(creditorInstitution: string, index: number) {
        this.setState({showDeleteModal: true});
        this.setState({creditorInstitutionToDelete: creditorInstitution});
        this.setState({creditorInstitutionIndex: index});
    }

    removeCreditorInstitution() {
        const filteredCI = this.state.creditor_institutions.filter((ci: any) => ci.creditor_institution_code !== this.state.creditorInstitutionToDelete.creditor_institution_code);
        this.setState({creditor_institutions: filteredCI});

        if (filteredCI.length === 0 && this.state.page_info.total_pages > 1) {
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
                    apiClient.deleteCreditorInstitution({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        creditorinstitutioncode: this.state.creditorInstitutionToDelete.creditor_institution_code
                    })
                        .then((res: any) => {
                            if (res.right.status === 200) {
                                toast.info("Rimozione avvenuta con successo");
                                this.removeCreditorInstitution();
                            } else {
                                this.toastError(res.right.value.detail);
                            }
                        })
                        .catch(() => {
                            this.toastError("Operazione non avvenuta a causa di un errore");
                        });
                });
        }
        this.setState({showDeleteModal: false});
    };

    handleFilterCallback = (filters: any) => {
        this.setState({filters});
        this.getPage(0);
    };

    findByIban(ibanToSearch: string) {
        const iban = {
            search: ibanToSearch,
            showModal: false,
            ciList: []
        };
        this.setState({iban});
    }

    findByEncoding(codeToSearch: string) {
        const encoding = {
            search: codeToSearch,
            showModal: false,
            ciList: []
        };
        this.setState({encoding});
    }

    searchIban() {
        const loading = toast.info("Ricerca in corso degli EC aventi l'IBAN specificato.");
        if (this.state.iban.search.length > 0) {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    apiClient.getCreditorInstitutionsByIban({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        iban: this.state.iban.search
                    })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            const ciList = response.right.value.creditor_institutions;
                            if (ciList.length === 0) {
                                toast.info("Nessun EC trovato con l'IBAN specificato.");
                            }
                            else {
                                const iban = {
                                    search: this.state.iban.search,
                                    showModal: true,
                                    ciList
                                };
                                this.setState({iban});
                            }
                        }
                    })
                    .catch(() => {
                        this.toastError("Problema nel recuperare gli enti creditori");
                    })
                    .finally(() => {
                        toast.dismiss(loading);
                        this.setState({isLoading: false});
                    });
                });
        }
        else {
            toast.warn("Nessun IBAN specificato.");
        }
    }

    searchEncoding() {
        const loading = toast.info("Ricerca in corso degli EC aventi Codice Postale specificato.");
        if (this.state.encoding.search.length > 0) {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                    .then((response: any) => {
                        apiClient.getCreditorInstitutionByPostalEncoding({
                            Authorization: `Bearer ${response.idToken}`,
                            ApiKey: "",
                            encodingcode: this.state.encoding.search
                        })
                                .then((response: any) => {
                                    if (response.right.status === 200) {
                                        const ciList = response.right.value.creditor_institutions;
                                        if (ciList.length === 0) {
                                            toast.info("Nessun EC trovato con Il codice postale specificato.");
                                        }
                                        else {
                                            const encoding = {
                                                search: this.state.encoding.search,
                                                showModal: true,
                                                ciList
                                            };
                                            this.setState({encoding});
                                        }
                                    }
                                })
                                .catch(() => {
                                    this.toastError("Problema nel recuperare gli enti creditori");
                                })
                                .finally(() => {
                                    toast.dismiss(loading);
                                    this.setState({isLoading: false});
                                });
                    });
        }
        else {
            toast.warn("Nessun Codice Postale specificato.");
        }
    }

    hideIbanModal = (status: string) => {
        if (status === "ko") {
            const iban = {
                search: "",
                showModal: false,
                ciList: []
            };
            this.setState({iban});
        }
    };

    hideEncodingModal = (status: string) => {
        if (status === "ko") {
            const encoding = {
                search: "",
                showModal: false,
                ciList: []
            };
            this.setState({encoding});
        }
    };

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const pageInfo = this.state.page_info;
        const showDeleteModal = this.state.showDeleteModal;
        const creditorInstitutions: any = [];
        const ciToDeleteName = this.state.creditorInstitutionToDelete.business_name;
        const ciToDeleteCode = this.state.creditorInstitutionToDelete.creditor_institution_code;

        this.state.creditor_institutions.map((ci: any, index: number) => {
            const code = (
                <tr key={index}>
                    <td>{ci.business_name}</td>
                    <td>{ci.creditor_institution_code}</td>
                    <td className="text-center">
                        {ci.enabled && <FaCheck className="text-success"/>}
                        {!ci.enabled && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-right">
                        {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-details-${index}`}>Visualizza</Tooltip>}>
                            <FaEye role="button" className="mr-3"
                                   onClick={() => this.handleDetails(ci.creditor_institution_code)}/>
                        </OverlayTrigger>
                        {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                            <FaEdit role="button" className="mr-3"
                                    onClick={() => this.handleEdit(ci.creditor_institution_code)}/>
                        </OverlayTrigger>
                        {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                            <FaTrash role="button" className="mr-3" onClick={() => this.handleDelete(ci, index)}/>
                        </OverlayTrigger>
                    </td>
                </tr>
            );
            creditorInstitutions.push(code);
        });

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-10 mb-3">
                        <h2>Enti Creditori</h2>
                    </div>
                    <div className="col-md-2 text-right">
                        <Button onClick={this.createCreditorInstitution}>Nuovo <FaPlus/></Button>
                    </div>
                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-8">
                                <Filters configuration={this.filter} onFilter={this.handleFilterCallback} />
                            </div>
                            <div className="col-md-4">
                                <div className="row">
                                    <div className="d-flex align-items-center">
                                        <FaSearch />
                                    </div>
                                    <div className="col-md-9">
                                        <Form.Control name="filter_name" placeholder="Cerca per IBAN"
                                                      value={this.state.iban.search}
                                                      onChange={event => this.findByIban(event.target.value)} />
                                    </div>
                                    <div className="col-md-2">
                                        <Button className="btn btn-primary" onClick={this.searchIban} >Cerca</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-8"></div>
                            <div className="col-md-4">
                            <div className="row">
                                <div className="d-flex align-items-center">
                                    <FaSearch />
                                </div>
                                <div className="col-md-9">
                                    <Form.Control name="filter_name" placeholder="Cerca per Codice Postale"
                                                  value={this.state.encoding.search}
                                                  onChange={event => this.findByEncoding(event.target.value)} />
                                </div>
                                <div className="col-md-2">
                                    <Button className="btn btn-primary" onClick={this.searchEncoding} >Cerca</Button>
                                </div>
                            </div>
                            </div>
                        </div>

                        {isLoading && (<FaSpinner className="spinner"/>)}
                        {
                            !isLoading && (
                                <div className={"my-4"}>
                                    <Table hover responsive size="sm">
                                        <thead>
                                        <tr>
                                            <th className="fixed-td-width">
                                                <Ordering currentOrderBy={this.state.order.by} currentOrdering={this.state.order.ing} orderBy={"NAME"} ordering={"DESC"} handleOrder={this.handleOrder} />
                                                Ente creditore
                                            </th>
                                            <th className="fixed-td-width">
                                                <Ordering currentOrderBy={this.state.order.by} currentOrdering={this.state.order.ing} orderBy={"CODE"} ordering={"DESC"} handleOrder={this.handleOrder} />
                                                Codice
                                            </th>
                                            <th className="text-center">Abilitato</th>
                                            <th/>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {creditorInstitutions}
                                        </tbody>
                                    </Table>

                                    <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange}/>
                                </div>
                            )
                        }
                    </div>
                </div>
                <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                    <p>Sei sicuro di voler eliminare il seguente ente creditore?</p>
                    <ul>
                        <li>{ciToDeleteName} - {ciToDeleteCode}</li>
                    </ul>
                </ConfirmationModal>

                <CITableModal show={this.state.iban.showModal} handleClose={this.hideIbanModal}
                              iban={this.state.iban.search} creditorInstitutions={this.state.iban.ciList}
                              history={this.props.history}
                />
                <CIEncodingModal show={this.state.encoding.showModal} handleClose={this.hideEncodingModal}
                                 encoding={this.state.encoding.search} creditorInstitutions={this.state.encoding.ciList}
                                 history={this.props.history}
                />

            </div>
        );
    }
}
