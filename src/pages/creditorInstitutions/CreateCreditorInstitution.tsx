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
                "fk_int_quadrature": null,
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
                    console.log("SAVED SUCCESSFULLY");
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
                                        <option value="ag">Agrigento</option>
                                        <option value="al">Alessandria</option>
                                        <option value="an">Ancona</option>
                                        <option value="ao">Aosta</option>
                                        <option value="ar">Arezzo</option>
                                        <option value="ap">Ascoli Piceno</option>
                                        <option value="at">Asti</option>
                                        <option value="av">Avellino</option>
                                        <option value="ba">Bari</option>
                                        <option value="bt">Barletta-Andria-Trani</option>
                                        <option value="bl">Belluno</option>
                                        <option value="bn">Benevento</option>
                                        <option value="bg">Bergamo</option>
                                        <option value="bi">Biella</option>
                                        <option value="bo">Bologna</option>
                                        <option value="bz">Bolzano</option>
                                        <option value="bs">Brescia</option>
                                        <option value="br">Brindisi</option>
                                        <option value="ca">Cagliari</option>
                                        <option value="cl">Caltanissetta</option>
                                        <option value="cb">Campobasso</option>
                                        <option value="ci">Carbonia-iglesias</option>
                                        <option value="ce">Caserta</option>
                                        <option value="ct">Catania</option>
                                        <option value="cz">Catanzaro</option>
                                        <option value="ch">Chieti</option>
                                        <option value="co">Como</option>
                                        <option value="cs">Cosenza</option>
                                        <option value="cr">Cremona</option>
                                        <option value="kr">Crotone</option>
                                        <option value="cn">Cuneo</option>
                                        <option value="en">Enna</option>
                                        <option value="fm">Fermo</option>
                                        <option value="fe">Ferrara</option>
                                        <option value="fi">Firenze</option>
                                        <option value="fg">Foggia</option>
                                        <option value="fc">Forl&igrave;-Cesena</option>
                                        <option value="fr">Frosinone</option>
                                        <option value="ge">Genova</option>
                                        <option value="go">Gorizia</option>
                                        <option value="gr">Grosseto</option>
                                        <option value="im">Imperia</option>
                                        <option value="is">Isernia</option>
                                        <option value="sp">La spezia</option>
                                        <option value="aq">L&apos;aquila</option>
                                        <option value="lt">Latina</option>
                                        <option value="le">Lecce</option>
                                        <option value="lc">Lecco</option>
                                        <option value="li">Livorno</option>
                                        <option value="lo">Lodi</option>
                                        <option value="lu">Lucca</option>
                                        <option value="mc">Macerata</option>
                                        <option value="mn">Mantova</option>
                                        <option value="ms">Massa-Carrara</option>
                                        <option value="mt">Matera</option>
                                        <option value="vs">Medio Campidano</option>
                                        <option value="me">Messina</option>
                                        <option value="mi">Milano</option>
                                        <option value="mo">Modena</option>
                                        <option value="mb">Monza e della Brianza</option>
                                        <option value="na">Napoli</option>
                                        <option value="no">Novara</option>
                                        <option value="nu">Nuoro</option>
                                        <option value="og">Ogliastra</option>
                                        <option value="ot">Olbia-Tempio</option>
                                        <option value="or">Oristano</option>
                                        <option value="pd">Padova</option>
                                        <option value="pa">Palermo</option>
                                        <option value="pr">Parma</option>
                                        <option value="pv">Pavia</option>
                                        <option value="pg">Perugia</option>
                                        <option value="pu">Pesaro e Urbino</option>
                                        <option value="pe">Pescara</option>
                                        <option value="pc">Piacenza</option>
                                        <option value="pi">Pisa</option>
                                        <option value="pt">Pistoia</option>
                                        <option value="pn">Pordenone</option>
                                        <option value="pz">Potenza</option>
                                        <option value="po">Prato</option>
                                        <option value="rg">Ragusa</option>
                                        <option value="ra">Ravenna</option>
                                        <option value="rc">Reggio Calabria</option>
                                        <option value="re">Reggio Emilia</option>
                                        <option value="ri">Rieti</option>
                                        <option value="rn">Rimini</option>
                                        <option value="rm">Roma</option>
                                        <option value="ro">Rovigo</option>
                                        <option value="sa">Salerno</option>
                                        <option value="ss">Sassari</option>
                                        <option value="sv">Savona</option>
                                        <option value="si">Siena</option>
                                        <option value="sr">Siracusa</option>
                                        <option value="so">Sondrio</option>
                                        <option value="ta">Taranto</option>
                                        <option value="te">Teramo</option>
                                        <option value="tr">Terni</option>
                                        <option value="to">Torino</option>
                                        <option value="tp">Trapani</option>
                                        <option value="tn">Trento</option>
                                        <option value="tv">Treviso</option>
                                        <option value="ts">Trieste</option>
                                        <option value="ud">Udine</option>
                                        <option value="va">Varese</option>
                                        <option value="ve">Venezia</option>
                                        <option value="vb">Verbano-Cusio-Ossola</option>
                                        <option value="vc">Vercelli</option>
                                        <option value="vr">Verona</option>
                                        <option value="vv">Vibo valentia</option>
                                        <option value="vi">Vicenza</option>
                                        <option value="vt">Viterbo</option>
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
