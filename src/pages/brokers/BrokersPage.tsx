import React from 'react';
import {toast} from "react-toastify";
import {Button, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaEdit, FaEye, FaPlus, FaTimes, FaTrash} from "react-icons/fa";
import {IResponseType} from "@pagopa/ts-commons/lib/requests";
import {Validation} from "io-ts";
import {ProblemJson} from "@pagopa/ts-commons/lib/responses";
import {MsalContext} from "@azure/msal-react";
import {Brokers} from "../../../generated/api/Brokers";
import {Broker} from "../../../generated/api/Broker";
import {apiClient} from "../../util/apiClient";
import Paginator from "../../components/Paginator";
import ConfirmationModal from "../../components/ConfirmationModal";
import {PageInfo} from "../../../generated/api/PageInfo";
import {loginRequest} from "../../authConfig";


interface IProps {
    history: any;
}

interface IState {
    brokersPaginated?: Brokers;
    isLoading: boolean;
    showDeleteModal: boolean;
    brokerToDelete?: Broker;
    pageIndex: number;
}

export default class BrokersPage extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);
        this.state = {
            isLoading: true,
            showDeleteModal: false,
            pageIndex: 0
        };

        this.handlePageChange = this.handlePageChange.bind(this);
        this.createBrokerPage = this.createBrokerPage.bind(this);
    }

    componentDidMount(): void {
        this.getPage(0);
    }

    getPage(page: number) {

        this.setState({isLoading: true});
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getBrokers({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    limit: 10,
                    page
                })
                    .then((response: Validation<IResponseType<number, Brokers | ProblemJson | undefined>>) => {
                        // eslint-disable-next-line no-underscore-dangle
                        switch (response._tag) {
                            case "Right":
                                if (response.right.status === 200) {
                                    const body = response.right.value as Brokers;
                                    this.setState({
                                        brokersPaginated: body,
                                        pageIndex: page
                                    });
                                } else {
                                    const body = response.right.value as ProblemJson;
                                    toast.error(body.title, {theme: "colored"});
                                }
                                break;
                            case "Left":
                                toast.error("Errore", {theme: "colored"});
                                break;
                        }

                    })
                    .catch(() => {
                        toast.error("Problema nel recuperare gli intermediari", {theme: "colored"});
                    })
                    .finally(() => {
                        this.setState({isLoading: false});
                    });
            });
    }

    handlePageChange(requestedPage: number) {
        this.getPage(requestedPage);
    }

    handleDelete(broker: Broker) {
        this.setState({showDeleteModal: true});
        this.setState({brokerToDelete: broker});
    }

    removeBroker() {
        if (this.state.brokersPaginated?.page_info.items_found === 1) {
            // if the last one in the page was removed, get previous page...
            this.getPage(this.state.pageIndex - 1);
        } else {
            // ... else stay in that page
            this.getPage(this.state.pageIndex);
        }
    }

    deleteBrokerCall(access_token: string, broker_code: string) {
        apiClient.deleteBroker({
            Authorization: `Bearer ${access_token}`,
            ApiKey: "",
            brokercode: broker_code
        })
            .then((response: Validation<IResponseType<number, ProblemJson | undefined>>) => {
                // eslint-disable-next-line no-underscore-dangle
                switch (response._tag) {
                    case "Right":
                        if (response.right.status === 200) {
                            toast.info("Rimozione avvenuta con successo");
                            this.removeBroker();
                        } else {
                            const body = response.right.value as ProblemJson;
                            toast.error(body.title, {theme: "colored"});
                        }
                        break;
                    case "Left":
                        toast.error("Errore", {theme: "colored"});
                        break;
                }
            })
            .catch(() => {
                toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
            });
    }

    hideDeleteModal = (status: string) => {
        if (status === "ok") {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    if (this.state.brokerToDelete) {
                        this.deleteBrokerCall(response.accessToken, this.state.brokerToDelete.broker_code);
                    }
                });

        }
        this.setState({showDeleteModal: false});
    };

    handleDetails(code: string) {
        this.props.history.push("/brokers/" + code);
    }

    createBrokerPage() {
        this.props.history.push("/brokers/create");
    }

    handleEdit(code: string) {
        this.props.history.push("/brokers/" + code + "?edit");
    }

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const brokers: any = [];

        this.state.brokersPaginated?.brokers.map((elem, index) => {
            const code = (
                <tr key={index}>
                    <td>{elem.description}</td>
                    <td>{elem.broker_code}</td>
                    <td className="text-center">
                        {elem.enabled && <FaCheck className="text-success"/>}
                        {!elem.enabled && <FaTimes className="text-danger"/>}
                    </td>
                    <td className="text-right">
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-details-${index}`}>View details</Tooltip>}>
                            <FaEye role="button" className="mr-3"
                                   onClick={() => this.handleDetails(elem.broker_code)}/>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                            <FaEdit role="button" className="mr-3"
                                    onClick={() => this.handleEdit(elem.broker_code)}/>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-delete-${index}`}>Delete item</Tooltip>}>
                            <FaTrash role="button" className="mr-3" onClick={() => this.handleDelete(elem)}/>
                        </OverlayTrigger>
                    </td>
                </tr>
            );
            brokers.push(code);
        });


        return <div className="container-fluid creditor-institutions">
            <div className="row">
                <div className="col-md-10 mb-3">
                    <h2>Intermediari EC</h2>
                </div>
                <div className="col-md-2 text-right">
                    <Button onClick={this.createBrokerPage}>Nuovo <FaPlus/></Button>
                </div>
                <div className="col-md-12">
                    {isLoading && (<p>Loading ...</p>)}
                    {
                        !isLoading && (
                            <>
                                <Table hover responsive size="sm">
                                    <thead>
                                    <tr>
                                        <th className="fixed-td-width">Nome</th>
                                        <th className="fixed-td-width">Codice</th>
                                        <th className="text-center">Abilitato</th>
                                        <th/>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {brokers}
                                    </tbody>
                                </Table>

                                <Paginator pageInfo={this.state.brokersPaginated?.page_info as PageInfo}
                                           onPageChanged={this.handlePageChange}/>
                            </>
                        )
                    }
                </div>
            </div>

            <ConfirmationModal show={this.state.showDeleteModal} handleClose={this.hideDeleteModal}>
                <p>Sei sicuro di voler eliminare il seguente intermediario?</p>
                <ul>
                    <li>{this.state.brokerToDelete?.description} - {this.state.brokerToDelete?.broker_code}</li>
                </ul>
            </ConfirmationModal>
        </div>;
    }
}
