import React from 'react';
import {Button, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaEye, FaPlus, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import Paginator from "../../components/Paginator";
import ConfirmationModal from "../../components/ConfirmationModal";

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    creditor_institutions: any;
    page_info : {
        page: 0;
        limit: 50;
        items_found: 0;
        total_pages: 1;
    };
    isLoading: boolean;
    showDeleteModal: boolean;
    creditorInstitutionToDelete: any;
    creditorInstitutionIndex: number;
}

export default class CreditorInstitutions extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            creditor_institutions: [],
            page_info : {
                page: 0,
                limit: 50,
                items_found: 0,
                total_pages: 1
            },
            isLoading: false,
            showDeleteModal: false,
            creditorInstitutionToDelete: {},
            creditorInstitutionIndex: -1
        };

        this.handlePageChange = this.handlePageChange.bind(this);
        this.createCreditorInstitution = this.createCreditorInstitution.bind(this);
    }

    getPage(page: number) {
        this.setState({isLoading: true});
        apiClient.getCreditorInstitutions({
            ApiKey: "",
            limit: 10,
            page
        })
        .then((response: any) => {
            this.setState({
                creditor_institutions: response.right.value.creditor_institutions,
                page_info: response.right.value.page_info
            });
        })
        .catch(err => {
            // eslint-disable-next-line no-console
            console.error("err", err);
            toast.error("Problema nel recuperare gli enti creditori", {theme: "colored"});
        })
        .finally(() => {
            this.setState({isLoading: false});
        });

    }

    componentDidMount(): void {
        this.getPage(0);
    }

    createCreditorInstitution() {
        this.props.history.push("/creditor-institutions/create");
    }

    handlePageChange(requestedPage: number) {
        this.getPage(requestedPage);
    }

    handleDetails(code: string) {
        this.props.history.push("/creditor-institutions/" + code);
    }

    handleDelete(creditorInstitution: string, index: number) {
        this.setState({ showDeleteModal: true });
        this.setState({ creditorInstitutionToDelete: creditorInstitution });
        this.setState({ creditorInstitutionIndex: index });
    }

    removeCreditorInstitution() {
        const filteredCI = this.state.creditor_institutions.filter((ci: any) => ci.creditor_institution_code !== this.state.creditorInstitutionToDelete.creditor_institution_code);
        this.setState({ creditor_institutions: filteredCI });

        if (filteredCI.length === 0 && this.state.page_info.total_pages > 1) {
            this.getPage(0);
        }
    }

    hideDeleteModal = (status: string) => {
        if (status === "ok") {
            apiClient.deleteCreditorInstitution({
                ApiKey: "",
                creditorinstitutioncode: this.state.creditorInstitutionToDelete.creditor_institution_code
            })
            .then((res: any) => {
                if (res.right.status === 200) {
                    toast.info("Rimozione avvenuta con successo");
                    this.removeCreditorInstitution();
                }
                else {
                    toast.error(res.right.value.title, {theme: "colored"});
                }
            })
            .catch((err: any) => {
                // eslint-disable-next-line no-console
                console.error("ERR", err);
                toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
            });
        }
        this.setState({ showDeleteModal: false });
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
                    {ci.enabled && <FaCheck className="text-success" />}
                    {!ci.enabled && <FaTimes className="text-danger" /> }
                </td>
                <td className="text-right">
                    <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-details-${index}`}>Dettagli</Tooltip>}>
                        <FaEye role="button" className="mr-3" onClick={() => this.handleDetails(ci.creditor_institution_code)} />
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                        <FaTrash role="button" className="mr-3" onClick={() => this.handleDelete(ci, index)} />
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
                            <Button onClick={this.createCreditorInstitution} >Nuovo <FaPlus /></Button>
                        </div>
                        <div className="col-md-12">
                        {isLoading &&  ( <FaSpinner className="spinner" /> )}
                        {
                            !isLoading && (
                                <>
                                    <Table hover responsive size="sm" >
                                        <thead>
                                        <tr>
                                            <th className="fixed-td-width">Ente creditore</th>
                                            <th className="fixed-td-width">Codice</th>
                                            <th className="text-center">Abilitato</th>
                                            <th/>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {creditorInstitutions}
                                        </tbody>
                                    </Table>

                                    <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange} />
                                </>
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

                </div>
        );
    }
}
