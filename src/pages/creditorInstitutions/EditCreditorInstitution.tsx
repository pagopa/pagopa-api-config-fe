import React from "react";
import {Alert, Badge, Breadcrumb, Button, Card, Form, Table} from "react-bootstrap";
import {FaCheck, FaInfoCircle, FaPlus, FaSpinner, FaTimes} from "react-icons/fa";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import {CreditorInstitutionDetails} from "../../../generated/api/CreditorInstitutionDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    backup: any;
    ciName: string;
    code: string;
    creditorInstitution: CreditorInstitutionDetails;
    edit: boolean;
    ibanList: [];
    stationList: [];
    encodings: [];
}

export default class EditCreditorInstitution extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            backup: {
                creditorInstitution: {} as CreditorInstitutionDetails,
                ibans: [],
                stations: [],
                encodings: []
            },
            ciName: "",
            code: "",
            creditorInstitution: {} as CreditorInstitutionDetails,
            edit: false,
            ibanList: [],
            stationList: [],
            encodings: []
        };

        this.handleChange = this.handleChange.bind(this);
        this.saveCreditorInstitution = this.saveCreditorInstitution.bind(this);
        this.discard = this.discard.bind(this);
        this.createEncoding = this.createEncoding.bind(this);
    }

    updateBackup(section: string, data: CreditorInstitutionDetails | any) {
        // eslint-disable-next-line functional/no-let
        let backup = {...this.state.backup};
        backup = { ...backup, [section]: data };
        this.setState({backup});
    }

    getCreditorInstitution(code: string): void {
        apiClient.getCreditorInstitution({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            if (response.right.status === 200) {
                this.setState({creditorInstitution: response.right.value});
                this.setState({ciName: response.right.value.business_name});
                this.updateBackup("creditorInstitution", response.right.value);
            }
            else {
                this.setState({isError: true});
            }
        })
        .catch((err: any) => {
            // eslint-disable-next-line no-console
            console.error("ERR", err);
            this.setState({isError: true});
        })
        .finally(() => this.setState({isLoading: false}));
    }

    getIbans(code: string): void {
        apiClient.getCreditorInstitutionsIbans({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            if (response.right.status === 200) {
                this.setState({ibanList: response.right.value.ibans});
                this.updateBackup("ibans", response.right.value);
            }
            else {
                this.setState({isError: true});
            }
        })
        .catch((err: any) => {
            // eslint-disable-next-line no-console
            console.error("ERR", err);
            this.setState({isError: true});
        });
    }

    getStations(code: string): void {
        apiClient.getCreditorInstitutionStations({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            if (response.right.status === 200) {
                this.setState({stationList: response.right.value.stations_list});
                this.updateBackup("stations", response.right.value);
            }
            else {
                this.setState({isError: true});
            }
        })
        .catch((err: any) => {
            // eslint-disable-next-line no-console
            console.error("ERR", err);
            this.setState({isError: true});
        });
    }

    getEncodings(code: string): void {
        apiClient.getCreditorInstitutionEncodings({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            if (response.right.status === 200) {
                this.setState({encodings: response.right.value.encodings});
                this.updateBackup("encodings", response.right.value);
            }
            else {
                this.setState({isError: true});
            }
        })
        .catch((err: any) => {
            // eslint-disable-next-line no-console
            console.error("ERR", err);
            this.setState({isError: true});
        });
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({code, isError: false});
        this.getCreditorInstitution(code);
        this.getIbans(code);
        this.getStations(code);
        this.getEncodings(code);
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

    saveCreditorInstitution() {
        apiClient.updateCreditorInstitution({
            ApiKey: "",
            creditorinstitutioncode: this.state.code,
            body: this.state.creditorInstitution
        }).then((response: any) => {
            // eslint-disable-next-line no-console
            console.log("SAVE", response);
            if (response.right.status === 200) {
                toast.info("Modifica avvenuta con successo.");
                this.setState({creditorInstitution: response.right.value});
                this.setState({creditorInstitution: response.right.value});
                this.setState({ciName: response.right.value.business_name});
                this.updateBackup("creditorInstitution", response.right.value);
            }
            else {
                // eslint-disable-next-line no-prototype-builtins
                const message = (response.right.hasOwnProperty("title")) ? response.right.value.title : "Operazione non avvenuta a causa di un errore";
                toast.error(message, {theme: "colored"});
            }
        }).catch((error: any) => {
            // eslint-disable-next-line no-console
            console.error("ERROR", error);
            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
        });
    }

    discard(section: string) {
        // "as any" is necessary because it seems to be a bug: https://github.com/Microsoft/TypeScript/issues/13948
        this.setState({[section]: Object.assign({}, this.state.backup[section])} as any);
    }

    createEncoding(): void {
        // eslint-disable-next-line no-console
        console.log("TODO");
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        // create rows for ibans table
        const ibanList: any = [];
        this.state.ibanList.map((item: any, index: number) => {
            const row = (
                    <tr key={index}>
                        <td>{item.iban}</td>
                        <td>{item.validity_date.toLocaleDateString()}</td>
                        <td>{item.publication_date.toLocaleDateString()}</td>
                    </tr>
            );
            ibanList.push(row);
        });

        // create rows for stations table
        const stationList: any = [];
        this.state.stationList.map((item: any, index: number) => {
            const row = (
                    <tr key={index}>
                        <td>{item.station_code}</td>
                        <td className="text-center">
                        { item.enabled && <FaCheck className="text-success" /> }
                        { !item.enabled && <FaTimes className="text-danger" /> }
                        </td>
                        <td className="text-center">{item.application_code}</td>
                        <td className="text-center">{item.segregation_code}</td>
                        <td className="text-center">{item.version}</td>
                        <td className="text-center">
                            { item.mod4 && <FaCheck className="text-success" /> }
                            { !item.mod4 && <FaTimes className="text-danger" /> }
                        </td>
                        <td className="text-center">
                            { item.broadcast && <FaCheck className="text-success" /> }
                            { !item.broadcast && <FaTimes className="text-danger" /> }
                        </td>
                    </tr>
            );
            stationList.push(row);
        });

        // create rows for encodings table
        const encodingList: any = [];
        this.state.encodings.map((item: any, index: number) => {
            const row = (
                    <tr key={index}>
                        <td>
                            {item.code_type}
                            {item.code_type.toUpperCase() === "BARCODE_GS1_128" && <Badge className="ml-2" variant="danger">DEPRECATO</Badge>}
                        </td>
                        <td>{item.code}</td>
                    </tr>
            );
            encodingList.push(row);
        });


        return (
                <div className="container-fluid creditor-institutions">
                    <div className="row">
                        <div className="col-md-12 mb-5">
                            <Breadcrumb>
                                <Breadcrumb.Item href="/creditor-institutions">Enti Creditori</Breadcrumb.Item>
                                <Breadcrumb.Item active>{this.state.ciName}</Breadcrumb.Item>
                            </Breadcrumb>
                        </div>
                        <div className="col-md-12">
                            {isError &&  (
                                    <Alert className={'col-md-12'} variant={'danger'}>
                                        Informazioni non disponibili!
                                    </Alert>
                            )}
                            {isLoading &&  ( <div className="text-center"><FaSpinner className="spinner" size={28} /></div> )}
                            {
                                !isLoading && (
                                        <>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <h2>{this.state.ciName}</h2>
                                                </div>
                                            </div>
                                            <Card>
                                                <Card.Header>
                                                    <h5>Anagrafica</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <div className="row">
                                                        <Form.Group controlId="business_name" className="col-md-3">
                                                            <Form.Label>Nome</Form.Label>
                                                            <Form.Control name="business_name" placeholder=""
                                                                          value={this.state.creditorInstitution.business_name}
                                                                          onChange={(e) => this.handleChange(e, "creditorInstitution")} />
                                                        </Form.Group>
                                                        <Form.Group controlId="code" className="col-md-4">
                                                            <Form.Label>Codice</Form.Label>
                                                            <Form.Control name="creditor_institution_code" placeholder=""
                                                                          value={this.state.creditorInstitution.creditor_institution_code}
                                                                          onChange={(e) => this.handleChange(e, "creditorInstitution")} />
                                                        </Form.Group>
                                                        <Form.Group controlId="enabled" className="col-md-3">
                                                            <Form.Label>Stato</Form.Label>
                                                            <Form.Control as="select" name="enabled"
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
                                                            <Form.Control name="location" placeholder=""
                                                                          value={this.state.creditorInstitution.address?.location}
                                                                          onChange={(e) => this.handleChange(e, "address")} />
                                                        </Form.Group>
                                                        <Form.Group controlId="city" className="col-md-3">
                                                            <Form.Label>Città</Form.Label>
                                                            <Form.Control name="city" placeholder=""
                                                                          value={this.state.creditorInstitution.address?.city}
                                                                          onChange={(e) => this.handleChange(e, "address")} />
                                                        </Form.Group>
                                                        <Form.Group controlId="country_code" className="col-md-2">
                                                            <Form.Label>Provincia</Form.Label>
                                                            <Form.Control as="select" placeholder="" name="country_code"
                                                                          value={this.state.creditorInstitution.address?.country_code}
                                                                          onChange={(e) => this.handleChange(e, "address")}>
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
                                                            <Form.Control name="zip_code" placeholder=""
                                                                          value={this.state.creditorInstitution.address?.zip_code}
                                                                          onChange={(e) => this.handleChange(e, "address")} />
                                                        </Form.Group>
                                                        <Form.Group controlId="tax_domicile" className="col-md-4">
                                                            <Form.Label>Domicilio fiscale</Form.Label>
                                                            <Form.Control name="tax_domicile" placeholder="" value={this.state.creditorInstitution.address?.tax_domicile}
                                                                          onChange={(e) => this.handleChange(e, "address")} />
                                                        </Form.Group>
                                                        <Form.Group controlId="psp_payment" className="col-md-2 custom-control-box">
                                                            <Form.Check
                                                                    custom
                                                                    defaultChecked={this.state.creditorInstitution.psp_payment === true}
                                                                    name="psp_payment"
                                                                    type={'checkbox'}
                                                                    id={'psp-payment'}
                                                                    label={'Pagamento PSP'}
                                                            />
                                                        </Form.Group>
                                                        <Form.Group controlId="reporting_ftp" className="col-md-2 custom-control-box">
                                                            <Form.Check
                                                                    custom
                                                                    defaultChecked={this.state.creditorInstitution.reporting_ftp === true}
                                                                    type={'checkbox'}
                                                                    id={'reporting-ftp'}
                                                                    name="reporting_ftp"
                                                                    label={'Rendicontazione FTP'}
                                                            />
                                                        </Form.Group>
                                                        <Form.Group controlId="reporting_zip" className="col-md-2 custom-control-box">
                                                            <Form.Check
                                                                    custom
                                                                    defaultChecked={this.state.creditorInstitution.reporting_zip === true}
                                                                    type={'checkbox'}
                                                                    id={'reporting-zip'}
                                                                    name="reporting_zip"
                                                                    label={'Rendicontazione ZIP'}
                                                            />
                                                        </Form.Group>
                                                    </div>
                                                </Card.Body>
                                                <Card.Footer>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            <Button className="ml-2 float-md-right" variant="secondary" onClick={() => {
                                                                this.discard("creditorInstitution");
                                                            }} >Annulla</Button>
                                                            <Button className="float-md-right" onClick={() => {
                                                                this.saveCreditorInstitution();
                                                            }} >Salva</Button>
                                                        </div>
                                                    </div>
                                                </Card.Footer>
                                            </Card>
                                            <div className="row mt-3">
                                                <div className="col-md-12">
                                                    <Card>
                                                        <Card.Header>
                                                            <h5>Codifiche</h5>
                                                        </Card.Header>
                                                        <Card.Body>
                                                            {Object.keys(encodingList).length === 0 &&  (
                                                                    <Alert className={'col-md-12'} variant={"warning"} ><FaInfoCircle className="mr-1" />Codifiche non presenti</Alert>
                                                            )}
                                                            {Object.keys(encodingList).length > 0 &&
															<Table hover responsive size="sm">
																<thead>
																<tr>
																	<th className="">Tipo</th>
																	<th className="">Codice</th>
																</tr>
																</thead>
																<tbody>
                                                                {encodingList}
																</tbody>
															</Table>
                                                            }
                                                        </Card.Body>
                                                        <Card.Footer>
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <Button className="float-md-right" onClick={() => { this.createEncoding(); }} disabled>
                                                                        Nuovo <FaPlus />
                                                                    </Button>
                                                                </div>

                                                            </div>
                                                        </Card.Footer>
                                                    </Card>
                                                </div>
                                            </div>
                                            <div className="row mt-3">
                                                <div className="col-md-12">
                                                    <Card>
                                                        <Card.Header>
                                                            <h5>Iban</h5>
                                                        </Card.Header>
                                                        <Card.Body>
                                                            {Object.keys(ibanList).length === 0 &&  (
                                                                    <Alert className={'col-md-12'} variant={"warning"} ><FaInfoCircle className="mr-1" />Iban non presenti</Alert>
                                                            )}
                                                            {Object.keys(ibanList).length > 0 &&
															<Table hover responsive size="sm">
																<thead>
																<tr>
																	<th className="">Iban</th>
																	<th className="">Validità</th>
																	<th className="">Pubblicazione</th>
																</tr>
																</thead>
																<tbody>
                                                                {ibanList}
																</tbody>
															</Table>
                                                            }
                                                        </Card.Body>
                                                    </Card>
                                                </div>
                                            </div>
                                            <div className="row mt-3">
                                                <div className="col-md-12">
                                                    <Card>
                                                        <Card.Header>
                                                            <h5>Stazioni</h5>
                                                        </Card.Header>
                                                        <Card.Body>
                                                            {Object.keys(stationList).length === 0 &&  (
                                                                    <Alert className={'col-md-12'} variant={"warning"} ><FaInfoCircle className="mr-1" />Stazioni non presenti</Alert>
                                                            )}
                                                            {Object.keys(stationList).length > 0 &&
															<Table hover responsive size="sm">
																<thead>
																<tr>
																	<th className="">Codice</th>
																	<th className="text-center">Abilitata</th>
																	<th className="text-center">Application Code</th>
																	<th className="text-center">Codice Segregazione</th>
																	<th className="text-center">Versione</th>
																	<th className="text-center">Modello 4</th>
																	<th className="text-center">Broadcast</th>
																</tr>
																</thead>
																<tbody>
                                                                {stationList}
																</tbody>
															</Table>
                                                            }
                                                        </Card.Body>
                                                        <Card.Footer>
                                                            <div className="row">
                                                                <div className="col-md-12">
                                                                    <Button className="float-md-right" onClick={() => { this.createEncoding(); }} disabled>
                                                                        Nuovo <FaPlus />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Card.Footer>
                                                    </Card>
                                                </div>
                                            </div>
                                        </>
                                )
                            }
                        </div>
                    </div>
                </div>
        );
    }
}
