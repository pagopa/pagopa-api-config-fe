import React from "react";
import {Alert, Breadcrumb, Card, Form, Table} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
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
}

export default class CreditorInstitution extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
            creditorInstitution: {},
            ibanList: []
        };
    }

    componentDidMount(): void {
        const code = this.props.match.params.code;
        this.setState({isError: false});
        apiClient.getCreditorInstitution({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            console.log("CODE", response);
            if (response.value.status === 200) {
                this.setState({creditorInstitution: response.value.value});
            }
            // else {
            //     this.setState({isError: true});
            // }
        })
        .catch((err: any) => {
            console.error("ERR", err);
            this.setState({isError: true});
        })
        .finally(() => this.setState({isLoading: false}));

        apiClient.getCreditorInstitutionsIbans({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            console.log("IBAN", response);
            if (response.value.status === 200) {
                this.setState({ibanList: response.value.value.ibans});
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
                            {isLoading &&  ( <FaSpinner className="spinner" /> )}
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
                                                    <Form.Control type="code" placeholder="codice" value={this.state.creditorInstitution.creditor_institution_code} readOnly />
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
                                                    <Form.Control type="location" placeholder="indirizzo" value={this.state.creditorInstitution.address?.location} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="city" className="col-md-3">
                                                    <Form.Label>Città</Form.Label>
                                                    <Form.Control type="city" placeholder="città" value={this.state.creditorInstitution.address?.city} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="country_code" className="col-md-2">
                                                    <Form.Label>Provincia</Form.Label>
                                                    <Form.Control type="country_code" placeholder="provincia" value={this.state.creditorInstitution.address?.country_code} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="cap" className="col-md-2">
                                                    <Form.Label>CAP</Form.Label>
                                                    <Form.Control type="cap" placeholder="cap" value={this.state.creditorInstitution.address?.zip_code} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="tax" className="col-md-4">
                                                    <Form.Label>Domicilio fiscale</Form.Label>
                                                    <Form.Control type="tax" placeholder="tax domicile" value={this.state.creditorInstitution.address?.tax_domicile} readOnly />
                                                </Form.Group>
                                                <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                            custom
                                                            defaultChecked={this.state.creditorInstitution.psp_payment === true}
                                                            type={'checkbox'}
                                                            id={'psp-payment'}
                                                            label={'Pagamento PSP'}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                            custom
                                                            defaultChecked={this.state.creditorInstitution.reporting_ftp === true}
                                                            type={'checkbox'}
                                                            id={'reporting-ftp'}
                                                            label={'Rendicontazione FTP'}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId="tax" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                            custom
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
                                                            <h5>Iban</h5>
                                                        </Card.Header>
                                                        <Card.Body>
                                                            <Table hover responsive size="sm" >
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
