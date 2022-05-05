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

export default class MassiveLoading extends React.Component<IProps, IState> {
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
            axios.post(baseUrl + basePath + "/massiveloading/creditorinstitution-station", data, config).then(() => {
                toast.info("Relazioni gestite con successo");
            }).catch((err) => {
                const error = {
                    isVisible: true,
                    message: err.response.data.detail
                };
                this.setState({error});
                toast.error("Errore di validazione dei dati.", {theme: "colored"});
            });
        });
    }

    render(): React.ReactNode {

        return (
                <div className="container-fluid massive-loading">
                    <div className="row">
                        <div className="col-md-12 mb-5">
                            <Breadcrumb>
                                <Breadcrumb.Item active>Caricamenti Massivi</Breadcrumb.Item>
                            </Breadcrumb>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-12">
                            <h2>Caricamenti massivi</h2>
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
                                            <p>Attraverso la seguente azione è possibile caricare un CSV contenente le relazioni tra EC e stazioni da creare o cancellare.</p>
                                            <p>Il CSV deve avere la seguente struttura:</p>
                                            <code>
                                                cf,idstazione,ambiente,broadcast,auxdigit,codicesegregazione,applicationcode,datavalidita,operazione<br/>
                                                ecCode,stationCode,COLL|ESER,S|N,0|1|2|3,2cipher|blank,2cipher|blank,2022-03-21,A|C
                                            </code>
                                            <p className="mt-2">e deve rispettare le seguenti regole:</p>
                                            <ul className="mt-0">
                                                <li><span className="font-weight-bold">EC</span>: deve essere censito</li>
                                                <li><span className="font-weight-bold">Stazione</span>: deve essere censita</li>
                                                <li><span className="font-weight-bold">Ambiente</span>:
                                                    le righe aventi valori <span className="badge badge-info">ESER</span> sono considerate in <span className="font-italic">produzione</span>, <span className="badge badge-info">COLL</span> per gli altri ambienti (<span className="font-italic">dev</span>, <span className="font-italic">uat</span>).
                                                </li>
                                                <li><span className="font-weight-bold">Broadcast</span>: può assumere valore <span className="badge badge-info">S</span> o <span className="badge badge-info">N</span></li>
                                                <li><span className="font-weight-bold">AuxDigit</span>: può assumere valore <span className="badge badge-info">0</span>, <span className="badge badge-info">1</span>, <span className="badge badge-info">2</span>, <span className="badge badge-info">3</span>.</li>
                                                <li><span className="font-weight-bold">Codice segregazione</span>: numero di 2 cifre (ex. 01) se <span className="badge badge-info">AuxDigit=3</span>, vuoto altrimenti.</li>
                                                <li><span className="font-weight-bold">Application code</span>: numero di 2 cifre (ex. 01) se <span className="badge badge-info">AuxDigit=3</span>, vuoto altrimenti.</li>
                                                <li><span className="font-weight-bold">Data validità</span>: opzionale, nessun controllo.</li>
                                                <li><span className="font-weight-bold">Operazione</span>: può assumere valore <span className="badge badge-info">A</span> (aggiunta) o <span className="badge badge-info">C</span> (cancellazione).</li>
                                            </ul>
                                            <p>Per ulteriori approfondimenti in merito si rimanda al seguente <a href="https://pagopa.atlassian.net/wiki/spaces/PAG/pages/497124463/Creazione+e+cancellazione+di+associazioni+Enti-Stazioni">link</a>.</p>
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
