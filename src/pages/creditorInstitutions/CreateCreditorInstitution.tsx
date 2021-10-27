import React from "react";
import {Alert, Breadcrumb, Button, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
// import {apiClient} from "../../util/apiClient";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    code: string;
    creditorInstitution: any;
    showModal: boolean;
}

export default class CreateCreditorInstitution extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
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
                "fk_int_quadrature": null,
                "psp_payment": false,
                "reporting_ftp": false,
                "reporting_zip": false
            },
            showModal: false
        };

        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    componentDidMount(): void {
        this.setState({isError: false});
    }

    handleChange(event: any, obj: string) {
        // eslint-disable-next-line functional/no-let
        const creditorInstitution = this.state.creditorInstitution;
        if (obj === "creditorInstitution") {
            // eslint-disable-next-line functional/immutable-data
            creditorInstitution[event.target.name] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        }
        else {
            // eslint-disable-next-line functional/immutable-data
            creditorInstitution.address[event.target.name] = event.target.value;
        }
        this.setState({creditorInstitution});
    }

    discard(): void {
        console.log("DISCARD");
        this.setState({ showModal: true });
    }

    hideModal(status: string): void {
        if (status === "ok") {
            this.props.history.push("/creditor-institutions");
        }
        this.setState({showModal: false});
    }

    save(): void {
        console.log("SAVE", this.state);
        apiClient.createCreditorInstitution({
            ApiKey: "",
            body: this.state.creditorInstitution
        }).then((response: any) => {
            console.log("RES SAVE", response);
        }).catch((err: any) => {
           console.error("ERR SAVE", err);
        });
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

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
                                    <Form.Label>Nome</Form.Label>
                                    <Form.Control name="business_name" placeholder="" onChange={(e) => this.handleChange(e, "creditorInstitution")} />
                                </Form.Group>
                                <Form.Group controlId="code" className="col-md-3">
                                    <Form.Label>Codice</Form.Label>
                                    <Form.Control name="creditor_institution_code" placeholder="" onChange={(e) => this.handleChange(e, "creditorInstitution")} />
                                </Form.Group>
                                <Form.Group controlId="enabled" className="col-md-3">
                                    <Form.Label>Stato</Form.Label>
                                    <Form.Control as="select" name="enabled" placeholder="stato" onChange={(e) => this.handleChange(e, "creditorInstitution")}
                                    defaultValue={this.state.creditorInstitution.enabled} >
                                        <option value="true">Abilitato</option>
                                        <option value="false">Non Abilitato</option>
                                    </Form.Control>
                                </Form.Group>
                            </div>
                            <div className="row">
                                <Form.Group controlId="location" className="col-md-4">
                                    <Form.Label>Indirizzo</Form.Label>
                                    <Form.Control placeholder="" name="location" onChange={(e) => this.handleChange(e, "address")} />
                                </Form.Group>
                                <Form.Group controlId="city" className="col-md-3">
                                    <Form.Label>Città</Form.Label>
                                    <Form.Control placeholder="" name="city" onChange={(e) => this.handleChange(e, "address")} />
                                </Form.Group>
                                <Form.Group controlId="country_code" className="col-md-2">
                                    <Form.Label>Provincia</Form.Label>
                                    <Form.Control placeholder="" name="country_code" onChange={(e) => this.handleChange(e, "address")} />
                                </Form.Group>
                                <Form.Group controlId="cap" className="col-md-2">
                                    <Form.Label>CAP</Form.Label>
                                    <Form.Control type="number" placeholder="" name="zip_code" onChange={(e) => this.handleChange(e, "address")} />
                                </Form.Group>
                                <Form.Group controlId="tax" className="col-md-4">
                                    <Form.Label>Domicilio fiscale</Form.Label>
                                    <Form.Control placeholder="" name="tax_domicile" onChange={(e) => this.handleChange(e, "address")} />
                                </Form.Group>
                                <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                    <Form.Check
                                            custom
                                            name="psp_payment"
                                            type={'checkbox'}
                                            id={'psp-payment'}
                                            label={'Pagamento PSP'}
                                            value={'true'}
                                            onChange={(e) => this.handleChange(e, "creditorInstitution")} />
                                </Form.Group>
                                <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                    <Form.Check
                                            custom
                                            name="reporting_ftp"
                                            type={'checkbox'}
                                            id={'reporting-ftp'}
                                            label={'Rendicontazione FTP'}
                                            value={'true'}
                                            onChange={(e) => this.handleChange(e, "creditorInstitution")} />
                                </Form.Group>
                                <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                    <Form.Check
                                            custom
                                            name="reporting_zip"
                                            type={'checkbox'}
                                            id={'reporting-zip'}
                                            label={'Rendicontazione ZIP'}
                                            value={'true'}
                                            onChange={(e) => this.handleChange(e, "creditorInstitution")} />
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
