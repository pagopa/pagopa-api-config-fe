import React from 'react';
import {Breadcrumb, Button, Card, Form} from 'react-bootstrap';
import {Props} from "io-ts";
import {MsalContext} from "@azure/msal-react";
import {FaPlus} from "react-icons/fa";
import axios from "axios";
import {toast} from "react-toastify";
import {getConfig} from "../../util/config";
import {loginRequest} from "../../authConfig";

interface XMLData {
    inProgress: boolean;
    value: string;
    valid: string;
    note: string;
    action: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {
}

interface IState {
    xml: string;
    error: any;
    xsd: XMLData;
}

export default class MassiveMigration extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: Props) {
        super(props);

        this.state = {
            xml: "",
            error: {
                isVisible: false,
                message: ""
            },
            xsd: this.initXMLData()
        };

        this.create = this.create.bind(this);
        this.upload = this.upload.bind(this);
    }

    initState(): void {
        this.setState({
            xml: "",
            error: {
                isVisible: false,
                message: ""
            },
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
            action: ""
        } as unknown as XMLData;
    }

    create() {
        const element = document.getElementById("fileUploader");
        if (element) {
            element.click();
        }
    }

    upload(event: any) {
        const file = event.target.files[0];
        const data = new FormData();
        data.append("file", file);
        // eslint-disable-next-line functional/immutable-data
        event.target.value = null;

        const baseUrl = getConfig("APICONFIG_HOST") as string;
        const basePath = getConfig("APICONFIG_BASEPATH") as string;

        const error = {
            isVisible: false,
            message: ""
        };
        this.setState({error});

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
            axios.post(baseUrl + basePath + "/batchoperation/creditorinstitution-station/migration", data, config).then(() => {
                toast.info("Relazioni gestite con successo");
            }).catch((err) => {
                toast.error("Errore nell'elaborazione del file.", {theme: "colored"});
                const error = {
                    isVisible: true,
                    message: err.response.data.detail
                };
                this.setState({error});

            });
        }).catch(() => {
            this.context.instance.logoutPopup({
                postLogoutRedirectUri: "/",
                mainWindowRedirectUri: "/"
            }).then(() => window.sessionStorage.removeItem("secret"));
        });
    }

    render(): React.ReactNode {

        return (
                <div className="container-fluid massive-loading">
                    <div className="row">
                        <div className="col-md-12 mb-5">
                            <Breadcrumb>
                                <Breadcrumb.Item active>Migrazione Massiva</Breadcrumb.Item>
                            </Breadcrumb>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-12">
                            <h2>Migrazione Massiva</h2>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-12">
                            <Card>
                                <Card.Header>
                                    <h5>Relazioni Enti Creditori - Stazioni</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <p>Attraverso la seguente azione è possibile caricare un CSV contenente le relazioni tra EC e stazioni da migrare.</p>
                                            <p>Il CSV deve avere la seguente struttura:</p>
                                            <code>
                                                cf,idstazione_provenienza,idstazione_destinazione,broadcast<br/>
                                                ecCode,oldStationCode,newStationCode,S|N|non-specificato
                                            </code>
                                            <p className="mt-2">e deve rispettare le seguenti regole:</p>
                                            <ul className="mt-0">
                                                <li><span className="font-weight-bold">EC</span>: deve essere censito</li>
                                                <li><span className="font-weight-bold">Vecchia Stazione</span>: deve essere censita</li>
                                                <li><span className="font-weight-bold">Nuova Stazione</span>: deve essere censita</li>
                                                <li><span className="font-weight-bold">Broadcast</span>: può assumere i valori <span className="badge badge-info">S</span>  o <span className="badge badge-info">N</span>  oppure può essere lasciato vuoto <span className="badge badge-info"> </span> per non modificarne il valore</li>
                                            </ul>
                                            <p>Per ulteriori approfondimenti in merito si rimanda al seguente <a href="https://pagopa.atlassian.net/wiki/spaces/PAG/pages/502464601/Migrazione+di+associazioni+Enti-Stazioni">link</a>.</p>
                                        </div>
                                        <div className="col-md-12 mt-2">
                                            <Button onClick={this.create}>Carica <FaPlus/></Button>
                                            {/* eslint-disable-next-line functional/immutable-data */}
                                            <Form.Control id="fileUploader" className="hidden" type="file" accept=".csv" onChange={this.upload} onClick={(e: any) => (e.target.value = null)} />
                                        </div>
                                        {
                                            this.state.error.isVisible &&
                                            <div className="col-md-12 mt-2">
                                                <pre>{this.state.error.message}</pre>
                                            </div>
                                        }
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </div>

                </div>

        );
    }
}
