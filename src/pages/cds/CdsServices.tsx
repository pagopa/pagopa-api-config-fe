import React from 'react';
import {Button, Form, Modal, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaEdit, FaPlus, FaSpinner, FaTrash} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import Paginator from "../../components/Paginator";
import {loginRequest} from "../../authConfig";
import {extractErrorMessage} from "../../util/apiErrors";
import {CdsServizio} from '../../../generated/api/CdsServizio';


/* eslint-disable @typescript-eslint/no-empty-interface */
interface IProps {
}

interface IState {
    services: Array<CdsServizio>;
    isLoading: boolean;
    showFormModal: boolean;
    isEditing: boolean;
    formData: CdsServizio;
    showDeleteModal: boolean;
    serviceToDelete: CdsServizio;
    currentPage: number;
}

const PAGE_SIZE = 10;

const emptyService: CdsServizio = {
    idServizio: "",
    descrizioneServizio: "",
    xsdRiferimento: "",
    categoriaId: undefined,
    version: 0
};

export default class CdsServices extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            services: [],
            isLoading: false,
            showFormModal: false,
            isEditing: false,
            formData: {...emptyService},
            showDeleteModal: false,
            serviceToDelete: {},
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
                apiClient.getCdsServices({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: ""
                })
                    .then((res: any) => {
                        if (res.right.status === 200) {
                            const services = [...res.right.value].sort((a: CdsServizio, b: CdsServizio) =>
                                (a.idServizio ?? "").localeCompare(b.idServizio ?? ""));
                            const totalPages = Math.max(Math.ceil(services.length / PAGE_SIZE), 1);
                            const currentPage = Math.min(this.state.currentPage, totalPages - 1);
                            this.setState({services, currentPage});
                        } else {
                            this.toastError(res.right.value.detail);
                        }
                    })
                    .catch(() => {
                        toast.error("Problema nel recuperare i servizi", {theme: "colored"});
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
            formData: {...emptyService}
        });
    }

    handleEdit(service: CdsServizio) {
        this.setState({
            showFormModal: true,
            isEditing: true,
            formData: {...service}
        });
    }

    handleChange(event: any) {
        const {name, value} = event.target;
        const formData = {...this.state.formData};
        const numericFields = ["categoriaId", "version"];
        // eslint-disable-next-line functional/immutable-data
        (formData as any)[name] = numericFields.includes(name) ? (value === "" ? undefined : Number(value)) : value;
        this.setState({formData});
    }

    hideFormModal() {
        this.setState({
            showFormModal: false,
            formData: {...emptyService}
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
                    ? apiClient.updateCdsService({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        idservizio: formData.idServizio as string,
                        body: formData
                    })
                    : apiClient.createCdsService({
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

    handleDelete(service: CdsServizio) {
        this.setState({
            showDeleteModal: true,
            serviceToDelete: service
        });
    }

    hideDeleteModal(status: string) {
        if (status === "ok") {
            const service = this.state.serviceToDelete;

            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    apiClient.deleteCdsService({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        idservizio: service.idServizio as string
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
        this.setState({showDeleteModal: false, serviceToDelete: {}});
    }

    render(): React.ReactNode {
        const {services, isLoading, showFormModal, isEditing, formData, showDeleteModal, serviceToDelete, currentPage} = this.state;

        const totalPages = Math.max(Math.ceil(services.length / PAGE_SIZE), 1);
        const pagedServices = services.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
        const pageInfo = {
            page: currentPage,
            limit: PAGE_SIZE,
            items_found: pagedServices.length,
            total_pages: totalPages,
            total_items: services.length
        };

        return (
            <div className="cds-services">
                <div className="row">
                    <div className="col-md-10">
                        <p>Elenco dei servizi censiti nel Catalogo Dati Servizi.</p>
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
                                    <th>ID Servizio</th>
                                    <th className="text-left">Descrizione</th>
                                    <th>XSD Riferimento</th>
                                    <th>Categoria</th>
                                    <th>Versione</th>
                                    <th className="buttons-td-width"/>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    pagedServices.map((service: CdsServizio, index: number) => (
                                        <tr key={service.id ?? index}>
                                            <td>{service.idServizio}</td>
                                            <td className="text-left">{service.descrizioneServizio}</td>
                                            <td>{service.xsdRiferimento}</td>
                                            <td>{service.categoria?.description ?? service.categoriaId}</td>
                                            <td>{service.version}</td>
                                            <td className="text-right">
                                                <OverlayTrigger placement="top"
                                                                overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                                                    <FaEdit role="button" className="mr-3"
                                                            onClick={() => this.handleEdit(service)}/>
                                                </OverlayTrigger>
                                                <OverlayTrigger placement="top"
                                                                overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                                    <FaTrash role="button" className="mr-0"
                                                             onClick={() => this.handleDelete(service)}/>
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
                        <Modal.Title>{isEditing ? "Modifica Servizio" : "Nuovo Servizio"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group>
                                <Form.Label>ID Servizio</Form.Label>
                                <Form.Control name="idServizio" value={formData.idServizio ?? ""}
                                              disabled={isEditing}
                                              onChange={this.handleChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Descrizione</Form.Label>
                                <Form.Control name="descrizioneServizio" value={formData.descrizioneServizio ?? ""}
                                              onChange={this.handleChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>XSD Riferimento</Form.Label>
                                <Form.Control name="xsdRiferimento" value={formData.xsdRiferimento ?? ""}
                                              onChange={this.handleChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Categoria (ID)</Form.Label>
                                <Form.Control name="categoriaId" type="number"
                                              value={formData.categoriaId ?? ""}
                                              onChange={this.handleChange}/>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Versione</Form.Label>
                                <Form.Control name="version" type="number" value={formData.version ?? ""}
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
                    <p>Sei sicuro di voler eliminare il seguente servizio?</p>
                    <ul>
                        <li>{serviceToDelete.idServizio} - {serviceToDelete.descrizioneServizio}</li>
                    </ul>
                </ConfirmationModal>
            </div>
        );
    }
}
