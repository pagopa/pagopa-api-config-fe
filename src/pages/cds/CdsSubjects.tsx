import React from 'react';
import {Button, Form, Modal, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaEdit, FaLink, FaPlus, FaSpinner, FaTrash} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import Paginator from "../../components/Paginator";
import {loginRequest} from "../../authConfig";
import {extractErrorMessage} from "../../util/apiErrors";
import {CdsSoggetto} from '../../../generated/api/CdsSoggetto';


interface IProps {
    selectedSubjectId?: number;
    onSelectSubject: (subject: CdsSoggetto) => void;
}

interface IState {
    subjects: Array<CdsSoggetto>;
    isLoading: boolean;
    showFormModal: boolean;
    isEditing: boolean;
    formData: CdsSoggetto;
    showDeleteModal: boolean;
    subjectToDelete: CdsSoggetto;
    currentPage: number;
}

const PAGE_SIZE = 10;

const emptySubject: CdsSoggetto = {
    creditorInstitutionCode: "",
    creditorInstitutionDescription: ""
};

export default class CdsSubjects extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            subjects: [],
            isLoading: false,
            showFormModal: false,
            isEditing: false,
            formData: {...emptySubject},
            showDeleteModal: false,
            subjectToDelete: {},
            currentPage: 0
        };

        this.handleCreate = this.handleCreate.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.hideFormModal = this.hideFormModal.bind(this);
        this.hideDeleteModal = this.hideDeleteModal.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
    }

    componentDidMount(): void {
        this.getData();
    }

    getData() {
        this.setState({isLoading: true});

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getCdsSubjects({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: ""
                })
                    .then((res: any) => {
                        if (res.right.status === 200) {
                            const subjects = [...res.right.value.subjects].sort((a: CdsSoggetto, b: CdsSoggetto) =>
                                (a.creditorInstitutionCode ?? "").localeCompare(b.creditorInstitutionCode ?? ""));
                            const totalPages = Math.max(Math.ceil(subjects.length / PAGE_SIZE), 1);
                            const currentPage = Math.min(this.state.currentPage, totalPages - 1);
                            this.setState({subjects, currentPage});
                        } else {
                            this.toastError(res.right.value.detail);
                        }
                    })
                    .catch(() => {
                        toast.error("Problema nel recuperare i soggetti", {theme: "colored"});
                    })
                    .finally(() => {
                        this.setState({isLoading: false});
                    });
            });
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    handlePageChange(requestedPage: number) {
        this.setState({currentPage: requestedPage});
    }

    handleCreate() {
        this.setState({
            showFormModal: true,
            isEditing: false,
            formData: {...emptySubject}
        });
    }

    handleEdit(subject: CdsSoggetto) {
        this.setState({
            showFormModal: true,
            isEditing: true,
            formData: {...subject}
        });
    }

    handleChange(event: any) {
        const {name, value} = event.target;
        const formData = {...this.state.formData};
        // eslint-disable-next-line functional/immutable-data
        (formData as any)[name] = value;
        this.setState({formData});
    }

    hideFormModal() {
        this.setState({
            showFormModal: false,
            formData: {...emptySubject}
        });
    }

    handleSave() {
        const {isEditing, formData} = this.state;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                const request = isEditing
                    ? apiClient.updateCdsSubject({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        subjectid: formData.id as number,
                        body: formData
                    })
                    : apiClient.createCdsSubject({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        body: formData
                    });

                request
                    .then(async (res: any) => {
                        if (res.right && (res.right.status === 200 || res.right.status === 201)) {
                            toast.info("Salvataggio avvenuto con successo");
                            this.getData();
                            this.hideFormModal();
                        } else {
                            const message = await extractErrorMessage(res, "Operazione non avvenuta a causa di un errore");
                            this.toastError(message);
                        }
                    })
                    .catch(() => {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    });
            });
    }

    handleDelete(subject: CdsSoggetto) {
        this.setState({
            showDeleteModal: true,
            subjectToDelete: subject
        });
    }

    hideDeleteModal(status: string) {
        if (status === "ok") {
            const subject = this.state.subjectToDelete;

            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    apiClient.deleteCdsSubject({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        subjectid: subject.id as number
                    })
                        .then(async (res: any) => {
                            if (res.right && res.right.status === 200) {
                                toast.info("Rimozione avvenuta con successo");
                                this.getData();
                            } else {
                                const message = await extractErrorMessage(res, "Operazione non avvenuta a causa di un errore");
                                this.toastError(message);
                            }
                        })
                        .catch(() => {
                            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                        });
                });
        }
        this.setState({showDeleteModal: false, subjectToDelete: {}});
    }

    render(): React.ReactNode {
        const {subjects, isLoading, showFormModal, isEditing, formData, showDeleteModal, subjectToDelete, currentPage} = this.state;
        const {selectedSubjectId} = this.props;

        const totalPages = Math.max(Math.ceil(subjects.length / PAGE_SIZE), 1);
        const pagedSubjects = subjects.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
        const pageInfo = {
            page: currentPage,
            limit: PAGE_SIZE,
            items_found: pagedSubjects.length,
            total_pages: totalPages,
            total_items: subjects.length
        };

        return (
            <div className="cds-subjects">
                <div className="row">
                    <div className="col-md-10">
                        <p>Elenco dei soggetti censiti nel Catalogo Dati Servizi.</p>
                    </div>
                    <div className="col-md-2 text-right">
                        <Button onClick={this.handleCreate}>Nuovo <FaPlus/></Button>
                    </div>
                </div>

                {isLoading && (<FaSpinner className="spinner"/>)}
                {
                    !isLoading && (
                        <>
                            <Table hover responsive size="sm">
                                <thead>
                                <tr>
                                    <th>Codice Ente Creditore</th>
                                    <th className="text-left">Descrizione Ente Creditore</th>
                                    <th className="buttons-td-width"/>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    pagedSubjects.map((subject: CdsSoggetto, index: number) => (
                                        <tr key={subject.id ?? index}
                                            className={subject.id !== undefined && subject.id === selectedSubjectId ? "table-active" : ""}>
                                            <td>{subject.creditorInstitutionCode}</td>
                                            <td className="text-left">{subject.creditorInstitutionDescription}</td>
                                            <td className="text-right">
                                                <OverlayTrigger placement="top"
                                                                overlay={<Tooltip id={`tooltip-select-${index}`}>Vedi servizi associati</Tooltip>}>
                                                    <FaLink role="button" className="mr-3"
                                                            onClick={() => this.props.onSelectSubject(subject)}/>
                                                </OverlayTrigger>
                                                <OverlayTrigger placement="top"
                                                                overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                                                    <FaEdit role="button" className="mr-3"
                                                            onClick={() => this.handleEdit(subject)}/>
                                                </OverlayTrigger>
                                                <OverlayTrigger placement="top"
                                                                overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                                    <FaTrash role="button" className="mr-0"
                                                             onClick={() => this.handleDelete(subject)}/>
                                                </OverlayTrigger>
                                            </td>
                                        </tr>
                                    ))
                                }
                                </tbody>
                            </Table>
                            <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange}/>
                        </>
                    )
                }

                <Modal show={showFormModal} onHide={this.hideFormModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>{isEditing ? "Modifica Soggetto" : "Nuovo Soggetto"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group>
                                <Form.Label>Codice Ente Creditore</Form.Label>
                                <Form.Control name="creditorInstitutionCode" value={formData.creditorInstitutionCode ?? ""}
                                              maxLength={5}
                                              onChange={this.handleChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Descrizione Ente Creditore</Form.Label>
                                <Form.Control name="creditorInstitutionDescription" value={formData.creditorInstitutionDescription ?? ""}
                                              onChange={this.handleChange}/>
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.hideFormModal}>Annulla</Button>
                        <Button variant="primary" onClick={this.handleSave}>Salva</Button>
                    </Modal.Footer>
                </Modal>

                <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                    <p>Sei sicuro di voler eliminare il seguente soggetto?</p>
                    <ul>
                        <li>{subjectToDelete.creditorInstitutionCode} - {subjectToDelete.creditorInstitutionDescription}</li>
                    </ul>
                </ConfirmationModal>
            </div>
        );
    }
}
