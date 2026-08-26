import React from 'react';
import {Button, Form, Modal, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaEdit, FaPlus, FaSpinner, FaTrash} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import {toast} from "react-toastify";
import {apiClient, apiBaseUrl} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import Paginator from "../../components/Paginator";
import {loginRequest} from "../../authConfig";
import {extractErrorMessage} from "../../util/apiErrors";
import {CdsSoggettoServizio} from '../../../generated/api/CdsSoggettoServizio';
import {CdsSoggettoServizioRequestDto} from '../../../generated/api/CdsSoggettoServizioRequestDto';
import {CdsSoggetto} from '../../../generated/api/CdsSoggetto';


interface IProps {
    subject: CdsSoggetto;
}

interface IState {
    subjectServices: Array<CdsSoggettoServizio>;
    isLoading: boolean;
    showFormModal: boolean;
    isEditing: boolean;
    isSaving: boolean;
    formData: CdsSoggettoServizio;
    showDeleteModal: boolean;
    subjectServiceToDelete: CdsSoggettoServizio;
    currentPage: number;
}

const PAGE_SIZE = 10;

const emptySubjectService: CdsSoggettoServizio = {
    idSoggettoServizio: "",
    fkCdsServizio: "",
    fkStazione: "",
    descrizioneServizio: "",
    commissione: false
};

const dateToInputValue = (date: Date | null | undefined): string =>
    date ? date.toISOString().substring(0, 10) : "";

const formatStazione = (stazionePa: any): string => {
    if (stazionePa === null || stazionePa === undefined) {
        return "";
    }
    return stazionePa.fkStazione?.idStazione ?? stazionePa.idStazione ?? "";
};

// the backend returns dates with a timezone offset (e.g. "2026-08-31T02:00:00+02:00"),
// which the generated io-ts decoder (UTCISODateFromString) rejects; parse the payload
// tolerantly here and convert the validity dates into Date objects
const parseSubjectService = (raw: any): CdsSoggettoServizio => ({
    ...raw,
    dataInizioValidita: raw?.dataInizioValidita ? new Date(raw.dataInizioValidita) : undefined,
    dataFineValidita: raw?.dataFineValidita ? new Date(raw.dataFineValidita) : undefined
});

// maps the form state (CdsSoggettoServizio shape) to the request body expected by the create/update APIs
const toRequestDto = (
  formData: CdsSoggettoServizio,
  subjectCode: string,
  isEditing: boolean
): CdsSoggettoServizioRequestDto => ({
  // on edit, "id" must reflect the existing record's own id (formData.id), not idSoggettoServizio;
  // on create there is no id yet, so the user-entered idSoggettoServizio is used to assign one
  id: isEditing
    ? (formData.id !== undefined ? String(formData.id) : undefined)
    : formData.idSoggettoServizio,
  idSoggetto: subjectCode,
  idServizio: formData.servizio?.idServizio,
  idStazione: formData?.stazionePa?.fkStazione?.idStazione,
  descrizione_servizio: formData.descrizioneServizio,
  dataInizioValidita: formData.dataInizioValidita,
  dataFineValidita: formData.dataFineValidita,
  commissione: formData.commissione
});

export default class CdsSubjectServices extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            subjectServices: [],
            isLoading: false,
            showFormModal: false,
            isEditing: false,
            isSaving: false,
            formData: {...emptySubjectService},
            showDeleteModal: false,
            subjectServiceToDelete: {},
            currentPage: 0
        };

        this.handleCreate = this.handleCreate.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleServizioChange = this.handleServizioChange.bind(this);
        this.handleStazioneChange = this.handleStazioneChange.bind(this);
        this.handleDateChange = this.handleDateChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.hideFormModal = this.hideFormModal.bind(this);
        this.hideDeleteModal = this.hideDeleteModal.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
    }

    componentDidMount(): void {
        this.getData();
    }

    componentDidUpdate(prevProps: IProps): void {
        if (prevProps.subject.id !== this.props.subject.id) {
            this.setState({currentPage: 0});
            this.getData();
        }
    }

    getData() {
        const subjectCode = this.props.subject.creditorInstitutionCode;
        if (subjectCode === undefined) {
            return;
        }

        this.setState({isLoading: true});

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                fetch(`${apiBaseUrl}/cds/subjects/${subjectCode}/services`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${response.idToken}`,
                        "Ocp-Apim-Subscription-Key": ""
                    }
                })
                    .then(async (res: Response) => {
                        const body = await res.json();
                        if (res.status === 200) {
                            const subjectServices = (body.subjectServices ?? [])
                                .map(parseSubjectService)
                                .sort((a: CdsSoggettoServizio, b: CdsSoggettoServizio) =>
                                    (a.idSoggettoServizio ?? "").localeCompare(b.idSoggettoServizio ?? ""));
                            const totalPages = Math.max(Math.ceil(subjectServices.length / PAGE_SIZE), 1);
                            const currentPage = Math.min(this.state.currentPage, totalPages - 1);
                            this.setState({subjectServices, currentPage});
                        } else {
                            this.toastError(body.detail);
                        }
                    })
                    .catch(() => {
                        toast.error("Problema nel recuperare i servizi associati al soggetto", {theme: "colored"});
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
            formData: {...emptySubjectService, fkCdsSoggetto: this.props.subject.creditorInstitutionCode}
        });
    }

    handleEdit(subjectService: CdsSoggettoServizio) {
        this.setState({
            showFormModal: true,
            isEditing: true,
            formData: {...subjectService}
        });
    }

    handleChange(event: any) {
        const {name, value, type, checked} = event.target;
        const formData = {...this.state.formData};
        // eslint-disable-next-line functional/immutable-data
        (formData as any)[name] = type === "checkbox" ? checked : value;
        this.setState({formData});
    }

    handleServizioChange(event: any) {
        const {value} = event.target;
        const formData = {...this.state.formData, servizio: {...this.state.formData.servizio, idServizio: value}};
        this.setState({formData});
    }

    handleStazioneChange(event: any) {
        const {value} = event.target;
        const formData = {
            ...this.state.formData,
            stazionePa: {
                ...this.state.formData.stazionePa,
                fkStazione: {...this.state.formData.stazionePa?.fkStazione, idStazione: value}
            }
        };
        this.setState({formData});
    }

    handleDateChange(event: any) {
        const {name, value} = event.target;
        const formData = {...this.state.formData};
        // eslint-disable-next-line functional/immutable-data
        (formData as any)[name] = value === "" ? undefined : new Date(value);
        this.setState({formData});
    }

    hideFormModal() {
        this.setState({
            showFormModal: false,
            isSaving: false,
            formData: {...emptySubjectService}
        });
    }

    handleSave() {
        const {isEditing, formData} = this.state;
        const subjectCode = this.props.subject.creditorInstitutionCode;
        if (subjectCode === undefined) {
            return;
        }

        this.setState({isSaving: true});

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                const body = toRequestDto(formData, subjectCode, isEditing);
                const request = isEditing
                    ? apiClient.updateCdsSubjectService({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        subjectid: subjectCode,
                        idsoggettoservizio: formData.idSoggettoServizio as string,
                        body
                    })
                    : apiClient.createCdsSubjectService({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        subjectid: subjectCode,
                        body
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
                    })
                    .finally(() => {
                        this.setState({isSaving: false});
                    });
            })
            .catch(() => {
                toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                this.setState({isSaving: false});
            });
    }

    handleDelete(subjectService: CdsSoggettoServizio) {
        this.setState({
            showDeleteModal: true,
            subjectServiceToDelete: subjectService
        });
    }

    hideDeleteModal(status: string) {
        if (status === "ok") {
            const subjectService = this.state.subjectServiceToDelete;
            const subjectCode = this.props.subject.creditorInstitutionCode;

            if (subjectCode !== undefined) {
                this.context.instance.acquireTokenSilent({
                    ...loginRequest,
                    account: this.context.accounts[0]
                })
                    .then((response: any) => {
                        apiClient.deleteCdsSubjectService({
                            Authorization: `Bearer ${response.idToken}`,
                            ApiKey: "",
                            subjectid: subjectCode,
                            idsoggettoservizio: subjectService.idSoggettoServizio as string
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
        }
        this.setState({showDeleteModal: false, subjectServiceToDelete: {}});
    }

    render(): React.ReactNode {
        const {subjectServices, isLoading, showFormModal, isEditing, isSaving, formData, showDeleteModal, subjectServiceToDelete, currentPage} = this.state;
        const {subject} = this.props;

        const totalPages = Math.max(Math.ceil(subjectServices.length / PAGE_SIZE), 1);
        const pagedSubjectServices = subjectServices.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
        const pageInfo = {
            page: currentPage,
            limit: PAGE_SIZE,
            items_found: pagedSubjectServices.length,
            total_pages: totalPages,
            total_items: subjectServices.length
        };

        return (
            <div className="cds-subject-services">
                <div className="row">
                    <div className="col-md-10">
                        <p>Elenco dei servizi associati al soggetto <strong>{subject.creditorInstitutionCode}</strong> - {subject.creditorInstitutionDescription}.</p>
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
                                    <th>ID Soggetto Servizio</th>
                                    <th>ID Servizio</th>
                                    <th className="text-left">Descrizione</th>
                                    <th>Inizio Validità</th>
                                    <th>Fine Validità</th>
                                    <th>Commissione</th>
                                    <th>Stazione</th>
                                    <th className="buttons-td-width"/>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    pagedSubjectServices.map((subjectService: CdsSoggettoServizio, index: number) => (
                                        <tr key={subjectService.id ?? index}>
                                            <td>{subjectService.idSoggettoServizio}</td>
                                            <td>{subjectService.servizio?.idServizio}</td>
                                            <td className="text-left">{subjectService.descrizioneServizio}</td>
                                            <td>{subjectService.dataInizioValidita?.toLocaleDateString()}</td>
                                            <td>{subjectService.dataFineValidita?.toLocaleDateString()}</td>
                                            <td>{subjectService.commissione ? "Sì" : "No"}</td>
                                            <td>{formatStazione(subjectService.stazionePa)}</td>
                                            <td className="text-right">
                                                <OverlayTrigger placement="top"
                                                                overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                                                    <FaEdit role="button" className="mr-3"
                                                            onClick={() => this.handleEdit(subjectService)}/>
                                                </OverlayTrigger>
                                                <OverlayTrigger placement="top"
                                                                overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                                    <FaTrash role="button" className="mr-0"
                                                             onClick={() => this.handleDelete(subjectService)}/>
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

                <Modal show={showFormModal} onHide={isSaving ? undefined : this.hideFormModal}>
                    <Modal.Header closeButton={!isSaving}>
                        <Modal.Title>{isEditing ? "Modifica Associazione Soggetto - Servizio" : "Nuova Associazione Soggetto - Servizio"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {isSaving && (<FaSpinner className="spinner"/>)}
                        <Form>
                            <Form.Group>
                                <Form.Label>ID Soggetto Servizio</Form.Label>
                                <Form.Control name="idSoggettoServizio" value={formData.idSoggettoServizio ?? ""}
                                              disabled={isEditing}
                                              onChange={this.handleChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>ID Servizio</Form.Label>
                                <Form.Control name="idServizio" value={formData.servizio?.idServizio ?? ""}
                                              onChange={this.handleServizioChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Descrizione</Form.Label>
                                <Form.Control name="descrizioneServizio" value={formData.descrizioneServizio ?? ""}
                                              onChange={this.handleChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Stazione</Form.Label>
                                <Form.Control name="idStazione" value={formData?.stazionePa?.fkStazione?.idStazione ?? ""}
                                              onChange={this.handleStazioneChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Data Inizio Validità</Form.Label>
                                <Form.Control name="dataInizioValidita" type="date"
                                              value={dateToInputValue(formData.dataInizioValidita)}
                                              onChange={this.handleDateChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Data Fine Validità</Form.Label>
                                <Form.Control name="dataFineValidita" type="date"
                                              value={dateToInputValue(formData.dataFineValidita)}
                                              onChange={this.handleDateChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Check type="checkbox" name="commissione" label="Commissione"
                                            checked={formData.commissione ?? false}
                                            onChange={this.handleChange}/>
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.hideFormModal} disabled={isSaving}>Annulla</Button>
                        <Button variant="primary" onClick={this.handleSave} disabled={isSaving}>Salva</Button>
                    </Modal.Footer>
                </Modal>

                <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                    <p>Sei sicuro di voler eliminare la seguente associazione?</p>
                    <ul>
                        <li>{subjectServiceToDelete.idSoggettoServizio} - {subjectServiceToDelete.descrizioneServizio}</li>
                    </ul>
                </ConfirmationModal>
            </div>
        );
    }
}
