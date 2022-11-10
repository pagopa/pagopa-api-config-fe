import React from 'react';
import {Button, Card, Form, OverlayTrigger, Table, Tooltip} from 'react-bootstrap';
import {Props} from "io-ts";
import {FaCheck, FaExclamationTriangle, FaEye, FaMinus, FaPlus, FaSpinner, FaTimes} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import axios from "axios";
import {toast} from "react-toastify";
import {loginRequest} from "../../authConfig";
import {getConfig} from "../../util/config";
import {apiClient} from "../../util/apiClient";

interface XMLData {
    inProgress: boolean;
    value: string;
    valid: string;
    note: string;
    action: string;
    title: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {
}

interface IState {
    xml: string;
    error: any;
    data: Array<XMLData>;
    xsd: XMLData;
    archive: any;
}

export default class MassiveIcas extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: Props) {
        super(props);

        this.state = {
            xml: "",
            error: {
                isVisible: false,
                message: ""
            },
            data: [] as Array<XMLData>,
            xsd: this.initXMLData(),
            archive: []
        };
        this.handleFile = this.handleFile.bind(this);
        this.setEncoding = this.setEncoding.bind(this);
        this.closeDetails = this.closeDetails.bind(this);
    }

    initState(): void {
        this.setState({
            xml: "",
            error: {
                isVisible: false,
                message: ""
            },
            data: [] as Array<XMLData>,
            xsd: this.initXMLData(),
            archive: []
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
            valid: "UNDEFINED",
            action: "",
            title: ""
        } as unknown as XMLData;
    }

    setEncoding(data: XMLData, codeType: string, encodingCode: string) {
        const ci = this.state.data.filter(item => item.title.toLowerCase() === "creditor institution");
        if (ci.length === 0) {
            this.toastError("Codice fiscale ente creditore non trovato");
            return;
        }
        const ciCode = ci[0].value;
        const encoding = {
            code_type: codeType,
            encoding_code: encodingCode
        } as any;

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
                            this.resetData(data, codeType);
                        } else {
                            const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                            this.toastError(message);
                        }
                    }).catch(() => {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    });
                })
                .finally(() => {
                            toast.dismiss(creating);
                        }
                );
    }

    resetData(data: XMLData, codeType: string) {
        const dataset = this.state.data;
        dataset.forEach((d:XMLData) => {
            if (d.value === data.value) {
                // eslint-disable-next-line functional/immutable-data
                d.valid = "VALID";
                // eslint-disable-next-line functional/immutable-data
                d.action = "";
                if (d.title === "QR Code" && codeType === "QR_CODE") {
                    // eslint-disable-next-line functional/immutable-data
                    d.note = "QR-Code added";
                } else if (d.title === "Iban" && codeType === "BARCODE_128_AIM") {
                    // eslint-disable-next-line functional/immutable-data
                    d.note = d.note.split(".")[0] + " Encoding already present";
                }
            }
        });
        this.setState({data: dataset});
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    /**
     * Handle file uploaded
     * @param event
     */
    handleFile(event: any) {
        this.initState();

        // const reader = new FileReader();
        const file = event.target.files[0];
        // eslint-disable-next-line functional/immutable-data
        event.target.value = null;
        if (file) {
            this.uploadFile(file);
        }
    }

    uploadFile(file: any) {
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
            axios.post(baseUrl + basePath + "/icas/check/massive", data, config).then((response:any) => {
                this.setState({archive: response.data});
            });
        });
    }

    handleDetails(item: any) {
        const xsdItem = item.checkItems.filter((i: any) => i.value.indexOf(".xsd") !== -1);
        if (xsdItem.length > 0) {
            const xsd = {
                inProgress: false,
                action: "",
                value: xsdItem[0].value,
                valid: xsdItem[0].valid,
                note: xsdItem[0].note
            } as XMLData;
            this.setState({xsd});

            const data = item.checkItems.filter((i: any) => i !== xsdItem[0]);
            this.setState({xml: item.fileName, data});
        }
        else {
            this.setState({xml: item.fileName, data: item.checkItems});
        }
    }

    create() {
        const element = document.getElementById("fileUploader");
        if (element) {
            element.click();
        }
    }

    closeDetails() {
        this.setState({xml: "", data: []});
    }

    render(): React.ReactNode {
        const getTableRow = (data: any, key: number) => (
                <tr key={key}>
                    <td className="font-weight-bold">{data.fileName}</td>
                    <td className="text-center">
                        { data.checkItems.filter((c: any) => c.valid !== "VALID").length > 0 ? <FaTimes className="text-danger" /> : <FaCheck className="text-success" />}
                    </td>
                    <td className="text-right">
                        <OverlayTrigger placement="top"
                                        overlay={<Tooltip id={`tooltip-details-${key}`}>Analizza</Tooltip>}>
                            <FaEye role="button" className="mr-3"
                                   onClick={() => this.handleDetails(data)}/>
                        </OverlayTrigger>
                    </td>
                </tr>
        );

        const getRow = (data: XMLData, key: number) => (
                    <tr key={key}>
                        <td className="font-weight-bold">{data.title}</td>
                        <td>{data?.value}</td>
                        <td className="text-center">
                            {data.inProgress && <FaSpinner className="spinner" />}
                            {!data.inProgress && data.valid === "VALID" && <FaCheck className="text-success" />}
                            {!data.inProgress && data.valid === "NOT_VALID" && <FaTimes className="text-danger" />}
                            {!data.inProgress && data.valid === "UNDEFINED" && <FaMinus  />}
                        </td>
                        <td>{data?.note}</td>
                        <td className="">
                            {data?.action && data?.action === "ADD_ENCODING" &&

							<button className="btn btn-sm btn-primary ml-3" onClick={() => this.setEncoding(data, "BARCODE_128_AIM", data.value.substring(15))}>
								Aggiungi <FaPlus />
							</button>
                            }

                            {data?.action && data?.action === "ADD_QRCODE" &&

							<button className="btn btn-sm btn-primary ml-3" onClick={() => this.setEncoding(data, "QR_CODE", data.value)}>
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

        return (
            <div className="container-fluid icas">
                <div className="row">
                    <div className="col-md-12">
                        <h2>Operazioni Massive ICA</h2>
                    </div>
                </div>

                <div className="row">
                    <div className={"col-md-12"}>
                        <p>In questa sezione è possibile effettuare la verifica massiva di più file XML contenenti le Informative Conto Accredito.</p>
                        <p>Il file <span className="font-italic">deve</span> essere uno zip la cui dimensione non deve superare i 5mb.</p>
                    </div>
                    <div className={"col-md-3"}>
                        <span className="font-weight-bold">Verifica massiva</span>
                    </div>
                    <div className={"col-md-4"}>
                        <Button onClick={this.create}>Carica <FaPlus/></Button>
                        {/* eslint-disable-next-line functional/immutable-data */}
                        <Form.Control id="fileUploader" className="hidden" type="file" accept=".zip" onChange={this.handleFile} onClick={(e: any) => (e.target.value = null)} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        {
                            this.state.archive.length > 0 &&
							<Table hover responsive size="sm" className="xml-table mt-5">
								<thead>
								<tr>
									<th className="">File ICA</th>
									<th className="text-center">Valido</th>
									<th className="text-right"></th>
								</tr>
								</thead>
								<tbody>
                                {
                                    this.state.archive.map((item: any, index: number) => getTableRow(item, index))
                                }
								</tbody>
							</Table>
                        }

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
							<Card className="mt-5">
								<Card.Header>
                                    <div className="row">
                                        <div className="col-md-11"><h5>{this.state.xml}</h5></div>
                                        <div className="col-md-1 text-right">

											<OverlayTrigger placement="top"
															overlay={<Tooltip id={"close-details"}>Chiudi dettaglio</Tooltip>}>
												<FaTimes role="button" onClick={this.closeDetails} />
											</OverlayTrigger>
                                        </div>
                                    </div>
								</Card.Header>
								<Card.Body>
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
                                                {!this.state.xsd.inProgress && this.state.xsd.valid === "VALID" && <FaCheck className="text-success" />}
                                                {!this.state.xsd.inProgress && this.state.xsd.valid === "NOT_VALID" && <FaTimes className="text-danger" />}
                                                {!this.state.xsd.inProgress && this.state.xsd.valid === "UNDEFINED" && <FaMinus  />}
											</td>
											<td>
                                                {this.state.xsd.valid === "NOT_VALID" && <span>{this.state.xsd.note}</span>}
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
											<th className="">Note</th>
											<th className="">Intervento da effettuare</th>
										</tr>
										</thead>
										<tbody>
                                        {
                                            this.state.data.map((item, index) => getRow(item, index))
                                        }

										</tbody>
									</Table>
                                </Card.Body>
                                <Card.Footer>
									<p className={"small font-italic"}>
										*Tutti gli IBAN sono stati validati nel rispetto della ISO 13616.
									</p>
                                </Card.Footer>
                            </Card>
                        </div>
                    }
                </div>
            </div>

        );
    }
}
