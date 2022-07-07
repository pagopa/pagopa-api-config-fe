import React from "react";
import {Alert, Breadcrumb, Button, Card, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import { BrokerDetails } from "../../../generated/api/BrokerDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    backup: any;
    code: string;
    brokerDetails: BrokerDetails;
    edit: boolean;
}

export default class EditBrokersPage extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            backup: {
                brokerDetails: {} as BrokerDetails,
            },
            code: "",
            brokerDetails: {} as BrokerDetails,
            edit: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.saveBroker = this.saveBroker.bind(this);
        this.discard = this.discard.bind(this);
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    updateBackup(section: string, data: BrokerDetails | any) {
        // eslint-disable-next-line functional/no-let
        let backup = {...this.state.backup};
        backup = {...backup, [section]: data};
        this.setState({backup});
    }

    getBrokerDetails(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getBroker({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    brokercode: code
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        this.setState({brokerDetails: response.right.value});
                        this.updateBackup("brokerDetails", response.right.value);
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
        this.getBrokerDetails(code);
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let brokerDetails: BrokerDetails = this.state.brokerDetails;
        const key = event.target.name as string;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        brokerDetails = {...brokerDetails, [key]: value};

        this.setState({brokerDetails});
    }

    saveBroker() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updateBroker({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    brokercode: this.state.code,
                    body: this.state.brokerDetails
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        toast.info("Modifica avvenuta con successo.");
                        this.setState({brokerDetails: response.right.value});
                        this.updateBackup("brokerDetails", response.right.value);
                    } else {
                        const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                        this.toastError(message);
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
            <div className="container-fluid broker">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/brokers">Intermediari EC</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.backup.brokerDetails.broker_code || "-"}</Breadcrumb.Item>
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
                                            <h2>{this.state.backup.brokerDetails.broker_code || "-"}</h2>
                                        </div>
                                    </div>
                                    <Card>
                                        <Card.Header>
                                            <h5>Anagrafica</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="row">
                                                <Form.Group controlId="code" className="col-md-3">
                                                    <Form.Label>Codice<span className="text-danger">*</span></Form.Label>
                                                    <Form.Control name="broker_code" placeholder=""
                                                                  value={this.state.brokerDetails.broker_code}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="description" className="col-md-3">
                                                    <Form.Label>Descrizione<span className="text-danger">*</span></Form.Label>
                                                    <Form.Control name="description" placeholder=""
                                                                  value={this.state.brokerDetails.description}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="enabled" className="col-md-3">
                                                    <Form.Label>Stato<span className="text-danger">*</span></Form.Label>
                                                    <Form.Control as="select" name="enabled" placeholder="stato"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  value={String(this.state.brokerDetails.enabled)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>
                                                <Form.Group controlId="extended_fault_bean" className="col-md-3">
                                                    <Form.Label>Fault Bean Esteso<span className="text-danger">*</span></Form.Label>
                                                    <Form.Control as="select" name="extended_fault_bean" placeholder="fault bean"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  value={this.state.brokerDetails.extended_fault_bean.toString()}>
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
                                                                this.discard("brokerDetails");
                                                            }}>Annulla</Button>
                                                    <Button className="float-md-right" onClick={() => {
                                                        this.saveBroker();
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
