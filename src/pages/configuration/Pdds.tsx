import React from 'react';
import {Button, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaEdit, FaPlus, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import Filters from "../../components/Filters";
import Ordering from "../../components/Ordering";
import {Pdd} from "../../../generated/api/Pdd";

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    pdds: any;
    filtered_pdds: any;
    filters: {
        code: string;
        name: string;
    };
    isLoading: boolean;
    order: any;
    create: any;
    edit: any;
    delete: any;
}

export default class Pdds extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: {[item: string]: any};

    constructor(props: IProps) {
        super(props);

        this.state = {
            pdds: [],
            filtered_pdds: [],
            filters: {
                code: "",
                name: "",
            },
            isLoading: false,
            order: {
                by: "CODE",
                ing: "DESC"
            },
            create: {
                enabled: false,
                configuration: {}
            },
            edit: {
                enabled: false,
                configuration: {}
            },
            delete: {
                enabled: false,
                configuration: {}
            }
        };

        this.filter = {
            name: {
                visible: false,
                placeholder: "-"
            },
            code: {
                visible: true,
                placeholder: "ID PDD"
            }
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleOrder = this.handleOrder.bind(this);
        this.create = this.create.bind(this);
        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
    }

    getData() {
        this.setState({isLoading: true});

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getPdds({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: ""
                })
                    .then((response: any) => {
                        this.setState({
                            pdds: response.right.value.pdds,
                            filtered_pdds: response.right.value.pdds
                        });

                        this.order(this.state.order.by, this.state.order.ing);
                    })
                    .catch(() => {
                        toast.error("Problema nel recuperare i parametri di configurazione", {theme: "colored"});
                    })
                    .finally(() => {
                        this.setState({isLoading: false});
                    });
            })// eslint-disable-next-line sonarjs/no-identical-functions
                .catch(() => {
                    this.context.instance.logoutPopup({
                        postLogoutRedirectUri: "/",
                        mainWindowRedirectUri: "/"
                    }).then(() => window.sessionStorage.removeItem("secret"));
                });
    }

    componentDidMount(): void {
        this.getData();
    }

    create() {
        this.setState({
            create: {
                enabled: true,
                configuration: {
                    id_pdd: "",
                    enabled: false,
                    description: "",
                    ip: "",
                    port: 80
                }
            }
        });
    }

    handleOrder(orderBy: string, ordering: string) {
        this.setState({
            order: {
                by: orderBy,
                ing: ordering
            }
        });

        this.order(orderBy, ordering);
    }

    order(order_by: string, order_ing: string) {
        const confList = this.state.filtered_pdds;
        const ordering = order_ing === "DESC" ? 1 : -1;
        if (order_by === "CODE") {
            confList.sort((a: any, b: any) => a.id_pdd.toLowerCase() < b.id_pdd.toLowerCase() ? ordering : -ordering);
        }

        this.setState({filtered_pdds: confList});
    }

    discard(operation: string, configuration: Pdd | null) {
        if (operation === "edit") {
            this.setConfigurationParam(configuration as Pdd, "enabled", this.state.edit.configuration.enabled);
            this.setConfigurationParam(configuration as Pdd, "description", this.state.edit.configuration.description);
            this.setConfigurationParam(configuration as Pdd, "ip", this.state.edit.configuration.ip);
            this.setConfigurationParam(configuration as Pdd, "port", this.state.edit.configuration.port);
            this.setState({
                edit: {
                    enabled: false,
                    configuration: {}
                }
            });
        }
        else {
            this.setState({
                create: {
                    enabled: false,
                    configuration: {}
                }
            });
        }
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    edit(configuration: Pdd) {
        const port = configuration.port as number;
        if (port < 1 || port > 65535) {
            this.toastError("La porta deve avere un valore compreso tra 1 e 65535.");
            return;
        }

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updatePdd({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    id_pdd: configuration.id_pdd,
                    body: configuration
                })
                    .then((res: any) => {
                        if (res.right.status === 200) {
                            toast.info("Salvataggio avvenuto con successo");
                        } else {
                            this.discard("edit", configuration);
                            this.toastError(res.right.value.detail);
                        }
                    })
                    .catch(() => {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    })
                    .finally(() => {
                        this.setState({
                            edit: {
                                enabled: false,
                                configuration: {}
                            }
                        });
                    });
            })// eslint-disable-next-line sonarjs/no-identical-functions
                .catch(() => {
                    this.context.instance.logoutPopup({
                        postLogoutRedirectUri: "/",
                        mainWindowRedirectUri: "/"
                    }).then(() => window.sessionStorage.removeItem("secret"));
                });
    }

    save() {
        if (this.state.create.configuration.port < 1 || this.state.create.configuration.port > 65535) {
            this.toastError("La porta deve avere un valore compreso tra 1 e 65535.");
            return;
        }

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createPdd({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    body: this.state.create.configuration
                })
                    .then((res: any) => {
                        if (res.right.status === 201) {
                            toast.info("Salvataggio avvenuto con successo");
                            const cList = this.state.pdds;
                            cList.push(res.right.value);
                            this.setState({
                                pdds: cList
                            });
                            this.handleFilterCallback(this.state.filters);
                        } else {
                            this.toastError(res.right.value.detail);
                        }
                    })
                    .catch(() => {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    })
                    .finally(() => {
                        this.setState({
                            create: {
                                enabled: false,
                                configuration: {}
                            }
                        });
                    });
            })// eslint-disable-next-line sonarjs/no-identical-functions
                .catch(() => {
                    this.context.instance.logoutPopup({
                        postLogoutRedirectUri: "/",
                        mainWindowRedirectUri: "/"
                    }).then(() => window.sessionStorage.removeItem("secret"));
                });
    }

    handleEdit(configuration: Pdd) {
        this.setState({
            edit: {
                enabled: true,
                configuration: {...configuration}
            }
        });
    }

    handleDelete(configuration: Pdd) {
        this.setState({
            delete: {
                enabled: true,
                configuration
            }
        });
    }

    removeConfiguration(configuration: Pdd) {
        const cList = this.state.pdds.filter((c: Pdd) => c.id_pdd !== configuration.id_pdd);
        this.setState({
            pdds: cList
        });
        this.handleFilterCallback(this.state.filters);
    }

    hideDeleteModal = (status: string) => {
        if (status === "ok") {
            const configuration = {...this.state.delete.configuration};
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    apiClient.deletePdd({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        id_pdd: configuration.id_pdd
                    })
                        .then((res: any) => {
                            if (res.right.status === 200) {
                                toast.info("Rimozione avvenuta con successo");
                                this.removeConfiguration(configuration);
                            } else {
                                this.toastError(res.right.value.detail);
                            }
                        })
                        .catch(() => {
                            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                        });
                })// eslint-disable-next-line sonarjs/no-identical-functions
                    .catch(() => {
                        this.context.instance.logoutPopup({
                            postLogoutRedirectUri: "/",
                            mainWindowRedirectUri: "/"
                        }).then(() => window.sessionStorage.removeItem("secret"));
                    });
        }
        this.setState({
            delete: {
                enabled: false,
                configuration: {}
            }
        });
    };

    handleInput(event: any) {
        const configuration = this.state.create.configuration;
        // eslint-disable-next-line functional/immutable-data
        configuration[event.target.name] = event.target.value;
        this.setState({
            create:{
                enabled: true,
                configuration
            }
        });
    }

    handleChange(event: any, configuration: Pdd) {
        this.setConfigurationParam(configuration, event.target.name, event.target.value);
    }

    setConfigurationParam(configuration: Pdd, key: string, value: string) {
        const cList = this.state.filtered_pdds.map((c: any) => {
            if (c.id_pdd === configuration.id_pdd) {
                // eslint-disable-next-line functional/immutable-data
                c[key] = value;
            }
            return c;
        });
        this.setState({filtered_pdds: cList});
    }

    handleFilterCallback = (filters: any) => {
        this.setState({filters});

        if (this.filter.code.visible && "code" in filters) {
            this.setState({
                filtered_pdds: this.state.pdds.filter((c: Pdd) => c.id_pdd.toLowerCase().includes(filters.code.toLowerCase()))
            });
        }

        this.order(this.state.order.by, this.state.order.ing);
    };

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const pdds: any = [];

        this.state.filtered_pdds.map((configuration: any) => {
            const index = String(configuration.id_pdd);
            const readOnly = (!this.state.edit.enabled || (this.state.edit.enabled && this.state.edit.configuration.id_pdd !== configuration.id_pdd));
            const code = (
                <tr key={configuration.id_pdd}>
                    <td className="key-td-width">{configuration.id_pdd}</td>
                    <td className="text-center">
                        {readOnly &&
						<>
                            {configuration.enabled && <FaCheck className="text-success"/>}
                            {!configuration.enabled && <FaTimes className="text-danger"/>}
						</>
                        }
                        {!readOnly &&
							<Form.Control as="select" name="enabled" placeholder="stato"
										  onChange={(e) => this.handleChange(e, configuration)}
										  defaultValue={String(configuration.enabled)}>
								<option value="true">Abilitato</option>
								<option value="false">Non Abilitato</option>
							</Form.Control>
                        }
                    </td>
                    <td className="description-td-width text-left">
                        {readOnly && configuration.description}
                        {!readOnly &&
							<Form.Control name="description" placeholder="" value={configuration.description} onChange={(e) => this.handleChange(e, configuration)}/>
                        }
                    </td>
                    <td className="text-left">
                        {readOnly && configuration.ip
                        }
                        {!readOnly &&
							<Form.Control name="ip" placeholder="" value={configuration.ip} onChange={(e) => this.handleChange(e, configuration)}/>
                        }
                    </td>
                    <td className="description-td-width text-left">
                        {readOnly && configuration.port}
                        {!readOnly &&
                            <Form.Control name="port" placeholder="" value={configuration.port} onChange={(e) => this.handleChange(e, configuration)}/>
                        }
                    </td>
                    <td className="text-right">
                        {readOnly &&
						<>
                            <OverlayTrigger placement="top"
										  overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
							<FaEdit role="button" className="mr-1"
									onClick={() => this.handleEdit(configuration)}/>
                            </OverlayTrigger>
                            <OverlayTrigger placement="top" overlay={
                                <Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>
                            }>
                                <FaTrash role="button" className="mr-0"
                                         onClick={() => this.handleDelete(configuration)}/>
                            </OverlayTrigger>
                        </>
                        }
                        {!readOnly &&
                        <div className="row">
							<div className="col-md-12">
								<Button className="ml-2 float-md-right" variant="secondary" size={"sm"}
										onClick={() => {
                                            this.discard("edit", configuration);
                                        }}>Annulla</Button>
								<Button className="float-md-right" size={"sm"} onClick={() => {
                                    this.edit(configuration);
                                }}>Salva</Button>
							</div>
						</div>
                        }
                    </td>
                </tr>
            );
            pdds.push(code);
        });

        return (
            <div className="container-fluid configuration">
                <div className="row">
                    <div className="col-md-10 mb-3">
                        <h2>Porte di Dominio</h2>
                    </div>
                     <div className="col-md-2 text-right">
                        <Button onClick={this.create}>Nuovo <FaPlus/></Button>
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
                                            <th className="key-td-width">
                                                <Ordering currentOrderBy={this.state.order.by} currentOrdering={this.state.order.ing} orderBy={"CODE"} ordering={"DESC"} handleOrder={this.handleOrder} />
                                                ID PDD
                                            </th>
                                            <th className="text-center">Abilitato</th>
                                            <th className="description-td-width text-left">Descrizione</th>
                                            <th className="text-left">IP</th>
                                            <th className="text-left">Porta</th>
                                            <th className="buttons-td-width" />
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {
                                            this.state.create.enabled &&
                                            <tr>
												<td className="key-td-width">
													<Form.Control name="id_pdd" placeholder="ID PDD"
																  value={this.state.create.configuration.id_pdd}
																  onChange={(e) => this.handleInput(e)}/>
                                                </td>
												<td>
													<Form.Control as="select" name="enabled" placeholder="Stato"
																  onChange={(e) => this.handleInput(e)}
																  defaultValue={String(this.state.create.configuration.enabled)}>
														<option value="true">Abilitato</option>
														<option value="false">Non Abilitato</option>
													</Form.Control>
												</td>
												<td className="description-td-width text-left">
                                                    <Form.Control name="description" placeholder="Descrizione"
                                                                  value={this.state.create.configuration.description}
                                                                  onChange={(e) => this.handleInput(e)}/>
												</td>
												<td className="text-left">
													<Form.Control name="ip" placeholder="IP"
																  value={this.state.create.configuration.ip}
																  onChange={(e) => this.handleInput(e)}/>
												</td>
												<td className="text-left">
													<Form.Control name="port" placeholder="Porta" type="number" min={1} max={65535}
																  value={this.state.create.configuration.port}
																  onChange={(e) => this.handleInput(e)}/>
												</td>
												<td className="text-right">
                                                    <div className="row">
														<div className="col-md-12">
															<Button className="ml-2 float-md-right" variant="secondary" size={"sm"}
																	onClick={() => {
                                                                        this.discard("create", null);
                                                                    }}>Annulla</Button>
															<Button className="float-md-right" size={"sm"} onClick={() => {
                                                                this.save();
                                                            }}>Salva</Button>
														</div>
													</div>

												</td>
                                            </tr>
                                        }

                                        {pdds}
                                        </tbody>
                                    </Table>
                                </>
                            )
                        }
                    </div>
                </div>
                <ConfirmationModal show={this.state.delete.enabled} handleClose={this.hideDeleteModal}>
                    <p>Sei sicuro di voler eliminare la seguente configurazione?</p>
                    <ul>
                        <li>{this.state.delete.configuration.id_pdd}</li>
                    </ul>
                </ConfirmationModal>

            </div>
        );
    }
}
