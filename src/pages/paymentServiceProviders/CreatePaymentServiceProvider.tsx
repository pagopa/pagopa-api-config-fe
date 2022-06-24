import React from "react";
import {Breadcrumb, Button, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import {loginRequest} from "../../authConfig";
import {PaymentServiceProviderDetails} from "../../../generated/api/PaymentServiceProviderDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };
}

interface IState {
    paymentServiceProvider: PaymentServiceProviderDetails;
    showModal: boolean;
}

export default class CreatePaymentServiceProvider extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/payment-service-providers";

    constructor(props: IProps) {
        super(props);

        this.state = {
            paymentServiceProvider: {
                "abi": "",
                "agid_psp": false,
                "bic": "",
                "enabled": false,
                "stamp": false,
                "tax_code": "",
                "transfer": false,
                "vat_number": ""
            } as unknown as PaymentServiceProviderDetails,
            showModal: false
        };

        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let paymentServiceProvider: PaymentServiceProviderDetails = this.state.paymentServiceProvider;
        const key = event.target.name as string;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        paymentServiceProvider = {...paymentServiceProvider, [key]: value};
        this.setState({paymentServiceProvider});
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
                apiClient.createPaymentServiceProvider({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    body: this.state.paymentServiceProvider
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
                            <Breadcrumb.Item href={this.service}>Prestatori Servizio di Pagamento</Breadcrumb.Item>
                            <Breadcrumb.Item active>Crea Prestatore Servizio di Pagamento</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-12">
                                <h2>Nuovo Prestatore Servizio di Pagamento</h2>
                            </div>
                        </div>
                        <div className="row">
                            <Form.Group controlId="code" className="col-md-3">
                                <Form.Label>Nome <span className="text-danger">*</span></Form.Label>
                                <Form.Control name="business_name" placeholder="" onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>

                            <Form.Group controlId="code" className="col-md-3">
                                <Form.Label>Codice <span className="text-danger">*</span></Form.Label>
                                <Form.Control name="psp_code" placeholder="" onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                            <Form.Group controlId="enabled" className="col-md-3">
                                <Form.Label>Stato <span className="text-danger">*</span></Form.Label>
                                <Form.Control as="select" name="enabled" placeholder="stato"
                                              onChange={(e) => this.handleChange(e)}
                                              defaultValue={this.state.paymentServiceProvider.enabled.toString()}>
                                    <option value="true">Abilitato</option>
                                    <option value="false">Non Abilitato</option>
                                </Form.Control>
                            </Form.Group>
                        </div>
                        <div className="row">
                            <Form.Group controlId="tax_code" className="col-md-3">
                                <Form.Label>Codice Fiscale</Form.Label>
                                <Form.Control placeholder="" name="tax_code"
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                            <Form.Group controlId="abi" className="col-md-4">
                                <Form.Label>Codice ABI</Form.Label>
                                <Form.Control placeholder="" name="abi"
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                            <Form.Group controlId="bic" className="col-md-3">
                                <Form.Label>Codice BIC</Form.Label>
                                <Form.Control placeholder="" name="bic"
                                              onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                        </div>
                        <div className="row">
                            <Form.Group controlId="agid_psp" className="col-md-2 custom-control-box">
                                <Form.Check
                                        custom
                                        name="agid_psp"
                                        type={'checkbox'}
                                        id={'agid-psp'}
                                        label={'PSP interno'}
                                        value={'true'}
                                        onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                            <Form.Group controlId="stamp" className="col-md-2 custom-control-box">
                                <Form.Check
                                    custom
                                    name="stamp"
                                    type={'checkbox'}
                                    id={'stamp'}
                                    label={'Marca bollo digitale'}
                                    value={'true'}
                                    onChange={(e) => this.handleChange(e)}/>
                            </Form.Group>
                            <Form.Group controlId="transfer" className="col-md-2 custom-control-box">
                                <Form.Check
                                        custom
                                        name="transfer"
                                        type={'checkbox'}
                                        id={'transfer'}
                                        label={'Storno pagamento'}
                                        value={'true'}
                                        onChange={(e) => this.handleChange(e)}/>
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
