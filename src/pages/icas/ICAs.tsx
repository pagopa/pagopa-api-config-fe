import React from 'react';
import {Breadcrumb, Form, Table} from 'react-bootstrap';
import {Props} from "io-ts";
import {FaCheck, FaSpinner, FaTimes} from "react-icons/fa";
import {apiClient} from "../../util/apiClient";

interface XMLData {
    inProgress: boolean;
    pagoPA: string;
    value: string;
    valid: boolean;
    action: string;
}

interface IProps {
}

interface IState {
    xml: string;
    creditorInstitutionName: XMLData;
    creditorInstitutionCode: XMLData;
    ibans: Array<XMLData>;
}

export default class Ica extends React.Component<IProps, IState> {

    constructor(props: Props) {
        super(props);

        this.state = {
            xml: "",
            creditorInstitutionCode: this.initXMLData(),
            creditorInstitutionName: this.initXMLData(),
            ibans: []
        };

        this.handleFile = this.handleFile.bind(this);
    }

    initXMLData(): XMLData {
        return {
            inProgress: true,
            pagoPa: "",
            value: "",
            valid: false,
            action: ""
        } as unknown as XMLData;
    }

    getCreditorInstitution(code: string): void {
        apiClient.getCreditorInstitution({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            if (response.right.status === 200) {
                const codeData = this.state.creditorInstitutionCode;
                const creditorInstitutionCode: XMLData = {
                    inProgress: false,
                    pagoPA: response.right.value.creditor_institution_code,
                    value: codeData.value,
                    valid: codeData.value === response.right.value.creditor_institution_code,
                    action: ""
                };
                this.setState({creditorInstitutionCode});

                const nameData = this.state.creditorInstitutionName;
                const creditorInstitutionName: XMLData = {
                    inProgress: false,
                    pagoPA: response.right.value.business_name,
                    value: nameData.value,
                    valid: nameData.value === response.right.value.business_name,
                    action: ""
                };
                this.setState({creditorInstitutionName});
            }
            else {
                console.log("TODO");
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

    getIbans(creditorInstitutionCode: string): void {
        apiClient.getCreditorInstitutionsIbans({
            ApiKey: "",
            creditorinstitutioncode: creditorInstitutionCode
        }).then((response: any) => {
            console.log("IBAN LIST", response, this.state.ibans);
            if (response.right.status === 200) {
                const checkedIbans: Array<XMLData> = [];
                this.state.ibans.map((iban: XMLData) => {
                    let found = false;
                    for (let i of response.right.value.ibans) {
                        if (iban.value === i.iban) {
                            found = true;
                            break;
                        }
                    }
                    iban.inProgress = false;
                    iban.valid = found;
                    iban.action = !found ? "Iban non presente" : "";
                    checkedIbans.push(iban);
                });
                this.setState({ibans: checkedIbans});
            }
            else {
                console.log("TODO");
            }
            console.log("TODO", this.state.ibans);
        }).catch((err: any) => {
            // eslint-disable-next-line no-console
            console.error("ERR", err);
        })
        .finally(() => this.setState({isLoading: false}));
    }

    getDefaultXMLData(value: string): XMLData {
        return {
            inProgress: true,
            pagoPA: "",
            value,
            valid: false,
            action: ""
        } as XMLData;
    }

    checkXML(): void {
        const code: any = new window.DOMParser().parseFromString(this.state.xml, "text/xml");
        window.code = code;

        const ciCode = code.getElementsByTagName("identificativoDominio")[0].textContent;

        const creditorInstitutionCode: XMLData = this.getDefaultXMLData(ciCode);
        this.setState({creditorInstitutionCode});

        const creditorInstitutionName: XMLData = this.getDefaultXMLData(code.getElementsByTagName("ragioneSociale")[0].textContent);
        this.setState({creditorInstitutionName});

        this.getCreditorInstitution(ciCode);

        for (const iban of code.getElementsByTagName("ibanAccredito")) {
            const ibanData: XMLData = this.getDefaultXMLData(iban.textContent);
            let storedIbans = this.state.ibans;
            storedIbans.push(ibanData);
            this.setState({ibans: storedIbans});
        }
        this.getIbans(ciCode);
    }

    handleFile(event: any) {
        const reader = new FileReader();
        reader.readAsText(event.target.files[0]);
        reader.onload = () => {
            this.setState({xml: reader.result});
            this.checkXML();
        };
    }

    render(): React.ReactNode {
        const getRow = (rowTitle: string, data: XMLData, key: string) => (
                    <tr key={key}>
                        <td className="font-weight-bold">{rowTitle}</td>
                        <td>{data.value}</td>
                        <td className="text-center">
                            {data.inProgress && <FaSpinner className="spinner" />}
                            {!data.inProgress && data.valid && <FaCheck className="text-success" />}
                            {!data.inProgress && !data.valid && <FaTimes className="text-danger" />}
                        </td>
                        <td>{data.action}</td>
                    </tr>
            );

        const getIbansRows = () => this.state.ibans.map((iban: XMLData, index: number) => getRow("Iban " + (index+1).toString(), iban, "iban-" + index.toString()));

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/icas">Informatica Conto Accredito</Breadcrumb.Item>
                            <Breadcrumb.Item active>Verifica</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <h2>Verifica Informatica Conto Accredito</h2>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Label>XML File</Form.Label>
                            <Form.Control type="file" accept=".xml" onChange={(e) => this.handleFile(e)}/>
                        </Form.Group>
                    </div>
                    <div className="col-md-12">
                        <pre lang="xml">
                            {this.state.xml}
                        </pre>
                    </div>
                    <div className="col-md-12">
                        <Table hover responsive size="sm">
                            <thead>
                            <tr>
                                <th className=""></th>
                                <th className="">Contenuto ICA</th>
                                <th className="text-center">Valido</th>
                                <th className="">Intervento</th>
                            </tr>
                            </thead>
                            <tbody>
                            {getRow("Ente Creditore", this.state.creditorInstitutionName, "ec-business-name")}
                            {getRow("Codice Ente Creditore", this.state.creditorInstitutionCode, "ec-code")}

                            {getIbansRows()}

                            </tbody>
                        </Table>
                    </div>
                </div>
            </div>

        );
    }
}
