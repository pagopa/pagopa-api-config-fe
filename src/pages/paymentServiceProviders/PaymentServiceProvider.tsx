import React from "react";
import {Alert, Breadcrumb, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {PaymentServiceProviderDetails} from "../../../generated/api/PaymentServiceProviderDetails";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    code: string;
    paymentServiceProvider: PaymentServiceProviderDetails;
    edit: boolean;
}

export default class PaymentServiceProvider extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
            paymentServiceProvider: {} as PaymentServiceProviderDetails,
            edit: false
        };
    }

    getPaymentServiceProvider(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getPaymentServiceProvider({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    pspcode: code
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({paymentServiceProvider: response.right.value});
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
        this.getPaymentServiceProvider(code);
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        return (
            <div className="container-fluid payment-service-providers">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/payment-service-providers">Prestatori Servizio di Pagamento</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.paymentServiceProvider.business_name}</Breadcrumb.Item>
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
                                            <h2>{this.state.paymentServiceProvider.business_name}</h2>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <Form.Group controlId="code" className="col-md-4">
                                            <Form.Label>Codice</Form.Label>
                                            <Form.Control type="code" placeholder="-"
                                                          value={this.state.paymentServiceProvider.psp_code}
                                                          readOnly/>
                                        </Form.Group>
                                        <Form.Group controlId="enabled" className="col-md-2">
                                            <Form.Label>Stato</Form.Label>
                                            <Form.Control as="select" type="enabled" placeholder="stato" readOnly>
                                                {this.state.paymentServiceProvider.enabled && <option>Abilitato</option>}
                                                {!this.state.paymentServiceProvider.enabled && <option>Non Abilitato</option>}
                                            </Form.Control>
                                        </Form.Group>
                                    </div>
                                    <div className="row">
                                        <Form.Group controlId="tax_code" className="col-md-4">
                                            <Form.Label>Codice Fiscale</Form.Label>
                                            <Form.Control type="tax_code" placeholder="-"
                                                          value={this.state.paymentServiceProvider.tax_code}
                                                          readOnly/>
                                        </Form.Group>
                                        <Form.Group controlId="abi" className="col-md-2">
                                            <Form.Label>Codice ABI</Form.Label>
                                            <Form.Control type="abi" placeholder="-"
                                                          value={this.state.paymentServiceProvider.abi}
                                                          readOnly/>
                                        </Form.Group>
                                        <Form.Group controlId="bic" className="col-md-2">
                                            <Form.Label>Codice BIC</Form.Label>
                                            <Form.Control type="bic" placeholder="-"
                                                          value={this.state.paymentServiceProvider.bic}
                                                          readOnly/>
                                        </Form.Group>
                                    </div>
                                    <div className="row">
                                        <Form.Group controlId="agid_psp" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                custom
                                                disabled
                                                defaultChecked={this.state.paymentServiceProvider.agid_psp === true}
                                                type={'checkbox'}
                                                id={'agid-psp'}
                                                label={'PSP interno'}
                                            />
                                        </Form.Group>
                                        <Form.Group controlId="stamp" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                custom
                                                disabled
                                                defaultChecked={this.state.paymentServiceProvider.stamp === true}
                                                type={'checkbox'}
                                                id={'stamp'}
                                                label={'Marca bollo digitale'}
                                            />
                                        </Form.Group>
                                        <Form.Group controlId="transfer" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                custom
                                                disabled
                                                defaultChecked={this.state.paymentServiceProvider.transfer === true}
                                                type={'checkbox'}
                                                id={'transfer'}
                                                label={'Storno pagamento'}
                                            />
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
