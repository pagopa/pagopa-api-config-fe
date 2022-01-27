import React from "react";
import {Alert, Breadcrumb, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
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
    code: string;
    brokerPSP: BrokerPspDetails;
    edit: boolean;
}

export default class BrokerPSP extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
            brokerPSP: {} as BrokerPspDetails,
            edit: false
        };
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
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({brokerPSP: response.right.value});
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
        this.setState({isError: false});
        this.getBrokerPSP(code);
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        return (
            <div className="container-fluid payment-service-providers">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/brokers-psp">Intermediari PSP</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.brokerPSP.description || "-"}</Breadcrumb.Item>
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
                                            <h2>{this.state.brokerPSP.description || "-"}</h2>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <Form.Group controlId="code" className="col-md-4">
                                            <Form.Label>Codice</Form.Label>
                                            <Form.Control type="code" placeholder="-"
                                                          value={this.state.brokerPSP.broker_psp_code}
                                                          readOnly/>
                                        </Form.Group>
                                        <Form.Group controlId="enabled" className="col-md-2">
                                            <Form.Label>Stato</Form.Label>
                                            <Form.Control as="select" type="enabled" placeholder="stato" readOnly>
                                                {this.state.brokerPSP.enabled && <option>Abilitato</option>}
                                                {!this.state.brokerPSP.enabled && <option>Non Abilitato</option>}
                                            </Form.Control>
                                        </Form.Group>
                                        <Form.Group controlId="extended_fault_bean" className="col-md-2">
                                            <Form.Label>Faul Bean esteso</Form.Label>
                                            <Form.Control as="select" type="extended_fault_bean" placeholder="stato" readOnly>
                                                {this.state.brokerPSP.extended_fault_bean && <option>Abilitato</option>}
                                                {!this.state.brokerPSP.extended_fault_bean && <option>Non Abilitato</option>}
                                            </Form.Control>
                                        </Form.Group>
                                    </div>
                                </>
                            )
                        }
                    </div>
                </div>
            </div>
        );
    }
}
