import React from 'react';
import {Breadcrumb, Form, Table} from 'react-bootstrap';
import {Props} from "io-ts";
import {FaCheck, FaExclamationTriangle, FaMinus, FaPlus, FaSpinner, FaTimes} from "react-icons/fa";
import {isValidIBAN} from "ibantools";
import {MsalContext} from "@azure/msal-react";
import axios from "axios";
import {toast} from "react-toastify";
import {apiClient} from "../../util/apiClient";
import {Iban} from "../../../generated/api/Iban";
import {Encoding} from "../../../generated/api/Encoding";
import {loginRequest} from "../../authConfig";
import {getConfig} from "../../util/config";

interface XMLData {
    inProgress: boolean;
    value: string;
    valid: string;
    note: string;
    action: string;
    operation: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {
}

interface IState {
    xml: string;
    creditorInstitutionName: XMLData;
    creditorInstitutionCode: XMLData;
    encodings: Array<Encoding>;
    error: any;
    ibans: Array<XMLData>;
    xsd: XMLData;
    validityDate: XMLData;
}

export default class CheckIca extends React.Component<IProps, IState> {
    static contextType = MsalContext;

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
            validityDate: this.initXMLData(),
            xsd: this.initXMLData()
        };
        this.handleFile = this.handleFile.bind(this);
        this.setEncoding = this.setEncoding.bind(this);
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
            validityDate: this.initXMLData(),
            xsd: this.initXMLData()
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
            action: "",
            operation: {}
        } as unknown as XMLData;
    }

    /**
     * Check if creditor institution code and business name are correct
     * @param creditorInstitutionCode
     * @param code: creditor institution code
     */
    checkCreditorInstitution(creditorInstitutionCode: string, code: string): void {
        const codeData = this.state.creditorInstitutionCode;
        const nameData = this.state.creditorInstitutionName;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getCreditorInstitution({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: creditorInstitutionCode
                }).then((response: any) => {
                    this.analyzeCreditorInstitutionResponse(codeData, nameData, response);

                    if (response.right.status === 200) {
                        this.analyzeIbanList(code);
                    }

                }).catch(() => {
                    const creditorInstitutionCode = {
                        inProgress: false,
                        value: codeData.value,
                        valid: "undefined",
                        note: "Problema di comunicazione con il servizio",
                        action: "",
                        operation: {}
                    } as XMLData;

                    const creditorInstitutionName = {
                        inProgress: false,
                        value: nameData.value,
                        valid: "undefined",
                        note: "Problema di comunicazione con il servizio",
                        action: "",
                        operation: {}
                    } as XMLData;

                    this.setState({creditorInstitutionCode});
                    this.setState({creditorInstitutionName});

                    const error = {
                        isVisible: true,
                        message: "Problemi di recupero dati dell'Ente Creditore"
                    };
                    this.setState({error});
                });
            });

    }

    analyzeCreditorInstitutionResponse(codeData: any, nameData: any, response: any) {
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
                action: "",
                operation: {}
            } as XMLData;

            creditorInstitutionName = {
                inProgress: false,
                note: "",
                value: nameData.value,
                valid: nameData.value === response.right.value.business_name ? "valid" : "not valid",
                action: "",
                operation: {}
            } as XMLData;

            this.checkQRCode(codeData.value);
        } else {
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
                action: "Verificare il codice dell'Ente Creditore",
                operation: {}
            } as XMLData;

            creditorInstitutionName = {
                inProgress: false,
                value: nameData.value,
                valid: "not valid",
                note: "Impossibile validare il nome dell'Ente senza il relativo codice corretto",
                action: "Verificare il codice dell'Ente Creditore",
                operation: {}
            } as XMLData;
        }
        this.setState({creditorInstitutionCode});
        this.setState({creditorInstitutionName});
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
        // eslint-disable-next-line functional/immutable-data
        codeData.operation = {
            enabled: true,
            encoding: {
                ci: code,
                data: {
                    code_type: "QR_CODE",
                    encoding_code: code
                }
            }
        };
        for (const encoding of encodings) {
            if (encoding.code_type.toLowerCase() === "qr_code") {
                if (encoding.encoding_code === code) {
                    // eslint-disable-next-line functional/immutable-data
                    codeData.note = "QRCode presente";
                    // eslint-disable-next-line functional/immutable-data
                    codeData.operation = {};
                }
                break;
            }
        }
        this.setState({creditorInstitutionCode: codeData});
    }

    /**
     * Check if the creditor institution has the QRCode encoding
     * @param creditorInstitutionCode
     */
    checkQRCode(creditorInstitutionCode: string): void {
        if (this.state.encodings.length === 0) {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    apiClient.getCreditorInstitutionEncodings({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        creditorinstitutioncode: creditorInstitutionCode
                    }).then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({encodings: response.right.value.encodings});
                            this.evaluateQRCode(creditorInstitutionCode, response.right.value.encodings);
                        }
                    });
                });
        } else {
            this.evaluateQRCode(creditorInstitutionCode, this.state.encodings);
        }
    }

    /**
     * Evaluate if Iban is related to one of the BARCODE_128_AIM encodings
     * BARCODE_128_AIM encoding is 12 digits
     * @param ciCode: creditor institution code
     * @param iban: Iban to evaluate
     * @param encodings: Encoding list of Creditor Institution
     */
    evaluateBarcode128aim(ciCode: string, iban: XMLData, encodings: Array<Encoding>) {
        const postalCode = iban.value.substring(15);
        // eslint-disable-next-line functional/no-let
        let found = false;
        for (const encoding of encodings) {
            if (encoding.code_type.toLowerCase() === "barcode_128_aim") {
                if (encoding.encoding_code === postalCode) {
                    found = true;
                    // eslint-disable-next-line functional/immutable-data
                    iban.valid = "valid";
                    // eslint-disable-next-line functional/immutable-data
                    iban.note = "IBAN nuovo. Codice postale presente.";
                }
                break;
            }
        }
        if (!found) {
            // eslint-disable-next-line functional/immutable-data
            iban.valid = "not valid";
            // eslint-disable-next-line functional/immutable-data
            iban.note = "Codice postale non presente";
            // eslint-disable-next-line functional/immutable-data
            iban.action = "Inserire codifica postale";
            // eslint-disable-next-line functional/immutable-data
            iban.operation = {
                enabled: true,
                encoding: {
                    ci: ciCode,
                    data: {
                        code_type: "BARCODE_128_AIM",
                        encoding_code: postalCode
                    }
                }
            };
        }

        const ibanList = this.state.ibans;
        ibanList.forEach((i) => {
            if (i.value === iban.value) {
                // eslint-disable-next-line functional/immutable-data
                i.valid = iban.valid;
                // eslint-disable-next-line functional/immutable-data
                i.note = iban.note;
                // eslint-disable-next-line functional/immutable-data
                i.action = iban.action;
                // eslint-disable-next-line functional/immutable-data
                i.operation = iban.operation;
            }
        });
        this.setState({ibans: ibanList});
    }

    /**
     * Check encoding BARCODE_128_AIM
     * @param ciCode
     * @param iban
     */
    checkBarcode128aim(ciCode: string, iban: XMLData): void {
        if (this.state.encodings.length === 0) {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    apiClient.getCreditorInstitutionEncodings({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        creditorinstitutioncode: ciCode
                    }).then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({encodings: response.right.value.encodings});

                            this.evaluateBarcode128aim(ciCode, iban, response.right.value.encodings);
                        }
                    });
                });
        } else {
            this.evaluateBarcode128aim(ciCode, iban, this.state.encodings);
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
            if (iban.value.substring(5, 10) === "07601") {
                // postal iban
                this.checkBarcode128aim(creditorInstitutionCode, iban);
            } else {
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
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getCreditorInstitutionsIbans({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: creditorInstitutionCode
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        const checkedIbans: Array<XMLData> = [];
                        this.state.ibans.forEach((iban: XMLData) => {
                            // validate iban
                            if (isValidIBAN(iban.value)) {
                                // eslint-disable-next-line no-param-reassign
                                iban = this.evaluateIban(creditorInstitutionCode, response.right.value.ibans, iban);
                            } else {
                                // eslint-disable-next-line functional/immutable-data
                                iban.valid = "not valid";
                                // eslint-disable-next-line functional/immutable-data
                                iban.note = "IBAN non valido: non rispetta ISO 13616";
                            }

                            const ibanToPush = {
                                inProgress: false,
                                value: iban.value,
                                valid: iban.valid,
                                note: iban.note,
                                action: iban.action,
                                operation: {}
                            } as XMLData;
                            // eslint-disable-next-line functional/immutable-data
                            checkedIbans.push(ibanToPush);
                        });
                        this.setState({ibans: checkedIbans});
                    } else {
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
            action: "",
            operation: {}
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

        this.checkCreditorInstitution(ciCode, code);

        const validityDate: XMLData = this.getDefaultXMLData(code.getElementsByTagName("dataInizioValidita")[0].textContent);
        this.setState({validityDate});
        this.checkValidityDate();
    }

    analyzeIbanList(code: any): void {
        for (const iban of code.getElementsByTagName("ibanAccredito")) {
            const ibanData: XMLData = this.getDefaultXMLData(iban.textContent);
            const storedIbans = this.state.ibans;
            // eslint-disable-next-line functional/immutable-data
            storedIbans.push(ibanData);
            this.setState({ibans: storedIbans});
        }
        const ciCode = code.getElementsByTagName("identificativoDominio")[0].textContent;
        this.checkIbans(ciCode);
    }

    resetCreateEncoding(encoding: any) {
        if (encoding.code_type.toLowerCase() === "qr_code") {
            const creditorInstitutionCode = this.state.creditorInstitutionCode;
            // eslint-disable-next-line functional/immutable-data
            creditorInstitutionCode.note = "";
            // eslint-disable-next-line functional/immutable-data
            creditorInstitutionCode.operation = {};
            this.setState({creditorInstitutionCode});
        }
        else {
            const ibans = this.state.ibans;
            for (const iban of ibans) {
                if (iban.value.search(encoding.encoding_code) !== -1) {
                    // eslint-disable-next-line functional/immutable-data
                    iban.action = "";
                    // eslint-disable-next-line functional/immutable-data
                    iban.note = "IBAN nuovo. Codice postale presente.";
                    // eslint-disable-next-line functional/immutable-data
                    iban.operation = {};
                    break;
                }
            }
            this.setState({ibans});
        }
    }

    setEncoding(ciCode: string, encoding: any) {
        const creating = toast.info("Creazione codifica in corso.");
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createCreditorInstitutionEncoding({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: ciCode,
                    body: encoding
                }).then((response: any) => {
                    if (response.right.status === 201) {
                        toast.info("Salvataggio avvenuto con successo.");
                    } else {
                        const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                        toast.error(message, {theme: "colored"});
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                })
                .finally(() => {
                    this.resetCreateEncoding(encoding);
                });
            })
            .finally(() => {
                    toast.dismiss(creating);
                }
            );
    }

    /**
     * Handle file uploaded
     * @param event
     */
    handleFile(event: any) {
        this.initState();

        const reader = new FileReader();
        const file = event.target.files[0];
        if (file) {
            this.uploadXML(file);
            reader.readAsText(file);
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
                } else {
                    this.setState({xml});
                    this.checkXML(code);
                }
            };
        }
    }

    uploadXML(file: any) {
        const data = new FormData();
        data.append("file", file);

        const baseUrl = getConfig("APICONFIG_HOST") as string;
        const basePath = getConfig("APICONFIG_BASEPATH") as string;


        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        }).then((response: any) => {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${response.idToken}`
                }
            };
            axios.post(baseUrl + basePath + "/icas/xsd", data, config).then((response:any) => {
                const xsd = {
                    inProgress: false,
                    note: "",
                    value: response.data.xsdSchema,
                    valid: response.data.xsdCompliant ? "valid" : "not valid",
                    action: response.data.detail
                } as XMLData;
                this.setState({xsd});
            }).catch(() => {
                const xsd = {
                    inProgress: false,
                    note: "",
                    value: "-",
                    valid: "undefined",
                    action: "Problema con il servizio di conformità schema XSD"
                } as XMLData;
                this.setState({xsd});
            });
        });
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
                        <td className="text-center">
                            {data.note}
                            {
                                data.operation?.enabled &&
                                <button className="btn btn-sm btn-primary ml-3" onClick={() => this.setEncoding(data.operation.encoding.ci, data.operation.encoding.data)}>
									Aggiungi <FaPlus />
                                </button>
                            }
                        </td>
                    </tr>
            );

        const getSchemaName = () => (
            // eslint-disable-next-line functional/immutable-data
            this.state.xsd.value === "-" ? "" : new URL(this.state.xsd.value).pathname.split("/").pop()
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
                            {/* eslint-disable-next-line functional/immutable-data */}
                            <Form.Control type="file" accept=".xml" onChange={(e) => this.handleFile(e)} onClick={(e: any) => (e.target.value = null)} />
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
                            <FaExclamationTriangle/> <span>{this.state.error.message}</span>
                        </div>
                    }
                    {
                        this.state.xml.length > 0 &&
					    <div className="col-md-12">
							<Table hover responsive size="sm" className="xsd-table">
								<thead>
								<tr>
									<th className="">XSD Schema</th>
									<th className="text-center">Conforme</th>
									<th className="">Intervento da effettuare</th>
								</tr>
								</thead>
								<tbody>
                                <tr>
                                    <td>
                                        {this.state.xsd.value.length > 0 && <a href={this.state.xsd.value} target="schema_frame">{getSchemaName()}</a>}
                                    </td>
                                    <td className="text-center">
                                        {this.state.xsd.inProgress && <FaSpinner className="spinner" />}
                                        {!this.state.xsd.inProgress && this.state.xsd.valid === "valid" && <FaCheck className="text-success" />}
                                        {!this.state.xsd.inProgress && this.state.xsd.valid === "not valid" && <FaTimes className="text-danger" />}
                                        {!this.state.xsd.inProgress && this.state.xsd.valid === "undefined" && <FaMinus  />}
                                    </td>
                                    <td>
                                        {this.state.xsd.valid === "not valid" && <span>{this.state.xsd.action}</span>}
                                    </td>
                                </tr>

								</tbody>
							</Table>

                            <Table hover responsive size="sm" className="xml-table">
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
                            <p className={"small font-italic"}>
                                *Tutti gli IBAN sono stati validati nel rispetto della ISO 13616.
                            </p>
                        </div>
                    }
                </div>
            </div>

        );
    }
}
