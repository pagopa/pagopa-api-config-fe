import React from "react";
import {Breadcrumb, Button, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import {CreditorInstitutionDetails} from "../../../generated/api/CreditorInstitutionDetails";
import CountryCode from "../../components/CountryCode";
import {loginRequest} from "../../authConfig";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };
}

interface IState {
    creditorInstitution: CreditorInstitutionDetails;
    showModal: boolean;
}

export default class CreateCreditorInstitution extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            creditorInstitution: {
                "address": {
                    "city": "",
                    "country_code": "",
                    "location": "",
                    "tax_domicile": "",
                    "zip_code": ""
                },
                "business_name": "",
                "creditor_institution_code": "",
                "enabled": false,
                "fk_int_quadrature": undefined,
                "psp_payment": false,
                "reporting_ftp": false,
                "reporting_zip": false
            } as unknown as CreditorInstitutionDetails,
            showModal: false
        };

        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    handleChange(event: any, obj: string) {
        // eslint-disable-next-line functional/no-let
        let creditorInstitution: CreditorInstitutionDetails = this.state.creditorInstitution;
        const key = event.target.name as string;
        if (obj === "creditorInstitution") {
            const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
            creditorInstitution = {...creditorInstitution, [key]: value};
        } else if (obj === "address") {
            const value = event.target.value;
            const address = {...creditorInstitution.address, [key]: value};
            creditorInstitution = {...creditorInstitution, address};
        }
        this.setState({creditorInstitution});
    }

    discard(): void {
        this.setState({showModal: true});
    }

    hideModal(status: string): void {
        if (status === "ok") {
            this.props.history.push("/creditor-institutions");
        }
        this.setState({showModal: false});
    }

    goBack(): void {
        this.props.history.push("/creditor-institutions");
    }

    save(): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createCreditorInstitution({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    body: this.state.creditorInstitution
                }).then((response: any) => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (response.hasOwnProperty("right")) {
                        if (response.right.status === 201) {
                            // eslint-disable-next-line no-console
                            toast.info("Creazione avvenuta con successo.");
                            setTimeout(this.goBack.bind(this), 2000);
                        } else {
                            const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                            this.toastError(message);
                        }
                    } else {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    }
                }).catch(() => {
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

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    render(): React.ReactNode {
        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/creditor-institutions">Enti Creditori</Breadcrumb.Item>
                            <Breadcrumb.Item active>Crea Ente Creditore</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-12">
                                <h2>Nuovo Ente Creditore</h2>
                            </div>
                        </div>
                        <div className="row">
                            <Form.Group controlId="code" className="col-md-3">
                                <Form.Label>Nome<span className="text-danger">*</span></Form.Label>
                                <Form.Control name="business_name" placeholder=""
                                              onChange={(e) => this.handleChange(e, "creditorInstitution")}/>
                            </Form.Group>
                            <Form.Group controlId="code" className="col-md-3">
                                <Form.Label>Codice<span className="text-danger">*</span></Form.Label>
                                <Form.Control name="creditor_institution_code" placeholder=""
                                              onChange={(e) => this.handleChange(e, "creditorInstitution")}/>
                            </Form.Group>
                            <Form.Group controlId="enabled" className="col-md-3">
                                <Form.Label>Stato<span className="text-danger">*</span></Form.Label>
                                <Form.Control as="select" name="enabled" placeholder="stato"
                                              onChange={(e) => this.handleChange(e, "creditorInstitution")}
                                              defaultValue={this.state.creditorInstitution.enabled.toString()}>
                                    <option value="true">Abilitato</option>
                                    <option value="false">Non Abilitato</option>
                                </Form.Control>
                            </Form.Group>
                        </div>
                        <div className="row">
                            <Form.Group controlId="location" className="col-md-4">
                                <Form.Label>Indirizzo</Form.Label>
                                <Form.Control placeholder="" name="location"
                                              onChange={(e) => this.handleChange(e, "address")}/>
                            </Form.Group>
                            <Form.Group controlId="city" className="col-md-3">
                                <Form.Label>Città</Form.Label>
                                <Form.Control placeholder="" name="city"
                                              onChange={(e) => this.handleChange(e, "address")}/>
                            </Form.Group>
                            <Form.Group controlId="country_code" className="col-md-2">
                                <Form.Label>Provincia</Form.Label>
                                <CountryCode name="country_code" obj="address" value={this.state.creditorInstitution.address?.country_code} handleChange={this.handleChange}/>
                            </Form.Group>
                            <Form.Group controlId="cap" className="col-md-2">
                                <Form.Label>CAP</Form.Label>
                                <Form.Control type="number" placeholder="" name="zip_code"
                                              onChange={(e) => this.handleChange(e, "address")}/>
                            </Form.Group>
                            <Form.Group controlId="tax" className="col-md-4">
                                <Form.Label>Domicilio fiscale</Form.Label>
                                <Form.Control placeholder="" name="tax_domicile"
                                              onChange={(e) => this.handleChange(e, "address")}/>
                            </Form.Group>
                            <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                <Form.Check
                                    custom
                                    name="psp_payment"
                                    type={'checkbox'}
                                    id={'psp-payment'}
                                    label={'Pagamento PSP'}
                                    value={'true'}
                                    onChange={(e) => this.handleChange(e, "creditorInstitution")}/>
                            </Form.Group>
                            <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                <Form.Check
                                    custom
                                    name="reporting_ftp"
                                    type={'checkbox'}
                                    id={'reporting-ftp'}
                                    label={'Rendicontazione FTP'}
                                    value={'true'}
                                    onChange={(e) => this.handleChange(e, "creditorInstitution")}/>
                            </Form.Group>
                            <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                <Form.Check
                                    custom
                                    name="reporting_zip"
                                    type={'checkbox'}
                                    id={'reporting-zip'}
                                    label={'Rendicontazione ZIP'}
                                    value={'true'}
                                    onChange={(e) => this.handleChange(e, "creditorInstitution")}/>
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
