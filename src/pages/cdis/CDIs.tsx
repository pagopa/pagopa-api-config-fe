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
    cdis: any;
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
    cdiToDelete: any;
    cdiIndex: number;
}

export default class Cdis extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: {[item: string]: any};

    constructor(props: IProps) {
        super(props);

        this.state = {
            cdis: [],
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
            cdiToDelete: {},
            cdiIndex: -1,
        };

        this.filter = {
            name: {
                visible: true,
                placeholder: "Codice CDI"
            },
            code: {
                visible: true,
                placeholder: "Codice PSP"
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
                apiClient.getCdis({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    limit: 10,
                    page,
                    idcdi: this.state.filters.name,
                    pspcode: this.state.filters.code
                }).then((response: any) => {
                    this.setState({
                        cdis: response.right.value.cdis,
                        page_info: response.right.value.page_info
                    });
                })
                    .catch(() => {
                        toast.error("Problema nel recuperare i cdi", {theme: "colored"});
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
            axios.post(baseUrl + basePath + "/cdis", data, config).then(() => {
                toast.info("File CDI caricato con successo");
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

    handleDetails(cdi: any) {
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
            const url = `${String(baseUrl)}${String(basePath)}/cdis/${cdi.id_cdi}?pspcode=${cdi.psp_code}`;
            axios.get(url, config)
            .then((res: any) => {
                if (res.data.size > 1) {
                    const objectUrl = window.URL.createObjectURL(res.data);
                    // eslint-disable-next-line functional/immutable-data
                    anchor.href = objectUrl;
                    // eslint-disable-next-line functional/immutable-data
                    anchor.download = "cdi_" + String(cdi.id_cdi).replace(" ", "_") + "_" + String(cdi.psp_code).replace(" ", "_") + '.xml';
                    anchor.click();
                    window.URL.revokeObjectURL(objectUrl);
                }
                else {
                    toast.warn("Problemi nella generazione del CDI richiesto.", {theme: "colored"});
                }
            })
            .catch(() => {
                toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
            });
        });
    }

    handleDelete(channel: string, index: number) {
        this.setState({showDeleteModal: true});
        this.setState({cdiToDelete: channel});
        this.setState({cdiIndex: index});
    }

    removeCdi() {
        const filteredCdis = this.state.cdis.filter((item: any) => item.id_cdi !== this.state.cdiToDelete.id_cdi);
        this.setState({cdis: filteredCdis});

        if (filteredCdis.length === 0 && this.state.page_info.total_pages > 1) {
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
                    apiClient.deleteCdi({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        idcdi: this.state.cdiToDelete.id_cdi,
                        pspcode: this.state.cdiToDelete.psp_code
                    })
                        .then((res: any) => {
                            if (res.right.status === 200) {
                                toast.info("Rimozione avvenuta con successo");
                                this.removeCdi();
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
        const cdiToDeleteName = String(this.state.cdiToDelete.id_cdi) + " per PSP: " + String(this.state.cdiToDelete.business_name) + " (" +
                String(this.state.cdiToDelete.psp_code) + ")";

        const cdiList = this.state.cdis.map((cdi: any, index: number) =>
            (
                    <tr key={index}>
                        <td>{cdi.id_cdi}</td>
                        <td>{cdi.business_name}</td>
                        <td>{cdi.psp_code}</td>
                        <td>{cdi.publication_date.toLocaleString()}</td>
                        <td>{cdi.validity_date.toLocaleString()}</td>

                        <td className="text-right">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-details-${index}`}>Scarica</Tooltip>}>
                                <FaCloudDownloadAlt role="button" className="mr-3"
                                       onClick={() => this.handleDetails(cdi)}/>
                            </OverlayTrigger>
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                {/* eslint-disable-next-line sonarjs/no-redundant-boolean */}
                                <FaTrash role="button" className="mr-3" onClick={() => this.handleDelete(cdi, index)}/>
                            </OverlayTrigger>
                        </td>
                    </tr>
            )
        );

        return (
                <div className="container-fluid cdis">
                    <div className="row">
                        <div className="col-md-10 mb-3">
                            <h2>Catalogo Dati Informativi</h2>
                        </div>
                        <div className="col-md-2 text-right">
                            <Button onClick={this.create}>Nuovo <FaPlus/></Button>
                            {/* eslint-disable-next-line functional/immutable-data */}
                            <Form.Control id="fileUploader" className="hidden" type="file" accept=".xml" onChange={this.upload} onClick={(e: any) => (e.target.value = null)} />
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
                                                        Codice CDI
                                                    </th>
                                                    <th className="">
                                                        PSP
                                                    </th>
                                                    <th className="fixed-td-width">
                                                        Codice PSP
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
                                                {cdiList}
                                                </tbody>
                                            </Table>

                                            <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange}/>
                                        </>
                                )
                            }
                        </div>
                    </div>
                    <ConfirmationModal show={showDeleteModal} handleClose={this.hideDeleteModal}>
                        <p>Sei sicuro di voler eliminare il seguente catalogo dati informativi?</p>
                        <ul>
                            <li>{cdiToDeleteName}</li>
                        </ul>
                    </ConfirmationModal>

                </div>
        );
    }
}
