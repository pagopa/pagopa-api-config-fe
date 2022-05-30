import React from 'react';
import {Button, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaEdit, FaPlus, FaSpinner, FaTrash} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import Filters from "../../components/Filters";
import Ordering from "../../components/Ordering";
import {PaymentType} from '../../../generated/api/PaymentType';

interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    paymentTypes: any;
    filtered_paymentTypes: any;
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

export default class PaymentTypePage extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private filter: { [item: string]: any };

    constructor(props: IProps) {
        super(props);

        this.state = {
            paymentTypes: [],
            filtered_paymentTypes: [],
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
                placeholder: "ID"
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
                apiClient.getPaymentTypes({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: ""
                })
                    .then((response: any) => {
                        this.setState({
                            paymentTypes: response.right.value.payment_types,
                            filtered_paymentTypes: response.right.value.payment_types
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
                    payment_type: "",
                    description: "",
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
        const confList = this.state.filtered_paymentTypes;
        const ordering = order_ing === "DESC" ? 1 : -1;
        if (order_by === "CODE") {
            confList.sort((a: PaymentType, b: PaymentType) => a.payment_type.toLowerCase() < b.payment_type.toLowerCase() ? ordering : -ordering);
        }

        this.setState({filtered_paymentTypes: confList});
    }

    discard(operation: string, configuration: PaymentType | null) {
        if (operation === "edit") {
            this.setConfigurationParam(configuration as PaymentType, "description", this.state.edit.configuration.description);
            this.setState({
                edit: {
                    enabled: false,
                    configuration: {}
                }
            });
        } else {
            this.setState({
                create: {
                    enabled: false,
                    configuration: {}
                }
            });
        }
    }

    edit(configuration: PaymentType) {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updatePaymentType({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    paymentTypeCode: configuration.payment_type,
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
                apiClient.createPaymentType({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    body: this.state.create.configuration
                })
                    .then((res: any) => {
                        if (res.right.status === 201) {
                            toast.info("Salvataggio avvenuto con successo");
                            const cList = this.state.paymentTypes;
                            cList.push(res.right.value);
                            this.setState({
                                paymentTypes: cList
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

    handleEdit(configuration: PaymentType) {
        this.setState({
            edit: {
                enabled: true,
                configuration: {...configuration}
            }
        });
    }

    handleDelete(configuration: PaymentType) {
        this.setState({
            delete: {
                enabled: true,
                configuration
            }
        });
    }

    removeConfiguration(configuration: PaymentType) {
        const cList = this.state.paymentTypes.filter((c: PaymentType) => c.payment_type !== configuration.payment_type);
        this.setState({
            paymentTypes: cList
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
                    apiClient.deletePaymentType({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        paymentTypeCode: configuration.payment_type
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
            create: {
                enabled: true,
                configuration
            }
        });
    }

    handleChange(event: any, configuration: PaymentType) {
        this.setConfigurationParam(configuration, event.target.name, event.target.value);
    }

    setConfigurationParam(configuration: PaymentType, key: string, value: string) {
        const cList = this.state.filtered_paymentTypes.map((c: any) => {
            if (c.payment_type === configuration.payment_type) {
                // eslint-disable-next-line functional/immutable-data
                c[key] = value;
            }
            return c;
        });
        this.setState({filtered_paymentTypes: cList});
    }

    handleFilterCallback = (filters: any) => {
        this.setState({filters});

        if (this.filter.code.visible && "code" in filters) {
            this.setState({
                filtered_paymentTypes: this.state.paymentTypes.filter((c: PaymentType) => c.payment_type.toLowerCase().includes(filters.code.toLowerCase()))
            });
        }

        this.order(this.state.order.by, this.state.order.ing);
    };

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const paymentTypes: any = [];

        this.state.filtered_paymentTypes.map((configuration: any) => {
            const index = String(configuration.payment_type);
            const readOnly = (!this.state.edit.enabled || (this.state.edit.enabled && this.state.edit.configuration.payment_type !== configuration.payment_type));
            const code = (
                <tr key={configuration.payment_type}>
                    <td className="key-td-width">{configuration.payment_type}</td>
                    <td className="description-td-width text-left">
                        {readOnly && configuration.description}
                        {!readOnly &&
                            <Form.Control name="description" placeholder="" value={configuration.description}
                                          onChange={(e) => this.handleChange(e, configuration)}/>
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
            paymentTypes.push(code);
        });

        return (
            <div className="container-fluid configuration">
                <div className="row">
                    <div className="col-md-10 mb-3">
                        <h2>Tipi Versamento</h2>
                    </div>
                    <div className="col-md-2 text-right">
                        <Button onClick={this.create}>Nuovo <FaPlus/></Button>
                    </div>
                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-8">
                                <Filters configuration={this.filter} onFilter={this.handleFilterCallback}/>
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
                                                <Ordering currentOrderBy={this.state.order.by}
                                                          currentOrdering={this.state.order.ing} orderBy={"CODE"}
                                                          ordering={"DESC"} handleOrder={this.handleOrder}/>
                                                ID
                                            </th>
                                            <th className="description-td-width text-left">Descrizione</th>
                                            <th className="buttons-td-width"/>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {
                                            this.state.create.enabled &&
                                            <tr>
                                                <td className="key-td-width">
                                                    <Form.Control name="payment_type" placeholder="ID"
                                                                  value={this.state.create.configuration.payment_type}
                                                                  onChange={(e) => this.handleInput(e)}/>
                                                </td>
                                                <td className="description-td-width text-left">
                                                    <Form.Control name="description" placeholder="Descrizione"
                                                                  value={this.state.create.configuration.description}
                                                                  onChange={(e) => this.handleInput(e)}/>
                                                </td>
                                                <td className="text-right">
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            <Button className="ml-2 float-md-right" variant="secondary"
                                                                    size={"sm"}
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

                                        {paymentTypes}
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
                        <li>{this.state.delete.configuration.payment_type}</li>
                    </ul>
                </ConfirmationModal>

            </div>
        );
    }
}
