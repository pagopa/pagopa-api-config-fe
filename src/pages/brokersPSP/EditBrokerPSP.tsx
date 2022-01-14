import React from "react";
import {Alert, Breadcrumb, Button, Card, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {BrokerPspDetails} from "../../../generated/api/BrokerPspDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    backup: any;
    brokerPspName: string;
    code: string;
    brokerPSP: BrokerPspDetails;
    edit: boolean;
}

export default class EditBrokerPSP extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/brokers-psp";

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            backup: {
                brokersPsp: {} as BrokerPspDetails
            },
            brokerPspName: "",
            code: "",
            brokerPSP: {} as BrokerPspDetails,
            edit: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.saveBrokerPSP = this.saveBrokerPSP.bind(this);
        this.discard = this.discard.bind(this);
    }

    updateBackup(section: string, data: BrokerPspDetails | any) {
        // eslint-disable-next-line functional/no-let
        let backup = {...this.state.backup};
        backup = {...backup, [section]: data};
        this.setState({backup});
    }

    getBrokerPSP(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getBrokerPsp({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    brokerpspcode: code
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        this.setState({brokerPSP: response.right.value});
                        this.setState({brokerPspName: response.right.value.description});
                        this.updateBackup("brokerPSP", response.right.value);
                    } else {
                        this.setState({isError: true});
                    }
                })
                    .catch(() => {
                        this.setState({isError: true});
                    })
                    .finally(() => this.setState({isLoading: false}));
            });
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({code, isError: false});
        this.getBrokerPSP(code);
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let brokerPSP: BrokerPspDetails = this.state.brokerPSP;
        const key = event.target.name as string;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        brokerPSP = {...brokerPSP, [key]: value};
        this.setState({brokerPSP});
    }

    saveBrokerPSP() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updateBrokerPsp({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    brokerpspcode: this.state.code,
                    body: this.state.brokerPSP
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        toast.info("Modifica avvenuta con successo.");
                        this.setState({brokerPSP: response.right.value});
                        this.setState({brokerPspName: response.right.value.description});
                        this.updateBackup("brokerPSP", response.right.value);
                    } else {
                        // eslint-disable-next-line no-prototype-builtins
                        const message = (response.right.hasOwnProperty("title")) ? response.right.value.title : "Operazione non avvenuta a causa di un errore";
                        toast.error(message, {theme: "colored"});
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });
            });
    }

    discard(section: string) {
        // "as any" is necessary because it seems to be a bug: https://github.com/Microsoft/TypeScript/issues/13948
        this.setState({[section]: Object.assign({}, this.state.backup[section])} as any);
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href={this.service}>Intermediari PSP</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.brokerPspName}</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                    <div className="col-md-12">
                        {isError && (
                            <Alert className={'col-md-12'} variant={'danger'}>
                                Informazioni non disponibili!
                            </Alert>
                        )}
                        {isLoading && (<div className="text-center"><FaSpinner className="spinner" size={28}/></div>)}
                        {
                            !isLoading && (
                                <>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <h2>{this.state.brokerPspName}</h2>
                                        </div>
                                    </div>

                                    <Card>
                                        <Card.Header>
                                            <h5>Anagrafica</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="row">
                                                <Form.Group controlId="code" className="col-md-4">
                                                    <Form.Label>Descrizione</Form.Label>
                                                    <Form.Control name="description" placeholder=""
                                                                  value={this.state.brokerPSP.description}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="code" className="col-md-3">
                                                    <Form.Label>Codice</Form.Label>
                                                    <Form.Control name="broker_psp_code" placeholder=""
                                                                  value={this.state.brokerPSP.broker_psp_code}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="enabled" className="col-md-2">
                                                    <Form.Label>Stato</Form.Label>
                                                    <Form.Control as="select" name="enabled" placeholder="stato"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  defaultValue={String(this.state.brokerPSP.enabled)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>
                                                <Form.Group controlId="extended_fault_bean" className="col-md-2">
                                                    <Form.Label>Fault Bean esteso</Form.Label>
                                                    <Form.Control as="select" name="extended_fault_bean" placeholder="stato"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  defaultValue={String(this.state.brokerPSP.extended_fault_bean)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>
                                            </div>
                                        </Card.Body>
                                        <Card.Footer>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <Button className="ml-2 float-md-right" variant="secondary"
                                                            onClick={() => {
                                                                this.discard("brokerPSP");
                                                            }}>Annulla</Button>
                                                    <Button className="float-md-right" onClick={() => {
                                                        this.saveBrokerPSP();
                                                    }}>Salva</Button>
                                                </div>
                                            </div>
                                        </Card.Footer>
                                    </Card>
                                </>
                            )
                        }
                    </div>
                </div>
            </div>
        );
    }
}
