import React from "react";
import {Alert, Badge, Breadcrumb, Card, Form, Table} from "react-bootstrap";
import {FaCheck, FaInfoCircle, FaSpinner, FaTimes} from "react-icons/fa";
import {apiClient} from "../../util/apiClient";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    code: string;
    creditorInstitution: any;
    ibanList: [];
    stationList: [];
    encodings: [];
}

export default class CreditorInstitution extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
            creditorInstitution: {},
            ibanList: [],
            stationList: [],
            encodings: []
        };
    }

    getCreditorInstitution(code: string): void {
        apiClient.getCreditorInstitution({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            if (response.right.status === 200) {
                this.setState({creditorInstitution: response.right.value});
            }
            // else {
            //     this.setState({isError: true});
            // }
            console.log("CODE", response, this.state.creditorInstitution);
        })
        .catch((err: any) => {
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
            console.log("IBAN", response);
            if (response.right.status === 200) {
                this.setState({ibanList: response.right.value.ibans});
            }
            // else {
            //     this.setState({isError: true});
            // }
        })
        .catch((err: any) => {
            console.error("ERR", err);
            this.setState({isError: true});
        });
    }

    getStations(code: string): void {
        apiClient.getCreditorInstitutionStations({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            console.log("STATIONS", response);
            if (response.right.status === 200) {
                this.setState({stationList: response.right.value.stations_list});
            }
            // else {
            //     this.setState({isError: true});
            // }
        })
        .catch((err: any) => {
            console.error("ERR", err);
            this.setState({isError: true});
        });
    }

    getEncodings(code: string): void {
        apiClient.getCreditorInstitutionEncodings({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            console.log("ENCODINGS", response);
            if (response.right.status === 200) {
                this.setState({encodings: response.right.value.encodings});
            }
            // else {
            //     this.setState({isError: true});
            // }
        })
        .catch((err: any) => {
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

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

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
                                <Breadcrumb.Item active>{this.state.creditorInstitution.business_name}</Breadcrumb.Item>
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
                                                    <h2>{this.state.creditorInstitution.business_name}</h2>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="code" className="col-md-3">
                                                    <Form.Label>Codice</Form.Label>
                                                    <Form.Control type="code" placeholder="-" value={this.state.creditorInstitution.creditor_institution_code} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="enabled" className="col-md-3">
                                                    <Form.Label>Stato</Form.Label>
                                                    <Form.Control as="select" type="enabled" placeholder="stato" readOnly>
                                                        {this.state.creditorInstitution && <option>Abilitato</option> }
                                                        {!this.state.creditorInstitution && <option>Non Abilitato</option> }
                                                    </Form.Control>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="location" className="col-md-4">
                                                    <Form.Label>Indirizzo</Form.Label>
                                                    <Form.Control type="location" placeholder="-" value={this.state.creditorInstitution.address?.location} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="city" className="col-md-3">
                                                    <Form.Label>Città</Form.Label>
                                                    <Form.Control type="city" placeholder="-" value={this.state.creditorInstitution.address?.city} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="country_code" className="col-md-2">
                                                    <Form.Label>Provincia</Form.Label>
                                                    <Form.Control type="country_code" placeholder="-" value={this.state.creditorInstitution.address?.country_code} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="cap" className="col-md-2">
                                                    <Form.Label>CAP</Form.Label>
                                                    <Form.Control type="cap" placeholder="-" value={this.state.creditorInstitution.address?.zip_code} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="tax" className="col-md-4">
                                                    <Form.Label>Domicilio fiscale</Form.Label>
                                                    <Form.Control type="tax" placeholder="-" value={this.state.creditorInstitution.address?.tax_domicile} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                            custom
                                                            disabled
                                                            defaultChecked={this.state.creditorInstitution.psp_payment === true}
                                                            type={'checkbox'}
                                                            id={'psp-payment'}
                                                            label={'Pagamento PSP'}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                            custom
                                                            disabled
                                                            defaultChecked={this.state.creditorInstitution.reporting_ftp === true}
                                                            type={'checkbox'}
                                                            id={'reporting-ftp'}
                                                            label={'Rendicontazione FTP'}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                            custom
                                                            disabled
                                                            defaultChecked={this.state.creditorInstitution.reporting_zip === true}
                                                            type={'checkbox'}
                                                            id={'reporting-zip'}
                                                            label={'Rendicontazione ZIP'}
                                                    />
                                                </Form.Group>
                                            </div>
                                            <div className="row">
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
