import React from 'react';
import {Breadcrumb, Form, Table} from 'react-bootstrap';
import {Props} from "io-ts";
import {FaCheck, FaExclamationTriangle, FaMinus, FaSpinner, FaTimes} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import axios from "axios";
import {toast} from "react-toastify";
import {loginRequest} from "../../authConfig";
import {getConfig} from "../../util/config";

interface XMLData {
    inProgress: boolean;
    value: string;
    valid: string;
    note: string;
    action: string;
    operation: any;
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
}

export default class CheckCdi extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: Props) {
        super(props);

        this.state = {
            xml: "",
            error: {
                isVisible: false,
                message: ""
            },
            data: [],
            xsd: this.initXMLData()
        };
        this.handleFile = this.handleFile.bind(this);

    }

    initState(): void {
        this.setState({
            xml: "",
            error: {
                isVisible: false,
                message: ""
            },
            data: [],
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

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
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
            axios.post(baseUrl + basePath + "/cdis/check", data, config).then((response:any) => {
                const xsdItem = response.data.filter((i: any) => i.value.indexOf(".xsd") !== -1);
                if (xsdItem.length > 0) {

                    const xsd = {
                        inProgress: false,
                        note: "",
                        value: xsdItem[0].value,
                        valid: xsdItem[0].valid,
                        action: xsdItem[0].action
                    } as XMLData;
                    this.setState({xsd});

                    const data = response.data.filter((i: any) => i !== xsdItem[0]);
                    this.setState({data});
                }
                else {
                    this.setState({data: response.data});
                }
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
        const getRow = (data: XMLData, key: number) => (
                    <tr key={key}>
                        <td className="font-weight-bold">{data.title}</td>
                        <td>{data?.value}</td>
                        <td></td>
                        <td className="text-center">
                            {data.inProgress && <FaSpinner className="spinner" />}
                            {!data.inProgress && data.valid === "VALID" && <FaCheck className="text-success" />}
                            {!data.inProgress && data.valid === "NOT_VALID" && <FaTimes className="text-danger" />}
                            {!data.inProgress && data.valid === "UNDEFINED" && <FaMinus  />}
                        </td>
                        <td>{data?.action}</td>
                        <td></td>
                        <td className="text-center">
                            {data?.note}
                        </td>
                    </tr>
            );

        const getSchemaName = () => (
            // eslint-disable-next-line functional/immutable-data
            this.state.xsd.value === "-" ? "" : new URL(this.state.xsd.value).pathname.split("/").pop()
        );

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/cdis">Catalogo Dati Informativi</Breadcrumb.Item>
                            <Breadcrumb.Item active>Verifica</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <h2>Verifica Catalogo Dati Informativi</h2>
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
                                        {!this.state.xsd.inProgress && this.state.xsd.valid === "VALID" && <FaCheck className="text-success" />}
                                        {!this.state.xsd.inProgress && this.state.xsd.valid === "NOT_VALID" && <FaTimes className="text-danger" />}
                                        {!this.state.xsd.inProgress && this.state.xsd.valid === "UNDEFINED" && <FaMinus  />}
                                    </td>
                                    <td>
                                        {this.state.xsd.valid === "NOT_VALID" && <span>{this.state.xsd.action}</span>}
                                    </td>
                                </tr>

								</tbody>
							</Table>

                            <Table hover responsive size="sm" className="xml-table">
                                <thead>
                                <tr>
                                    <th className=""></th>
                                    <th className="">Contenuto CDI</th>
                                    <th className="text-center">Valido</th>
                                    <th className="">Intervento da effettuare</th>
                                    <th className="text-center">Note</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    this.state.data.map((item, index) => getRow(item, index))
                                }

                                </tbody>
                            </Table>

                        </div>
                    }
                </div>
            </div>

        );
    }
}
