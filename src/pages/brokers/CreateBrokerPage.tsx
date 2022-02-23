import React from "react";
import {Breadcrumb, Button, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import {BrokerDetails} from "../../../generated/api/BrokerDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };
}

interface IState {
    brokerDetails: BrokerDetails;
    showModal: boolean;
}

export default class CreateBrokerPage extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            brokerDetails: {
                "enabled": false,
                "extended_fault_bean": false
            } as unknown as BrokerDetails,
            showModal: false
        };

        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let brokerDetails: BrokerDetails = this.state.brokerDetails;
        const key = event.target.name as string;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        brokerDetails = {...brokerDetails, [key]: value};
        this.setState({brokerDetails});
    }

    discard(): void {
        this.setState({showModal: true});
    }

    hideModal(status: string): void {
        if (status === "ok") {
            this.props.history.push("/brokers");
        }
        this.setState({showModal: false});
    }

    goBack(): void {
        this.props.history.push("/brokers");
    }

    save(): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createBroker({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    body: this.state.brokerDetails
                }).then((response: any) => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (response.hasOwnProperty("right")) {
                        if (response.right.status === 201) {
                            // eslint-disable-next-line no-console
                            toast.info("Creazione avvenuta con successo.");
                            setTimeout(this.goBack.bind(this), 2000);
                        } else if(response.right.status === 409){
                            toast.error("Codice Broker già presente", {theme: "colored"});
                        } else {
                            const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                            toast.error(message, {theme: "colored"});
                        }
                    } else {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });
            });
    }

    render(): React.ReactNode {
        return (
            <div className="container-fluid broker">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <div className="col-md-12 mb-5">
                            <Breadcrumb>
                                <Breadcrumb.Item href="/brokers">Intermediari</Breadcrumb.Item>
                                <Breadcrumb.Item active>Crea Intermediario</Breadcrumb.Item>
                            </Breadcrumb>
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-12">
                                <h2>Nuovo Intermediario</h2>
                            </div>
                        </div>
                        <div className="row">
                            <Form.Group controlId="code" className="col-md-3">
                                <Form.Label>Nome</Form.Label>
                                <Form.Control name="description" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                            <Form.Group controlId="code" className="col-md-3">
                                <Form.Label>Codice</Form.Label>
                                <Form.Control name="broker_code" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                            <Form.Group controlId="enabled" className="col-md-3">
                                <Form.Label>Stato</Form.Label>
                                <Form.Control as="select" name="enabled" placeholder="stato"
                                              onChange={(e) => this.handleChange(e)}
                                              defaultValue={"false"}>
                                    <option value="true">Abilitato</option>
                                    <option value="false">Non Abilitato</option>
                                </Form.Control>
                            </Form.Group>
                            <Form.Group controlId="extended_fault_bean" className="col-md-3">
                                <Form.Label>Fault Bean Esteso</Form.Label>
                                <Form.Control as="select" name="extended_fault_bean" placeholder="fault bean"
                                              onChange={(e) => this.handleChange(e)}
                                              defaultValue={"false"}>
                                    <option value="true">Abilitato</option>
                                    <option value="false">Non Abilitato</option>
                                </Form.Control>
                            </Form.Group>
                        </div>

                        <div className="row justify-content-end">
                            <div className="col-md-3 text-right">
                                <Button onClick={this.save}>Salva</Button>
                                <Button variant="secondary" className="ml-3" onClick={this.discard}>Annulla</Button>
                            </div>
                        </div>

                    </div>
                </div>

                <ConfirmationModal show={this.state.showModal} handleClose={this.hideModal}>
                    <p>Sei sicuro di voler annullare le modifiche?</p>
                </ConfirmationModal>
            </div>
        );
    }
}
