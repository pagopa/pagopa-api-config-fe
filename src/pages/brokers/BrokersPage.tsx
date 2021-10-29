import React from 'react';
import {toast} from "react-toastify";
import {OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaEye, FaTimes, FaTrash} from "react-icons/all";
import {Brokers} from "../../../generated/api/Brokers";
import {Broker} from "../../../generated/api/Broker";
import {apiClient} from "../../util/apiClient";
import Paginator from "../../components/Paginator";
import ConfirmationModal from "../../components/ConfirmationModal";
import {PageInfo} from "../../../generated/api/PageInfo";


interface IProps {
    history: any;
}

interface IState {
    body?: Brokers;
    isLoading: boolean;
    showDeleteModal: boolean;
    brokerToDelete?: Broker;
    pageIndex: number;
}

export default class BrokersPage extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            isLoading: true,
            showDeleteModal: false,
            pageIndex: 0
        };

        this.handlePageChange = this.handlePageChange.bind(this);
    }

    componentDidMount(): void {
        this.getPage(0);
    }

    getPage(page: number) {

        this.setState({isLoading: true});
        apiClient.getBrokers({
            ApiKey: "",
            limit: 10,
            page
        })
            .then((response: any) => {
                this.setState({
                    body: response.value.value,
                    pageIndex: page
                });
            })
            .catch(() => {
                toast.error("Problema nel recuperare gli intermediari", {theme: "colored"});
            })
            .finally(() => {
                this.setState({isLoading: false});
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
        if (this.state.body?.page_info.items_found === 1) {
            // if the last one in the page was removed, get previous page...
            this.getPage(this.state.pageIndex - 1);
        } else {
            // ... else stay in that page
            this.getPage(this.state.pageIndex);
        }
    }

    hideDeleteModal = (status: string) => {
        if (status === "ok") {

            apiClient.deleteBroker({
                ApiKey: "",
                brokercode: this.state.brokerToDelete!.broker_code
            })
                .then((res: any) => {
                    if (res.value.status === 200) {
                        toast.info("Rimozione avvenuta con successo");
                        this.removeBroker();
                    } else {
                        toast.error(res.value.value.title, {theme: "colored"});
                    }
                })
                .catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });

        }
        this.setState({showDeleteModal: false});
    };

    handleDetails(code: string) {
        this.props.history.push("/brokers/" + code);
    }

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const brokers: any = [];

        this.state.body?.brokers_list.map((elem, index) => {
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
                <div className="col-md-12 mb-5">
                    <h2>Intermediari</h2>
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

                                <Paginator pageInfo={this.state.body?.page_info as PageInfo}
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
