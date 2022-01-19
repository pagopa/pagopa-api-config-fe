import React from "react";
import {Breadcrumb, Button, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import {BrokerPspDetails} from "../../../generated/api/BrokerPspDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };
}

interface IState {
    brokerPSP: BrokerPspDetails;
    showModal: boolean;
}

export default class CreateBrokerPSP extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/brokers-psp";

    constructor(props: IProps) {
        super(props);

        this.state = {
            brokerPSP: {
                broker_psp_code: "",
                description: "",
                enabled: false,
                extended_fault_bean: false
            } as unknown as BrokerPspDetails,
            showModal: false
        };

        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let brokerPSP: BrokerPspDetails = this.state.brokerPSP;
        const key = event.target.name as string;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        brokerPSP = {...brokerPSP, [key]: value};
        this.setState({brokerPSP});
    }

    discard(): void {
        this.setState({showModal: true});
    }

    hideModal(status: string): void {
        if (status === "ok") {
            this.props.history.push(this.service);
        }
        this.setState({showModal: false});
    }

    goBack(): void {
        this.props.history.push(this.service);
    }

    save(): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createBrokerPsp({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    body: this.state.brokerPSP
                }).then((response: any) => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (response.hasOwnProperty("right")) {
                        if (response.right.status === 201) {
                            // eslint-disable-next-line no-console
                            toast.info("Creazione avvenuta con successo.");
                            setTimeout(this.goBack.bind(this), 2000);
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
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href={this.service}>Intermediari PSP</Breadcrumb.Item>
                            <Breadcrumb.Item active>Crea Intermediario PSP</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-12">
                                <h2>Nuovo Itermediario PSP</h2>
                            </div>
                        </div>
                        <div className="row">
                            <Form.Group controlId="description" className="col-md-4">
                                <Form.Label>Descrizione</Form.Label>
                                <Form.Control name="description" placeholder=""
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                            <Form.Group controlId="code" className="col-md-4">
                                <Form.Label>Codice</Form.Label>
                                <Form.Control name="broker_psp_code" placeholder="" onChange={(e) => this.handleChange(e)} />
                            </Form.Group>
                            <Form.Group controlId="enabled" className="col-md-2">
                                <Form.Label>Stato</Form.Label>
                                <Form.Control as="select" name="enabled" placeholder="stato"
                                              onChange={(e) => this.handleChange(e)}
                                              defaultValue={String(this.state.brokerPSP.enabled)}>
                                    <option value="true">Abilitato</option>
                                    <option value="false">Non Abilitato</option>
                                </Form.Control>
                            </Form.Group>
                            <Form.Group controlId="extended_fault_bean" className="col-md-2">
                                <Form.Label>Faul Bean esteso</Form.Label>
                                <Form.Control as="select" name="extended_fault_bean" placeholder="stato"
                                              onChange={(e) => this.handleChange(e)}
                                              defaultValue={String(this.state.brokerPSP.extended_fault_bean)}>
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
