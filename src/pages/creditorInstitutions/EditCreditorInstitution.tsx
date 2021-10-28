import React from "react";
import {Alert, Badge, Breadcrumb, Button, Card, Form, Table} from "react-bootstrap";
import {FaCheck, FaInfoCircle, FaPlus, FaSpinner, FaTimes} from "react-icons/fa";
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
        this.save = this.save.bind(this);
        this.discard = this.discard.bind(this);
    }

    getCreditorInstitution(code: string): void {
        apiClient.getCreditorInstitution({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            if (response.right.status === 200) {
                this.setState({creditorInstitution: response.right.value});
                this.setState({ciName: response.right.value.business_name});
                let backup = {...this.state.backup};
                backup.creditorInstitution = Object.assign({}, response.right.value);
                this.setState({backup});

            }
            else {
                this.setState({isError: true});
            }
            // eslint-disable-next-line no-console
            console.log("CODE", response);
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
            // eslint-disable-next-line no-console
            console.log("IBAN", response);
            if (response.right.status === 200) {
                this.setState({ibanList: response.right.value.ibans});
                let backup = {...this.state.backup};
                backup.ibans = response.right.value;
                this.setState({backup});
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
            // eslint-disable-next-line no-console
            console.log("STATIONS", response);
            if (response.right.status === 200) {
                this.setState({stationList: response.right.value.stations_list});
                let backup = {...this.state.backup};
                backup.stations = response.right.value;
                this.setState({backup});
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
            // eslint-disable-next-line no-console
            console.log("ENCODINGS", response);
            if (response.right.status === 200) {
                this.setState({encodings: response.right.value.encodings});
                let backup = {...this.state.backup};
                backup.encodings = response.right.value;
                this.setState({backup});
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
        this.setState({isError: false});
        this.getCreditorInstitution(code);
        this.getIbans(code);
        this.getStations(code);
        this.getEncodings(code);
    }

    handleChange(event: any, obj: string) {
        // eslint-disable-next-line functional/no-let
        let creditorInstitution: CreditorInstitutionDetails = this.state.creditorInstitution;
        if (obj === "creditorInstitution") {
            // eslint-disable-next-line functional/immutable-data
            console.log("TAR", event.target.name, event.target.value);
            creditorInstitution[event.target.name] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
            console.log("TAR1", event.target.name, event.target.value, creditorInstitution[event.target.name]);
        }
        else {
            // eslint-disable-next-line functional/immutable-data
            creditorInstitution.address[event.target.name] = event.target.value;
        }
        this.setState({creditorInstitution: creditorInstitution});
    }

    save(section: string) {
        console.log("save", section);
        apiClient.updateCreditorInstitution({
            ApiKey: "",
            creditorinstitutioncode: this.state.code,
            body: this.state.creditorInstitution
        }).then((response: any) => {
            console.error("SAVE", response);
        }).catch((error: any) => {
            console.error("ERROR", error);
        });
    }

    discard(section: string) {
        this.setState({[section]: Object.assign({}, this.state.backup[section])});
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
                                                                          value={this.state.creditorInstitution.address?.country_code.toLowerCase()}
                                                                          onChange={(e) => this.handleChange(e, "address")}>
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
                                                                this.save("creditorInstitution");
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
