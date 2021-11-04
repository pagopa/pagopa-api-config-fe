import React from 'react';
import {Breadcrumb, Form, Table} from 'react-bootstrap';
import {Props} from "io-ts";
import {FaCheck, FaExclamationTriangle, FaSpinner, FaTimes} from "react-icons/fa";
import {apiClient} from "../../util/apiClient";

interface XMLData {
    inProgress: boolean;
    value: string;
    valid: boolean;
    action: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {}

interface IState {
    xml: string;
    creditorInstitutionName: XMLData;
    creditorInstitutionCode: XMLData;
    error: any;
    ibans: Array<XMLData>;
    validityDate: XMLData;
}

export default class CheckIca extends React.Component<IProps, IState> {

    constructor(props: Props) {
        super(props);

        this.state = {
            xml: "",
            creditorInstitutionCode: this.initXMLData(),
            creditorInstitutionName: this.initXMLData(),
            error: {
                isVisible: false,
                message: ""
            },
            ibans: [],
            validityDate: this.initXMLData()
        };
        this.handleFile = this.handleFile.bind(this);
    }

    initState(): void {
        this.setState({
            xml: "",
            creditorInstitutionCode: this.initXMLData(),
            creditorInstitutionName: this.initXMLData(),
            error: {
                isVisible: false,
                message: ""
            },
            ibans: [],
            validityDate: this.initXMLData()
        });
    }

    initXMLData(): XMLData {
        return {
            inProgress: true,
            value: "",
            valid: false,
            action: ""
        } as unknown as XMLData;
    }

    checkCreditorInstitution(code: string): Promise<any> {
        const request = apiClient.getCreditorInstitution({
            ApiKey: "",
            creditorinstitutioncode: code
        });

        request
            .then((response: any) => {
                if (response.right.status === 200) {
                    const codeData = this.state.creditorInstitutionCode;
                    const creditorInstitutionCode: XMLData = {
                        inProgress: false,
                        value: codeData.value,
                        valid: codeData.value === response.right.value.creditor_institution_code,
                        action: ""
                    };
                    this.setState({creditorInstitutionCode});

                    const nameData = this.state.creditorInstitutionName;
                    const creditorInstitutionName: XMLData = {
                        inProgress: false,
                        value: nameData.value,
                        valid: nameData.value === response.right.value.business_name,
                        action: ""
                    };
                    this.setState({creditorInstitutionName});
                }
                else {
                    const error = {
                        isVisible: true,
                        message: "Problemi a recuperare l'Ente Creditore"
                    };
                    this.setState({error});
                }
            })
                .catch(() => {
                    const error = {
                        isVisible: true,
                        message: "Problemi a recuperare l'Ente Creditore"
                    };
                    this.setState({error});
                });

        return request;
    }

    checkIbans(creditorInstitutionCode: string): void {
        apiClient.getCreditorInstitutionsIbans({
            ApiKey: "",
            creditorinstitutioncode: creditorInstitutionCode
        }).then((response: any) => {
            if (response.right.status === 200) {
                const checkedIbans: Array<XMLData> = [];
                this.state.ibans.forEach((iban: XMLData) => {
                    // eslint-disable-next-line functional/no-let
                    let found = false;
                    for (const i of response.right.value.ibans) {
                        if (iban.value === i.iban) {
                            found = true;
                            break;
                        }
                    }
                    const ibanToPush = {
                        inProgress: false,
                        value: iban.value,
                        valid: found,
                        action: !found ? "Iban non presente" : ""
                    } as XMLData;
                    // eslint-disable-next-line functional/immutable-data
                    checkedIbans.push(ibanToPush);
                });
                this.setState({ibans: checkedIbans});
            }
            else {
                const error = {
                    isVisible: true,
                    message: "Problemi a recuperare gli Iban dell'Ente Creditore"
                };
                this.setState({error});
            }
        }).catch(() => {
            const error = {
                isVisible: true,
                message: "Problemi a recuperare gli Iban dell'Ente Creditore"
            };
            this.setState({error});
        });
    }

    checkValidityDate(): void {
        const validityDate = this.state.validityDate;
        const now = (new Date()).getTime();
        // eslint-disable-next-line functional/no-let
        let valid = true;
        // eslint-disable-next-line functional/no-let
        let action = "";
        if (new Date(validityDate.value).getTime() <= now) {
            action = "La data di inizio validità deve essere superiore alla data corrente";
            valid = false;
        }

        const validity = {
            inProgress: false,
            value: this.state.validityDate.value,
            valid,
            action
        } as XMLData;

        this.setState({validityDate: validity});
    }

    getDefaultXMLData(value: string): XMLData {
        return {
            inProgress: true,
            value,
            valid: false,
            action: ""
        } as XMLData;
    }

    checkXML(code: any): void {
        const ciCode = code.getElementsByTagName("identificativoDominio")[0].textContent;

        const creditorInstitutionCode: XMLData = this.getDefaultXMLData(ciCode);
        this.setState({creditorInstitutionCode});

        const creditorInstitutionName: XMLData = this.getDefaultXMLData(code.getElementsByTagName("ragioneSociale")[0].textContent);
        this.setState({creditorInstitutionName});

        const request = this.checkCreditorInstitution(ciCode);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        request.then((result: any) => {
            if (result.right.status === 200) {
                for (const iban of code.getElementsByTagName("ibanAccredito")) {
                    const ibanData: XMLData = this.getDefaultXMLData(iban.textContent);
                    const storedIbans = this.state.ibans;
                    // eslint-disable-next-line functional/immutable-data
                    storedIbans.push(ibanData);
                    this.setState({ibans: storedIbans});
                }
                this.checkIbans(ciCode);

                const validityDate: XMLData = this.getDefaultXMLData(code.getElementsByTagName("dataInizioValidita")[0].textContent);
                this.setState({validityDate});
                this.checkValidityDate();
            }
        });
    }

    handleFile(event: any) {
        this.initState();

        const reader = new FileReader();
        reader.readAsText(event.target.files[0]);
        // eslint-disable-next-line functional/immutable-data
        reader.onload = () => {
            const xml = reader.result as string;
            const code: any = new window.DOMParser().parseFromString(xml, "text/xml");
            if (code.getElementsByTagName("parsererror").length > 0) {
                const error = {
                    isVisible: true,
                    message: "XML non valido"
                };
                this.setState({error});
            }
            else {
                this.setState({xml});
                this.checkXML(code);
            }
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
                            <Breadcrumb.Item href="/icas">Informativa Conto Accredito</Breadcrumb.Item>
                            <Breadcrumb.Item active>Verifica</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <h2>Verifica Informativa Conto Accredito</h2>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Label>File XML</Form.Label>
                            <Form.Control type="file" accept=".xml" onChange={(e) => this.handleFile(e)}/>
                        </Form.Group>
                    </div>
                    <div className="col-md-12">
                        <pre lang="xml">
                            {this.state.xml.length === 0 && "Caricare un XML valido"}
                            {this.state.xml.length > 0 && this.state.xml}
                        </pre>
                    </div>
                    {
                        this.state.error.isVisible &&
						<div className="col-md-12 alert alert-warning">
                            <FaExclamationTriangle /> <span>{this.state.error.message}</span>
						</div>
                    }
                    {
                        this.state.xml.length > 0 &&
					    <div className="col-md-12">
						<Table hover responsive size="sm">
							<thead>
							<tr>
								<th className=""></th>
								<th className="">Contenuto ICA</th>
								<th className="text-center">Valido</th>
								<th className="">Intervento da effettuare</th>
							</tr>
							</thead>
							<tbody>
                            {getRow("Ente Creditore", this.state.creditorInstitutionName, "ec-business-name")}
                            {getRow("Codice Ente Creditore", this.state.creditorInstitutionCode, "ec-code")}
                            {getRow("Data Inizio Validità", this.state.validityDate, "validity-date")}
                            {getIbansRows()}

							</tbody>
						</Table>
					</div>
                    }
                </div>
            </div>

        );
    }
}
