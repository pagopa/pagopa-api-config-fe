import React from "react";
import {Breadcrumb, Button, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import ConfirmationModal from "../../components/ConfirmationModal";
import {CreditorInstitutionDetails} from "../../../generated/api/CreditorInstitutionDetails";

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
            creditorInstitution = { ...creditorInstitution, [key]: value };
        }
        else {
            const value = event.target.value;
            const address = { ...creditorInstitution.address, [key]: value };
            creditorInstitution = { ...creditorInstitution, address };
        }
        this.setState({creditorInstitution});
    }

    discard(): void {
        this.setState({ showModal: true });
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
        apiClient.createCreditorInstitution({
            ApiKey: "",
            body: this.state.creditorInstitution
        }).then((response: any) => {
            // eslint-disable-next-line no-console
            console.log("RES SAVE", response);
            // eslint-disable-next-line no-prototype-builtins
            if (response.hasOwnProperty("right")) {
                if (response.right.status === 201) {
                    // eslint-disable-next-line no-console
                    toast.info("Creazione avvenuta con successo.");
                    setTimeout(this.goBack.bind(this), 2000);
                }
                else {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                }
            }
            else {
                toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
            }
        }).catch((err: any) => {
            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
            // eslint-disable-next-line no-console
            console.log("ERR", err);
        });
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
                                    <Form.Label>Nome</Form.Label>
                                    <Form.Control name="business_name" placeholder=""
                                                  onChange={(e) => this.handleChange(e, "creditorInstitution")}/>
                                </Form.Group>
                                <Form.Group controlId="code" className="col-md-3">
                                    <Form.Label>Codice</Form.Label>
                                    <Form.Control name="creditor_institution_code" placeholder=""
                                                  onChange={(e) => this.handleChange(e, "creditorInstitution")}/>
                                </Form.Group>
                                <Form.Group controlId="enabled" className="col-md-3">
                                    <Form.Label>Stato</Form.Label>
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
                                    <Form.Control as="select" placeholder="" name="country_code" onChange={(e) => this.handleChange(e, "address")}>
                                        <option></option>
                                        <option value="AG">Agrigento</option>
                                        <option value="AL">Alessandria</option>
                                        <option value="AN">Ancona</option>
                                        <option value="AO">Aosta</option>
                                        <option value="AR">Arezzo</option>
                                        <option value="AP">Ascoli Piceno</option>
                                        <option value="AT">Asti</option>
                                        <option value="AV">Avellino</option>
                                        <option value="BA">Bari</option>
                                        <option value="BT">Barletta-Andria-Trani</option>
                                        <option value="BL">Belluno</option>
                                        <option value="BN">Benevento</option>
                                        <option value="BG">Bergamo</option>
                                        <option value="BI">Biella</option>
                                        <option value="BO">Bologna</option>
                                        <option value="BZ">Bolzano</option>
                                        <option value="BS">Brescia</option>
                                        <option value="BR">Brindisi</option>
                                        <option value="CA">Cagliari</option>
                                        <option value="CL">Caltanissetta</option>
                                        <option value="CB">Campobasso</option>
                                        <option value="CI">Carbonia-iglesias</option>
                                        <option value="CE">Caserta</option>
                                        <option value="CT">Catania</option>
                                        <option value="CZ">Catanzaro</option>
                                        <option value="CH">Chieti</option>
                                        <option value="CO">Como</option>
                                        <option value="CS">Cosenza</option>
                                        <option value="CR">Cremona</option>
                                        <option value="KR">Crotone</option>
                                        <option value="CN">Cuneo</option>
                                        <option value="EN">Enna</option>
                                        <option value="FM">Fermo</option>
                                        <option value="FE">Ferrara</option>
                                        <option value="FI">Firenze</option>
                                        <option value="FG">Foggia</option>
                                        <option value="FC">Forl&igrave;-Cesena</option>
                                        <option value="FR">Frosinone</option>
                                        <option value="GE">Genova</option>
                                        <option value="GO">Gorizia</option>
                                        <option value="GR">Grosseto</option>
                                        <option value="IM">Imperia</option>
                                        <option value="IS">Isernia</option>
                                        <option value="SP">La spezia</option>
                                        <option value="AQ">L&apos;aquila</option>
                                        <option value="LT">Latina</option>
                                        <option value="LE">Lecce</option>
                                        <option value="LC">Lecco</option>
                                        <option value="LI">Livorno</option>
                                        <option value="LO">Lodi</option>
                                        <option value="LU">Lucca</option>
                                        <option value="MC">Macerata</option>
                                        <option value="MN">Mantova</option>
                                        <option value="MS">Massa-Carrara</option>
                                        <option value="MT">Matera</option>
                                        <option value="VS">Medio Campidano</option>
                                        <option value="ME">Messina</option>
                                        <option value="MI">Milano</option>
                                        <option value="MO">Modena</option>
                                        <option value="MB">Monza e della Brianza</option>
                                        <option value="NA">Napoli</option>
                                        <option value="NO">Novara</option>
                                        <option value="NU">Nuoro</option>
                                        <option value="OG">Ogliastra</option>
                                        <option value="OT">Olbia-Tempio</option>
                                        <option value="OR">Oristano</option>
                                        <option value="PD">Padova</option>
                                        <option value="PA">Palermo</option>
                                        <option value="PR">Parma</option>
                                        <option value="PV">Pavia</option>
                                        <option value="PG">Perugia</option>
                                        <option value="PU">Pesaro e Urbino</option>
                                        <option value="PE">Pescara</option>
                                        <option value="PC">Piacenza</option>
                                        <option value="PI">Pisa</option>
                                        <option value="PT">Pistoia</option>
                                        <option value="PN">Pordenone</option>
                                        <option value="PZ">Potenza</option>
                                        <option value="PO">Prato</option>
                                        <option value="RG">Ragusa</option>
                                        <option value="RA">Ravenna</option>
                                        <option value="RC">Reggio Calabria</option>
                                        <option value="RE">Reggio Emilia</option>
                                        <option value="RI">Rieti</option>
                                        <option value="RN">Rimini</option>
                                        <option value="RM">Roma</option>
                                        <option value="RO">Rovigo</option>
                                        <option value="SA">Salerno</option>
                                        <option value="SS">Sassari</option>
                                        <option value="SV">Savona</option>
                                        <option value="SI">Siena</option>
                                        <option value="SR">Siracusa</option>
                                        <option value="SO">Sondrio</option>
                                        <option value="TA">Taranto</option>
                                        <option value="TE">Teramo</option>
                                        <option value="TR">Terni</option>
                                        <option value="TO">Torino</option>
                                        <option value="TP">Trapani</option>
                                        <option value="TN">Trento</option>
                                        <option value="TV">Treviso</option>
                                        <option value="TS">Trieste</option>
                                        <option value="UD">Udine</option>
                                        <option value="VA">Varese</option>
                                        <option value="VE">Venezia</option>
                                        <option value="VB">Verbano-Cusio-Ossola</option>
                                        <option value="VC">Vercelli</option>
                                        <option value="VR">Verona</option>
                                        <option value="VV">Vibo valentia</option>
                                        <option value="VI">Vicenza</option>
                                        <option value="VT">Viterbo</option>
                                    </Form.Control>
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
