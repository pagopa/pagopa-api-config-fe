import React from 'react';
import {Breadcrumb, Form, Table} from 'react-bootstrap';
import {Props} from "io-ts";
import {FaCheck, FaExclamationTriangle, FaMinus, FaSpinner, FaTimes} from "react-icons/fa";
import IBAN from "iban";
import {apiClient} from "../../util/apiClient";
import {Iban} from "../../../generated/api/Iban";
import {Encoding} from "../../../generated/api/Encoding";

interface XMLData {
    inProgress: boolean;
    value: string;
    valid: string;
    note: string;
    action: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {}

interface IState {
    xml: string;
    creditorInstitutionName: XMLData;
    creditorInstitutionCode: XMLData;
    encodings: Array<Encoding>;
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
            encodings: [],
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

    /**
     * Initialize XML data
     */
    initXMLData(): XMLData {
        return {
            inProgress: true,
            note: "",
            value: "",
            valid: "undefined",
            action: ""
        } as unknown as XMLData;
    }

    /**
     * Check if creditor institution code and business name are correct
     * @param code: creditor institution code
     */
    checkCreditorInstitution(code: string): Promise<any> {
        const codeData = this.state.creditorInstitutionCode;
        const nameData = this.state.creditorInstitutionName;

        const request = apiClient.getCreditorInstitution({
            Authorization: `Bearer  ${window.sessionStorage.getItem("secret")}`, 
            ApiKey: "",
            creditorinstitutioncode: code
        });

        request
            .then((response: any) => {
                // eslint-disable-next-line functional/no-let
                let creditorInstitutionCode: XMLData;
                // eslint-disable-next-line functional/no-let
                let creditorInstitutionName: XMLData;
                if (response.right.status === 200) {
                    creditorInstitutionCode = {
                        inProgress: false,
                        note: "",
                        value: codeData.value,
                        valid: codeData.value === response.right.value.creditor_institution_code ? "valid" : "not valid",
                        action: ""
                    } as XMLData;

                    creditorInstitutionName = {
                        inProgress: false,
                        note: "",
                        value: nameData.value,
                        valid: nameData.value === response.right.value.business_name ? "valid" : "not valid",
                        action: ""
                    } as XMLData;

                    this.checkQRCode(code);
                }
                else {
                    const error = {
                        isVisible: true,
                        message: "Problemi di recupero dati dell'Ente Creditore"
                    };
                    this.setState({error});

                    creditorInstitutionCode = {
                        inProgress: false,
                        value: codeData.value,
                        valid: "not valid",
                        note: "Codice non trovato",
                        action: "Verificare il codice dell'Ente Creditore"
                    } as XMLData;

                    creditorInstitutionName = {
                        inProgress: false,
                        value: nameData.value,
                        valid: "not valid",
                        note: "Impossibile validare il nome dell'Ente senza il relativo codice corretto",
                        action: "Verificare il codice dell'Ente Creditore"
                    } as XMLData;
                }
                this.setState({creditorInstitutionCode});
                this.setState({creditorInstitutionName});
            })
            .catch(() => {
                const creditorInstitutionCode = {
                    inProgress: false,
                    value: codeData.value,
                    valid: "undefined",
                    note: "Problema di comunicazione con il servizio",
                    action: ""
                } as XMLData;

                const creditorInstitutionName = {
                    inProgress: false,
                    value: nameData.value,
                    valid: "undefined",
                    note: "Problema di comunicazione con il servizio",
                    action: ""
                } as XMLData;

                this.setState({creditorInstitutionCode});
                this.setState({creditorInstitutionName});


                const error = {
                    isVisible: true,
                    message: "Problemi di recupero dati dell'Ente Creditore"
                };
                this.setState({error});
            });
        return request;
    }

    /**
     * Evaluate if the creditor institution has the QRCode encoding
     * @param code
     * @param encodings
     */
    evaluateQRCode(code: string, encodings: Array<Encoding>) {
        const codeData = this.state.creditorInstitutionCode;
        // eslint-disable-next-line functional/immutable-data
        codeData.note = "QRCode non presente";
        for (const encoding of encodings) {
            if (encoding.code_type.toLowerCase() === "qr_code") {
                if (encoding.encoding_code === code) {
                    // eslint-disable-next-line functional/immutable-data
                    codeData.note = "QRCode presente";
                }
                break;
            }
        }
        this.setState({creditorInstitutionCode: codeData});
    }

    /**
     * Check if the creditor institution has the QRCode encoding
     * @param code
     */
    checkQRCode(code: string): void {
        if (this.state.encodings.length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            apiClient.getCreditorInstitutionEncodings({
                ApiKey: "",
                creditorinstitutioncode: code
            }).then((response: any) => {
                if (response.right.status === 200) {
                    this.setState({encodings: response.right.value.encodings});
                    this.evaluateQRCode(code, response.right.value.encodings);
                }
            });
        }
        else {
            this.evaluateQRCode(code, this.state.encodings);
        }
    }

    /**
     * Evaluate if Iban is related to one of the BARCODE_128_AIM encodings
     * @param iban: Iban to evaluate
     * @param encodings: Encoding list of Creditor Institution
     */
    evaluateBarcode128aim(iban: XMLData, encodings: Array<Encoding>) {
        const postalCode = iban.value.substr(16);
        // eslint-disable-next-line functional/no-let
        let found = false;
        for (const encoding of encodings) {
            if (encoding.code_type.toLowerCase() === "barcode_128_aim") {
                if (encoding.encoding_code === postalCode) {
                    found = true;
                    // eslint-disable-next-line functional/immutable-data
                    iban.valid = "valid";
                    // eslint-disable-next-line functional/immutable-data
                    iban.note = "IBAN nuovo";
                }
                break;
            }
        }
        if (!found) {
            // eslint-disable-next-line functional/immutable-data
            iban.valid = "undefined";
            // eslint-disable-next-line functional/immutable-data
            iban.note = "Codice postale non presente";
            // eslint-disable-next-line functional/immutable-data
            iban.action = "Inserire codifica postale";
        }

        const ibanList = this.state.ibans;
        // eslint-disable-next-line functional/no-let
        for (let i of ibanList) {
            if (i.value === iban.value) {
                i = {...iban};
                break;
            }
        }
        this.setState({ibans: ibanList});
    }

    /**
     * Check encoding BARCODE_128_AIM
     * @param ciCode
     * @param iban
     */
    checkBarcode128aim(ciCode: string, iban: XMLData): void {
        if (this.state.encodings.length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            apiClient.getCreditorInstitutionEncodings({
                ApiKey: "",
                creditorinstitutioncode: ciCode
            }).then((response: any) => {
                if (response.right.status === 200) {
                    this.setState({encodings: response.right.value.encodings});

                    this.evaluateBarcode128aim(iban, response.right.value.encodings);
                }
            });
        }
        else {
            this.evaluateBarcode128aim(iban, this.state.encodings);
        }
    }

    /**
     * Evaluate a specific Iban
     * @param creditorInstitutionCode: creditor institution code
     * @param ibans: iban list already stored
     * @param iban: iban to evaluate
     */
    evaluateIban(creditorInstitutionCode: string, ibans: Array<Iban>, iban: XMLData): XMLData {
        // eslint-disable-next-line functional/no-let
        let found = false;
        for (const i of ibans) {
            if (iban.value === i.iban) {
                // eslint-disable-next-line functional/immutable-data
                iban.valid = "valid";
                // eslint-disable-next-line functional/immutable-data
                iban.note = "IBAN già presente";
                found = true;
                break;
            }
        }

        if (!found) {
            // check ABI
            if (iban.value.substr(5, 5) === "07601") {
                // postal iban
                this.checkBarcode128aim(creditorInstitutionCode, iban);
            }
            else {
                // eslint-disable-next-line functional/immutable-data
                iban.valid = "valid";
                // eslint-disable-next-line functional/immutable-data
                iban.note = "IBAN nuovo";
            }
        }
        return iban;
    }

    /**
     * Check if each Iban is valid and acceptable according to encodings
     * @param creditorInstitutionCode
     */
    checkIbans(creditorInstitutionCode: string): void {
        apiClient.getCreditorInstitutionsIbans({
            Authorization: `Bearer  ${window.sessionStorage.getItem("secret")}`, 
            ApiKey: "",
            creditorinstitutioncode: creditorInstitutionCode
        }).then((response: any) => {
            if (response.right.status === 200) {
                const checkedIbans: Array<XMLData> = [];
                this.state.ibans.forEach((iban: XMLData) => {
                    // validate iban
                    if(IBAN.isValid(iban.value)) {
                        // eslint-disable-next-line no-param-reassign
                        iban = this.evaluateIban(creditorInstitutionCode, response.right.value.ibans, iban);
                    }
                    else {
                        // eslint-disable-next-line functional/immutable-data
                        iban.valid = "not valid";
                        // eslint-disable-next-line functional/immutable-data
                        iban.note = "IBAN non corretto";
                    }

                    const ibanToPush = {
                        inProgress: false,
                        value: iban.value,
                        valid: iban.valid,
                        note: iban.note,
                        action: iban.action
                    } as XMLData;
                    // eslint-disable-next-line functional/immutable-data
                    checkedIbans.push(ibanToPush);
                });
                this.setState({ibans: checkedIbans});
            }
            else {
                const error = {
                    isVisible: true,
                    message: "Problemi a recuperare gli IBAN dell'Ente Creditore"
                };
                this.setState({error});
            }
        }).catch(() => {
            const error = {
                isVisible: true,
                message: "Problemi a recuperare gli IBAN dell'Ente Creditore"
            };
            this.setState({error});
        });
    }

    /**
     * Check if validity date is correct (> now)
     */
    checkValidityDate(): void {
        const validityDate = this.state.validityDate;
        const now = (new Date()).getTime();
        // eslint-disable-next-line functional/no-let
        let valid = "valid";
        // eslint-disable-next-line functional/no-let
        let action = "";
        if (new Date(validityDate.value).getTime() <= now) {
            action = "La data di inizio validità deve essere superiore alla data corrente";
            valid = "not valid";
        }

        const validity = {
            inProgress: false,
            value: this.state.validityDate.value,
            valid,
            action
        } as XMLData;
        this.setState({validityDate: validity});
    }

    /**
     * Generate default XML data item
     * @param value
     */
    getDefaultXMLData(value: string): XMLData {
        return {
            inProgress: true,
            value,
            valid: "undefined",
            action: ""
        } as XMLData;
    }

    /**
     * Verify data in XML
     * @param code: creditor institution
     */
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
            }
        });
        const validityDate: XMLData = this.getDefaultXMLData(code.getElementsByTagName("dataInizioValidita")[0].textContent);
        this.setState({validityDate});
        this.checkValidityDate();
    }

    /**
     * Handle file uploaded
     * @param event
     */
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
                    message: "XML sintatticamente non valido"
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
                            {!data.inProgress && data.valid === "valid" && <FaCheck className="text-success" />}
                            {!data.inProgress && data.valid === "not valid" && <FaTimes className="text-danger" />}
                            {!data.inProgress && data.valid === "undefined" && <FaMinus  />}
                        </td>
                        <td>{data.action}</td>
                        <td className="text-center">{data.note}</td>
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
								<th className="text-center">Note</th>
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
