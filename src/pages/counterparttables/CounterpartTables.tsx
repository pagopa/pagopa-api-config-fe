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
    cpts: any;
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
    cptToDelete: any;
    cptIndex: number;
}

export default class CounterpartTables extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: {[item: string]: any};

    constructor(props: IProps) {
        super(props);

        this.state = {
            cpts: [],
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
            cptToDelete: {},
            cptIndex: -1,
        };

        this.filter = {
            name: {
                visible: true,
                placeholder: "Codice TC"
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
                apiClient.getCounterpartTables({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    limit: 10,
                    page,
                    idcounterparttable: this.state.filters.name,
                    creditorinstitutioncode: this.state.filters.code
                }).then((response: any) => {
                    this.setState({
                        cpts: response.right.value.counterpart_tables,
                        page_info: response.right.value.page_info
                    });
                })
                    .catch(() => {
                        toast.error("Problema nel recuperare le tabelle delle controparti", {theme: "colored"});
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
            axios.post(baseUrl + basePath + "/counterparttables", data, config).then(() => {
                toast.info("File Tabella delle Controparti caricato con successo");
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

    handleDetails(cpt: any) {
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
            const url = `${String(baseUrl)}${String(basePath)}/counterparttables/${cpt.id_counterpart_table}?creditorinstitutioncode=${cpt.creditor_institution_code}`;
            axios.get(url, config)
            .then((res: any) => {
                if (res.data.size > 1) {
                    const objectUrl = window.URL.createObjectURL(res.data);
                    // eslint-disable-next-line functional/immutable-data
                    anchor.href = objectUrl;
                    // eslint-disable-next-line functional/immutable-data
                    anchor.download = "cpt_" + String(cpt.id_counterpart_table).replace(" ", "_") + "_" + String(cpt.creditor_institution_code).replace(" ", "_") + '.xml';
                    anchor.click();
                    window.URL.revokeObjectURL(objectUrl);
                }
                else {
                    toast.warn("Problemi nella generazione della tabella delle controparti richiesta.", {theme: "colored"});
                }
            })
            .catch(() => {
                toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
            });
        });
    }

    handleDelete(channel: string, index: number) {
        this.setState({showDeleteModal: true});
        this.setState({cptToDelete: channel});
        this.setState({cptIndex: index});
    }

    removeCdi() {
        const filteredCpts = this.state.cpts.filter((item: any) => item.id_counterpart_table !== this.state.cptToDelete.id_counterpart_table);
        this.setState({cpts: filteredCpts});

        if (filteredCpts.length === 0 && this.state.page_info.total_pages > 1) {
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
                    apiClient.deleteCounterpartTable({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        idcounterparttable: this.state.cptToDelete.id_counterpart_table,
                        creditorinstitutioncode: this.state.cptToDelete.creditor_institution_code
                    })
                        .then((res: any) => {
                            if (res.right.status === 200) {
                                toast.info("Rimozione avvenuta con successo");
                                this.removeCdi();
                            } else {
                                this.toastError(res.right.value.detail);
                            }
                        })
                        .catch(() => {
                            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                        });
                });
        }
        this.setState({showDeleteModal: false});
    };

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    handleFilterCallback = (filters: any) => {
        this.setState({filters});
        this.getPage(0);
    };

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const pageInfo = this.state.page_info;
        const showDeleteModal = this.state.showDeleteModal;
        const cptToDeleteName = String(this.state.cptToDelete.id_counterpart_table) + " per EC: " + String(this.state.cptToDelete.business_name) + " (" +
                String(this.state.cptToDelete.creditor_institution_code) + ")";

        const cptList = this.state.cpts.map((cpt: any, index: number) =>
            (
                    <tr key={index}>
                        <td>{cpt.id_counterpart_table}</td>
                        <td>{cpt.business_name}</td>
                        <td>{cpt.creditor_institution_code}</td>
                        <td>{cpt.publication_date.toLocaleString()}</td>
                        <td>{cpt.validity_date.toLocaleString()}</td>

                        <td className="text-right">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-details-${index}`}>Scarica</Tooltip>}>
                                <FaCloudDownloadAlt role="button" className="mr-3"
                                       onClick={() => this.handleDetails(cpt)}/>
                            </OverlayTrigger>
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                                <FaTrash role="button" className="mr-3" onClick={() => this.handleDelete(cpt, index)}/>
                            </OverlayTrigger>
                        </td>
                    </tr>
            )
        );

        return (
                <div className="container-fluid cpts">
                    <div className="row">
                        <div className="col-md-10 mb-3">
                            <h2>Tabella delle Controparti</h2>
                        </div>
                        <div className="col-md-2 text-right">
                            <Button onClick={this.create}>Nuovo <FaPlus/></Button>
                            {/* eslint-disable-next-line functional/immutable-data */}
                            <Form.Control id="fileUploader" className="hidden" type="file" accept=".xml" onChange={this.upload} onClick={(e: any) => (e.target.value = null)} />
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
                                                        Codice Tabella delle Controparti
                                                    </th>
                                                    <th className="">
                                                        EC
                                                    </th>
                                                    <th className="fixed-td-width">
                                                        Codice EC
                                                    </th>
                                                    <th className="fixed-td-width">
                                                        Data pubblicazione
                                                    </th>
                                                    <th className="fixed-td-width">
                                                        Data validità
                                                    </th>
                                                    <th className="fixed-td-width-sm text-center" />
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {cptList}
                                                </tbody>
                                            </Table>

                                            <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange}/>
                                        </>
                                )
                            }
                        </div>
                    </div>
                    <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                        <p>Sei sicuro di voler eliminare la seguente tabella delle controparti?</p>
                        <ul>
                            <li>{cptToDeleteName}</li>
                        </ul>
                    </ConfirmationModal>

                </div>
        );
    }
}
