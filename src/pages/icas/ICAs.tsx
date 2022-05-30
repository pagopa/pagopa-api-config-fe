import React from 'react';
import {Button, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaPlus, FaSpinner, FaTrash, FaCloudDownloadAlt} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import axios, {AxiosRequestConfig} from "axios";
import {apiClient} from "../../util/apiClient";
import Paginator from "../../components/Paginator";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import Filters from "../../components/Filters";
import {getConfig} from "../../util/config";

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    icas: any;
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
    icaToDelete: any;
    icaIndex: number;
}

export default class Icas extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: {[item: string]: any};

    constructor(props: IProps) {
        super(props);

        this.state = {
            icas: [],
            page_info: {
                page: 0,
                limit: 50,
                items_found: 0,
                total_pages: 1
            },
            filters: {
                code: "",
                name: ""
            },
            isLoading: false,
            showDeleteModal: false,
            icaToDelete: {},
            icaIndex: -1,
        };

        this.filter = {
            name: {
                visible: true,
                placeholder: "Codice ICA"
            },
            code: {
                visible: true,
                placeholder: "Codice EC"
            }
        };

        this.handlePageChange = this.handlePageChange.bind(this);
        this.create = this.create.bind(this);
        this.upload = this.upload.bind(this);
    }

    getPage(page: number) {
        this.setState({isLoading: true});

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getIcas({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    limit: 10,
                    page,
                    idica: this.state.filters.name,
                    creditorinstitutioncode: this.state.filters.code
                }).then((response: any) => {
                    this.setState({
                        icas: response.right.value.icas,
                        page_info: response.right.value.page_info
                    });
                })
                    .catch(() => {
                        toast.error("Problema nel recuperare le ica", {theme: "colored"});
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
        const element = document.getElementById("fileUploader");
        if (element) {
            element.click();
        }
    }

    upload(event: any) {
        const file = event.target.files[0];
        const data = new FormData();
        data.append("file", file);

        const baseUrl = getConfig("APICONFIG_HOST") as string;
        const basePath = getConfig("APICONFIG_BASEPATH") as string;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        }).then((response: any) => {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${response.idToken}`
                }
            };
            axios.post(baseUrl + basePath + "/icas", data, config).then(() => {
                toast.info("File ICA caricato con successo");
                this.getPage(0);
            }).catch((err) => {
                if (err.response.status === 409) {
                    toast.error("Problema di conflitto nell'upload del file", {theme: "colored"});
                }
                else {
                    if (err.response.data.detail) {
                        toast.error(`Problema nell'upload del file. ${String(err.response.data.detail)}`, {theme: "colored"});
                    }
                    else {
                        toast.error("Problema nell'upload del file.", {theme: "colored"});
                    }
                }
            });
        });
    }

    handlePageChange(requestedPage: number) {
        this.getPage(requestedPage);
    }

    handleDetails(ica: any) {
        const baseUrl = getConfig("APICONFIG_HOST") as string;
        const basePath = getConfig("APICONFIG_BASEPATH") as string;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        }).then((response: any) => {
            const config = {
                headers: {
                    Authorization: `Bearer ${response.idToken}`
                },
                responseType: 'blob'
            } as AxiosRequestConfig;
            const anchor = document.createElement("a");
            document.body.appendChild(anchor);
            const url = `${String(baseUrl)}${String(basePath)}/icas/${ica.id_ica}?creditorinstitutioncode=${ica.creditor_institution_code}`;
            axios.get(url, config)
            .then((res: any) => {
                if (res.data.size > 1) {
                    const objectUrl = window.URL.createObjectURL(res.data);
                    // eslint-disable-next-line functional/immutable-data
                    anchor.href = objectUrl;
                    // eslint-disable-next-line functional/immutable-data
                    anchor.download = "ica_" + String(ica.id_ica).replace(" ", "_") + '.xml';
                    anchor.click();
                    window.URL.revokeObjectURL(objectUrl);
                }
                else {
                    toast.warn("Problemi nella generazione dell'ICA richiesto.", {theme: "colored"});
                }
            })
            .catch(() => {
                toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
            });
        });
    }

    handleDelete(channel: string, index: number) {
        this.setState({showDeleteModal: true});
        this.setState({icaToDelete: channel});
        this.setState({icaIndex: index});
    }

    removeIca() {
        const filteredIcas = this.state.icas.filter((item: any) => item.id_ica !== this.state.icaToDelete.id_ica);
        this.setState({icas: filteredIcas});

        if (filteredIcas.length === 0 && this.state.page_info.total_pages > 1) {
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
                        apiClient.deleteIca({
                            Authorization: `Bearer ${response.idToken}`,
                            ApiKey: "",
                            idica: this.state.icaToDelete.id_ica,
                            creditorinstitutioncode: this.state.icaToDelete.creditor_institution_code
                        })
                            .then((res: any) => {
                                if (res.right.status === 200) {
                                    toast.info("Rimozione avvenuta con successo");
                                    this.removeIca();
                                }
                                else if(res.right.value.status === 409){
                                    toast.error("Non è possibile cancellare un file ICA in corso di validità.", {theme: "colored"});
                                }
                                else {
                                    toast.error(res.right.value.details, {theme: "colored"});
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
        const icaList: any = [];
        const icaToDeleteName = String(this.state.icaToDelete.id_ica) + " per EC: " + String(this.state.icaToDelete.business_name) + " (" +
                String(this.state.icaToDelete.creditor_institution_code) + ")";

        this.state.icas.map((ica: any, index: number) => {
            const code = (
                    <tr key={index}>
                        <td>{ica.id_ica}</td>
                        <td>{ica.business_name}</td>
                        <td>{ica.creditor_institution_code}</td>
                        <td>{ica.publication_date.toLocaleString()}</td>
                        <td>{ica.validity_date.toLocaleString()}</td>

                        <td className="text-right">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-details-${index}`}>Scarica</Tooltip>}>
                                <FaCloudDownloadAlt role="button" className="mr-3"
                                       onClick={() => this.handleDetails(ica)}/>
                            </OverlayTrigger>
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                                <FaTrash role="button" className="mr-3" onClick={() => this.handleDelete(ica, index)}/>
                            </OverlayTrigger>
                        </td>
                    </tr>
            );
            icaList.push(code);
        });

        return (
                <div className="container-fluid icas">
                    <div className="row">
                        <div className="col-md-10 mb-3">
                            <h2>Informativa Conto Accredito</h2>
                        </div>
                        <div className="col-md-2 text-right">
                            <Button onClick={this.create}>Nuovo <FaPlus/></Button>
                            <Form.Control id="fileUploader" className="hidden" type="file" accept=".xml" onChange={this.upload} />
                        </div>
                        <div className="col-md-12">
                            <div className="row">
                                <div className="col-md-8">
                                    <Filters configuration={this.filter} onFilter={this.handleFilterCallback} />
                                </div>
                            </div>
                            {isLoading && (<FaSpinner className="spinner"/>)}
                            {
                                !isLoading && (
                                        <>
                                            <Table hover responsive size="sm">
                                                <thead>
                                                <tr>
                                                    <th className="fixed-td-width">
                                                        Codice ICA
                                                    </th>
                                                    <th className="">
                                                        Ente Creditore
                                                    </th>
                                                    <th className="fixed-td-width">
                                                        Codice Ente Creditore
                                                    </th>
                                                    <th className="fixed-td-width">
                                                        Data pubblicazione
                                                    </th>
                                                    <th className="fixed-td-width">
                                                        Data validità
                                                    </th>
                                                    <th className="text-center" />
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {icaList}
                                                </tbody>
                                            </Table>

                                            <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange}/>
                                        </>
                                )
                            }
                        </div>
                    </div>
                    <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                        <p>Sei sicuro di voler eliminare la seguente informativa?</p>
                        <ul>
                            <li>{icaToDeleteName}</li>
                        </ul>
                    </ConfirmationModal>

                </div>
        );
    }
}
