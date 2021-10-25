import React from 'react';
import {OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaEye, FaTimes, FaTrash} from "react-icons/fa";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import Paginator from "../../components/Paginator";
import ConfirmationModal from "../../components/ConfirmationModal";

interface IProps {
    history: any;
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

        // this.setState({isLoading: false, showDeleteModal: false});

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
            creditorInstitutionToDelete: null,
            creditorInstitutionIndex: -1
        };
    }

    getPage(page: number) {

        this.setState({isLoading: true});
        apiClient.getCreditorInstitutions({
            ApiKey: "",
            limit: 10,
            page: page
        })
        .then((response: any) => {
            this.setState({
                creditor_institutions: response.value.value.creditor_institutions,
                page_info: response.value.value.page_info
            });
        })
        .catch(err => {
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
                if (res.value.status === 200) {
                    toast.info("Rimozione avvenuta con successo");
                    this.removeCreditorInstitution();
                }
                else {
                    toast.error(res.value.value.title, {theme: "colored"});
                }
            })
            .catch((err: any) => {
                console.error(err);
                toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
            });
        }
        this.setState({ showDeleteModal: false });
    };

    render(): React.ReactNode {
        console.log("state", this.state);
        const isLoading = this.state.isLoading;
        const pageInfo = this.state.page_info;
        const showDeleteModal = this.state.showDeleteModal;
        const creditorInstitutions: any = [];

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
                    <OverlayTrigger placement="top" overlay={<Tooltip id={"tooltip-details-" + index}>Dettagli</Tooltip>}>
                        <FaEye role="button" className="mr-3" onClick={() => this.handleDetails(ci.creditor_institution_code)} />
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip id={"tooltip-delete-" + index}>Elimina</Tooltip>}>
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
                        <div className="col-md-12 mb-5">
                            <h2>EntiCreditori</h2>
                        </div>
                        <div className="col-md-12">
                        {isLoading &&  ( <p>Loading ...</p> )}
                        {
                            !isLoading && (
                                <>
                                    <Table hover responsive size="sm" >
                                        <thead>
                                        <tr>
                                            <th className="fixed-td-width">Ente creditore</th>
                                            <th className="fixed-td-width">Codice</th>
                                            <th className="text-center">Abilitato</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {creditorInstitutions}
                                        </tbody>
                                    </Table>

                                    <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange.bind(this)} />
                                </>
                            )
                        }
                        </div>
                    </div>
                    <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                        <p>Sei sicuro di voler eliminare il seguente ente creditore?</p>
                        <ul>
                            <li>{this.state.creditorInstitutionToDelete?.business_name} - {this.state.creditorInstitutionToDelete?.creditor_institution_code}</li>
                        </ul>
                    </ConfirmationModal>

                </div>
        );
    }
}
