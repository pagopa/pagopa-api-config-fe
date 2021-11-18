import React from 'react';
import {Validation} from "io-ts";
import {IResponseType} from "@pagopa/ts-commons/lib/requests";
import {ProblemJson} from "@pagopa/ts-commons/lib/responses";
import {toast} from "react-toastify";
import {Breadcrumb, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
import {apiClient} from "../../util/apiClient";
import {BrokerDetails} from '../../../generated/api/BrokerDetails';

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
        apiClient.getBroker({
            ApiKey: "",
            brokercode: code
        }).then((response: Validation<IResponseType<number, BrokerDetails | ProblemJson | undefined>>) => {
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
    }

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        return (
            <div>
                {isLoading && (<div className="text-center"><FaSpinner className="spinner" size={28}/></div>)}
                {!isLoading && (
                    <>
                        <div className="col-md-12 mb-5">
                            <Breadcrumb>
                                <Breadcrumb.Item href="/brokers">Intermediari</Breadcrumb.Item>
                                <Breadcrumb.Item active>{this.state.broker!.description}</Breadcrumb.Item>
                            </Breadcrumb>
                        </div>
                        <h2>{this.state.broker!.description}</h2>
                        <div className={"d-flex flex-row justify-content-around"}>
                            <Form.Group controlId="code" className={"p-2"} style={{minWidth: 400}}>
                                <Form.Label>Codice</Form.Label>
                                <Form.Control type="code" placeholder="-" value={this.state.broker!.broker_code}
                                              readOnly/>
                            </Form.Group>
                            <Form.Group controlId="enabled" className={"p-2"} style={{minWidth: 200}}>
                                <Form.Label>Stato</Form.Label>
                                <Form.Control as="select" type="enabled" placeholder="stato" readOnly>
                                    {this.state.broker!.enabled && <option>Abilitato</option>}
                                    {!this.state.broker!.enabled && <option>Non Abilitato</option>}
                                </Form.Control>
                            </Form.Group>
                            <Form.Group controlId="extended_fault_bean" className={"p-2"} style={{minWidth: 200}}>
                                <Form.Label>Extended Fault Bean</Form.Label>
                                <Form.Control as="select" type="enabled" placeholder="stato" readOnly>
                                    {this.state.broker!.extended_fault_bean && <option>Abilitato</option>}
                                    {!this.state.broker!.extended_fault_bean && <option>Non Abilitato</option>}
                                </Form.Control>
                            </Form.Group>
                        </div>
                    </>
                )}


            </div>
        );
    }
}
