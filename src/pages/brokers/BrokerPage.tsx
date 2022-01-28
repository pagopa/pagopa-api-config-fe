import React from 'react';
import {Validation} from "io-ts";
import {IResponseType} from "@pagopa/ts-commons/lib/requests";
import {ProblemJson} from "@pagopa/ts-commons/lib/responses";
import {toast} from "react-toastify";
import {Breadcrumb, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import {BrokerDetails} from '../../../generated/api/BrokerDetails';
import {loginRequest} from "../../authConfig";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
}

interface IState {
    broker?: BrokerDetails;
    isLoading: boolean;
}

export default class BrokerPage extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);
        this.state = {
            isLoading: true,
        };
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.callGetBroker(code);
    }

    callGetBroker(code: string) {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getBroker({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    brokercode: code
                })
                    .then((response: Validation<IResponseType<number, BrokerDetails | ProblemJson | undefined>>) => {
                        // eslint-disable-next-line no-underscore-dangle
                        switch (response._tag) {
                            case "Right":
                                if (response.right.status === 200) {
                                    const body = response.right.value as BrokerDetails;
                                    this.setState({
                                        broker: body
                                    });
                                } else {
                                    const body = response.right.value as ProblemJson;
                                    toast.error(body.title, {theme: "colored"});
                                }
                                break;
                            case "Left":
                                toast.error("Errore", {theme: "colored"});
                                break;
                        }
                    }).catch(() => {
                    toast.error("Problema nel recuperare i dettagli dell'intermediario", {theme: "colored"});
                }).finally(() => {
                    this.setState({isLoading: false});
                });
            });
    }

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        return (
            <div className="container-fluid brokers">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/brokers">Intermediari</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.broker?.description || "-"}</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>

                    <div className="col-md-12">
                        {isLoading && (<div className="text-center"><FaSpinner className="spinner" size={28}/></div>)}
                        {!isLoading && (
                            <>
                                <div className="row">
                                    <div className="col-md-12">
                                        <h2>{this.state.broker?.description || "-"}</h2>
                                    </div>
                                </div>
                                <div className="row">
                                    <Form.Group controlId="code" className="col-md-2">
                                        <Form.Label>Codice</Form.Label>
                                        <Form.Control type="code" placeholder="-" value={this.state.broker?.broker_code} readOnly/>
                                    </Form.Group>
                                    <Form.Group controlId="enabled" className="col-md-2">
                                        <Form.Label>Stato</Form.Label>
                                        <Form.Control as="select" type="enabled" placeholder="stato" readOnly>
                                            {this.state.broker?.enabled && <option>Abilitato</option>}
                                            {!this.state.broker?.enabled && <option>Non Abilitato</option>}
                                        </Form.Control>
                                    </Form.Group>
                                    <Form.Group controlId="extended_fault_bean" className="col-md-2">
                                        <Form.Label>Fault Bean esteso</Form.Label>
                                        <Form.Control as="select" type="extended_fault_bean" placeholder="stato" readOnly>
                                            {this.state.broker?.extended_fault_bean && <option>Abilitato</option>}
                                            {!this.state.broker?.extended_fault_bean && <option>Non Abilitato</option>}
                                        </Form.Control>
                                    </Form.Group>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
