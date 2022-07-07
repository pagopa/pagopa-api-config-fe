import React from 'react';
import {Button, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaEdit, FaPlus, FaSpinner, FaTrash} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import Filters from "../../components/Filters";
import Ordering from "../../components/Ordering";
import {WfespPluginConf} from "../../../generated/api/WfespPluginConf";

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    wfespplugins: any;
    filtered_wfespplugins: any;
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

export default class WFESPPlugins extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: {[item: string]: any};

    constructor(props: IProps) {
        super(props);

        this.state = {
            wfespplugins: [],
            filtered_wfespplugins: [],
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
                placeholder: "ID Serv Plugin"
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
                apiClient.getWfespPlugins({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: ""
                })
                    .then((response: any) => {
                        this.setState({
                            wfespplugins: response.right.value.wfesp_plugin_confs,
                            filtered_wfespplugins: response.right.value.wfesp_plugin_confs
                        });
                        this.order(this.state.order.by, this.state.order.ing);
                    })
                    .catch(() => {
                        toast.error("Problema nel recuperare i parametri di configurazione", {theme: "colored"});
                    })
                    .finally(() => {
                        this.setState({isLoading: false});
                    });
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
                    id_serv_plugin: "",
                    pag_const_string_profile: "",
                    pag_soap_rule_profile: "",
                    pag_rpt_xpath_profile: "",
                    id_bean: "",
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
        const confList = this.state.filtered_wfespplugins;
        const ordering = order_ing === "DESC" ? 1 : -1;
        if (order_by === "CODE") {
            confList.sort((a: any, b: any) => a.id_serv_plugin.toLowerCase() < b.id_serv_plugin.toLowerCase() ? ordering : -ordering);
        }

        this.setState({filtered_wfespplugins: confList});
    }

    discard(operation: string, configuration: WfespPluginConf | null) {
        if (operation === "edit") {
            this.setConfigurationParam(configuration as WfespPluginConf, "pag_const_string_profile", this.state.edit.configuration.pag_const_string_profile);
            this.setConfigurationParam(configuration as WfespPluginConf, "pag_soap_rule_profile", this.state.edit.configuration.pag_soap_rule_profile);
            this.setConfigurationParam(configuration as WfespPluginConf, "pag_rpt_xpath_profile", this.state.edit.configuration.pag_rpt_xpath_profile);
            this.setConfigurationParam(configuration as WfespPluginConf, "id_bean", this.state.edit.configuration.id_bean);
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

    edit(configuration: WfespPluginConf) {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updateWfespPlugin({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    idServPlugin: configuration.id_serv_plugin,
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
            });
    }

    save() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createWfespPlugin({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    body: this.state.create.configuration
                })
                    .then((res: any) => {
                        if (res.right.status === 201) {
                            toast.info("Salvataggio avvenuto con successo");
                            const cList = this.state.wfespplugins;
                            cList.push(res.right.value);
                            this.setState({
                                wfespplugins: cList
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
            });
    }

    handleEdit(configuration: WfespPluginConf) {
        this.setState({
            edit: {
                enabled: true,
                configuration: {...configuration}
            }
        });
    }

    handleDelete(configuration: WfespPluginConf) {
        this.setState({
            delete: {
                enabled: true,
                configuration
            }
        });
    }

    removeConfiguration(configuration: WfespPluginConf) {
        const cList = this.state.wfespplugins.filter((c: WfespPluginConf) => c.id_serv_plugin !== configuration.id_serv_plugin);
        this.setState({
            wfespplugins: cList
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
                    apiClient.deleteWfespPlugin({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        idServPlugin: configuration.id_serv_plugin
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

    handleChange(event: any, configuration: WfespPluginConf) {
        this.setConfigurationParam(configuration, event.target.name, event.target.value);
    }

    setConfigurationParam(configuration: WfespPluginConf, key: string, value: string) {
        const cList = this.state.filtered_wfespplugins.map((c: any) => {
            if (c.id_serv_plugin === configuration.id_serv_plugin) {
                // eslint-disable-next-line functional/immutable-data
                c[key] = value;
            }
            return c;
        });
        this.setState({filtered_wfespplugins: cList});
    }

    handleFilterCallback = (filters: any) => {
        this.setState({filters});

        if (this.filter.code.visible && "code" in filters) {
            this.setState({
                filtered_wfespplugins: this.state.wfespplugins.filter((c: WfespPluginConf) => c.id_serv_plugin.toLowerCase().includes(filters.code.toLowerCase()))
            });
        }
        this.order(this.state.order.by, this.state.order.ing);
    };

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const wfespplugins: any = [];

        this.state.filtered_wfespplugins.map((configuration: any) => {
            const index = String(configuration.id_serv_plugin);
            const readOnly = (!this.state.edit.enabled || (this.state.edit.enabled && this.state.edit.configuration.id_serv_plugin !== configuration.id_serv_plugin));
            const code = (
                <tr key={index}>
                    <td className="key-td-width">{configuration.id_serv_plugin}</td>
                    <td className="description-td-width text-left">
                        {readOnly && configuration.pag_const_string_profile}
                        {!readOnly &&
							<Form.Control name="pag_const_string_profile" placeholder="" value={configuration.pag_const_string_profile} onChange={(e) => this.handleChange(e, configuration)}/>
                        }
                    </td>
                    <td className="description-td-width text-left">
                        {readOnly && configuration.pag_soap_rule_profile}
                        {!readOnly &&
							<Form.Control name="pag_soap_rule_profile" placeholder="" value={configuration.pag_soap_rule_profile} onChange={(e) => this.handleChange(e, configuration)}/>
                        }
                    </td>
                    <td className="description-td-width text-left">
                        {readOnly && configuration.pag_rpt_xpath_profile}
                        {!readOnly &&
						<Form.Control name="pag_rpt_xpath_profile" placeholder="" value={configuration.pag_rpt_xpath_profile} onChange={(e) => this.handleChange(e, configuration)}/>
                        }
                    </td>
                    <td className="text-left">
                        {readOnly && configuration.id_bean}
                        {!readOnly &&
						<Form.Control name="id_bean" placeholder="" value={configuration.id_bean} onChange={(e) => this.handleChange(e, configuration)}/>
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
            wfespplugins.push(code);
        });

        return (
            <div className="container-fluid configuration">
                <div className="row">
                    <div className="col-md-10 mb-3">
                        <h2>WFESP Plugin</h2>
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
                                                ID Serv Plugin
                                            </th>
                                            <th className="description-td-width text-left">Profilo PAG Const String</th>
                                            <th className="description-td-width text-left">Profilo PAG SOAP Rule</th>
                                            <th className="description-td-width text-left">Profilo PAG RPT XPath</th>
                                            <th className="text-left">ID Bean</th>
                                            <th className="buttons-td-width" />
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {
                                            this.state.create.enabled &&
                                            <tr>
												<td className="key-td-width">
													<Form.Control name="id_serv_plugin" placeholder="ID Serv Plugin"
																  value={this.state.create.configuration.id_serv_plugin}
																  onChange={(e) => this.handleInput(e)}/>
                                                </td>
												<td className="description-td-width text-left">
													<Form.Control name="pag_const_string_profile" placeholder="Profilo PAG Const String"
																  value={this.state.create.configuration.pag_const_string_profile}
																  onChange={(e) => this.handleInput(e)}/>
												</td>
												<td className="description-td-width text-left">
													<Form.Control name="pag_soap_rule_profile" placeholder="Profilo PAG SOAP Rule"
																  value={this.state.create.configuration.pag_soap_rule_profile}
																  onChange={(e) => this.handleInput(e)}/>
												</td>
												<td className="description-td-width text-left">
													<Form.Control name="pag_rpt_xpath_profile" placeholder="Profilo PAG RPT XPath"
																  value={this.state.create.configuration.pag_rpt_xpath_profile}
																  onChange={(e) => this.handleInput(e)}/>
												</td>
												<td className="text-left">
													<Form.Control name="id_bean" placeholder="Id Bean"
																  value={this.state.create.configuration.id_bean}
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

                                        {wfespplugins}
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
                        <li>{this.state.delete.configuration.id_serv_plugin}</li>
                    </ul>
                </ConfirmationModal>

            </div>
        );
    }
}
