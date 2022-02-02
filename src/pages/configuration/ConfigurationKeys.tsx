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
import {ConfigurationKey} from "../../../generated/api/ConfigurationKey";

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    configuration_keys: any;
    filtered_configuration_keys: any;
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

export default class ConfigurationKeys extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: {[item: string]: any};

    constructor(props: IProps) {
        super(props);

        this.state = {
            configuration_keys: [],
            filtered_configuration_keys: [],
            filters: {
                code: "",
                name: "",
            },
            isLoading: false,
            order: {
                by: "NAME",
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
                visible: true,
                placeholder: "Categoria"
            },
            code: {
                visible: true,
                placeholder: "Chiave"
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
                apiClient.getConfigurationKeys({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: ""
                })
                    .then((response: any) => {
                        this.setState({
                            configuration_keys: response.right.value.configuration_keys,
                            filtered_configuration_keys: response.right.value.configuration_keys
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
                    config_category: "",
                    config_key: "",
                    config_value: "",
                    config_description: ""
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
        const confList = this.state.filtered_configuration_keys;
        const ordering = order_ing === "DESC" ? 1 : -1;
        if (order_by === "NAME") {
            confList.sort((a: any, b: any) => a.config_category.toLowerCase() < b.config_category.toLowerCase() ? ordering : -ordering);
        }
        else {
            confList.sort((a: any, b: any) => a.config_key.toLowerCase() < b.config_key.toLowerCase() ? ordering : -ordering);
        }

        this.setState({filtered_configuration_keys: confList});
    }

    discard(operation: string, configuration: ConfigurationKey | null) {
        if (operation === "edit") {
            this.setConfigurationParam(configuration as ConfigurationKey, "config_value", this.state.edit.configuration.config_value);
            this.setConfigurationParam(configuration as ConfigurationKey, "config_description", this.state.edit.configuration.config_description);
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

    edit(configuration: ConfigurationKey) {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updateConfigurationKey({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    category: configuration.config_category,
                    key: configuration.config_key,
                    body: configuration
                })
                    .then((res: any) => {
                        if (res.right.status === 200) {
                            toast.info("Salvataggio avvenuto con successo");
                        } else {
                            this.discard("edit", configuration);
                            toast.error(res.right.value.detail, {theme: "colored"});
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
                apiClient.createConfigurationKey({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    body: this.state.create.configuration
                })
                    .then((res: any) => {
                        if (res.right.status === 201) {
                            toast.info("Salvataggio avvenuto con successo");
                            const cList = this.state.configuration_keys;
                            cList.push(res.right.value);
                            this.setState({
                                configuration_keys: cList
                            });
                            this.handleFilterCallback(this.state.filters);
                        } else {
                            toast.error(res.right.value.detail, {theme: "colored"});
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

    handleEdit(configuration: ConfigurationKey) {
        this.setState({
            edit: {
                enabled: true,
                configuration: {...configuration}
            }
        });
    }

    handleDelete(configuration: ConfigurationKey) {
        this.setState({
            delete: {
                enabled: true,
                configuration
            }
        });
    }

    removeConfiguration(configuration: ConfigurationKey) {
        const cList = this.state.configuration_keys.filter((c: ConfigurationKey) =>
                !(c.config_category === configuration.config_category && c.config_key === configuration.config_key));
        this.setState({
            configuration_keys: cList
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
                    apiClient.deleteConfigurationKey({
                        Authorization: `Bearer ${response.accessToken}`,
                        ApiKey: "",
                        category: configuration.config_category,
                        key: configuration.config_key
                    })
                        .then((res: any) => {
                            if (res.right.status === 200) {
                                toast.info("Rimozione avvenuta con successo");
                                this.removeConfiguration(configuration);
                            } else {
                                toast.error(res.right.value.title, {theme: "colored"});
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

    handleChange(event: any, configuration: ConfigurationKey) {
        this.setConfigurationParam(configuration, event.target.name, event.target.value);
    }

    setConfigurationParam(configuration: ConfigurationKey, key: string, value: string) {
        const cList = this.state.filtered_configuration_keys.map((c: any) => {
            if (c.config_category === configuration.config_category && c.config_key === configuration.config_key) {
                // eslint-disable-next-line functional/immutable-data
                c[key] = value;
            }
            return c;
        });
        this.setState({filtered_configuration_keys: cList});
    }

    handleFilterCallback = (filters: any) => {
        this.setState({filters});
        if (this.filter.name.visible && "name" in filters) {
            this.setState({
                filtered_configuration_keys: this.state.configuration_keys.filter((c: ConfigurationKey) => c.config_category.toLowerCase().includes(filters.name.toLowerCase()))
            });
        }

        if (this.filter.code.visible && "code" in filters) {
            this.setState({
                filtered_configuration_keys: this.state.configuration_keys.filter((c: ConfigurationKey) => c.config_key.toLowerCase().includes(filters.code.toLowerCase()))
            });
        }

        this.order(this.state.order.by, this.state.order.ing);
    };

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const configurationKeys: any = [];

        this.state.filtered_configuration_keys.map((configuration: any) => {
            const index = String(configuration.config_category) + String(configuration.config_key);
            const code = (
                <tr key={index}>
                    <td>{configuration.config_category}</td>
                    <td className="key-td-width">{configuration.config_key}</td>
                    <td className="text-left">
                        {!this.state.edit.enabled && configuration.config_value}
                        {
                            this.state.edit.enabled && this.state.edit.configuration.config_category === configuration.config_category &&
                            this.state.edit.configuration.config_key === configuration.config_key &&
							<Form.Control name="config_value" placeholder=""
                                          value={configuration.config_value}
                                          onChange={(e) => this.handleChange(e, configuration)}/>
                        }
                    </td>
                    <td className="description-td-width text-left">
                        {!this.state.edit.enabled && configuration.config_description}
                        {
                            this.state.edit.enabled && this.state.edit.configuration.config_category === configuration.config_category &&
                            this.state.edit.configuration.config_key === configuration.config_key &&
							<Form.Control name="config_description" placeholder=""
										  value={configuration.config_description}
										  onChange={(e) => this.handleChange(e, configuration)}/>
                        }
                    </td>
                    <td className="text-right">
                        {(!this.state.edit.enabled || this.state.edit.enabled &&
                                this.state.edit.configuration.config_category !== configuration.config_category &&
                                this.state.edit.configuration.config_key !== configuration.config_key ) &&
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
                        {this.state.edit.enabled &&
                        this.state.edit.configuration.config_category === configuration.config_category &&
                        this.state.edit.configuration.config_key === configuration.config_key &&
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
            configurationKeys.push(code);
        });

        return (
            <div className="container-fluid configuration">
                <div className="row">
                    <div className="col-md-10 mb-3">
                        <h2>Configuration Keys</h2>
                    </div>
                     <div className="col-md-2 text-right">
                        <Button onClick={this.create}>Nuovo <FaPlus/></Button>
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
                                            <th className="">
                                                <Ordering currentOrderBy={this.state.order.by} currentOrdering={this.state.order.ing} orderBy={"NAME"} ordering={"DESC"} handleOrder={this.handleOrder} />
                                                Categoria
                                            </th>
                                            <th className="key-td-width">
                                                <Ordering currentOrderBy={this.state.order.by} currentOrdering={this.state.order.ing} orderBy={"CODE"} ordering={"DESC"} handleOrder={this.handleOrder} />
                                                Chiave
                                            </th>
                                            <th className="text-left">Valore</th>
                                            <th className="description-td-width text-left">Descrizione</th>
                                            <th className="buttons-td-width" />
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {
                                            this.state.create.enabled &&
                                            <tr>
												<td>
													<Form.Control name="config_category" placeholder="Categoria"
																  value={this.state.create.configuration.config_category}
																  onChange={(e) => this.handleInput(e)}/>
                                                </td>
												<td className="key-td-width">
													<Form.Control name="config_key" placeholder="Chiave"
																  value={this.state.create.configuration.config_key}
																  onChange={(e) => this.handleInput(e)}/>
                                                </td>
												<td className="text-left">
                                                    <Form.Control name="config_value" placeholder="Valore"
                                                              value={this.state.create.configuration.config_value}
                                                              onChange={(e) => this.handleInput(e)}/>
												</td>
												<td className="description-td-width text-left">
                                                    <Form.Control name="config_description" placeholder="Descrizione"
                                                                  value={this.state.create.configuration.config_description}
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

                                        {configurationKeys}
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
                        <li>{this.state.delete.configuration.config_category} - {this.state.delete.configuration.config_key}</li>
                    </ul>
                </ConfirmationModal>

            </div>
        );
    }
}
