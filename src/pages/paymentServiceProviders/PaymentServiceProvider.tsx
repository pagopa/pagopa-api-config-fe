import React from "react";
import {Alert, Breadcrumb, Card, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaEye, FaInfoCircle, FaSpinner, FaTimes} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {PaymentServiceProviderDetails} from "../../../generated/api/PaymentServiceProviderDetails";
import {PaymentType} from "../../../generated/api/PaymentType";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    code: string;
    paymentServiceProvider: PaymentServiceProviderDetails;
    channelList: any;
    paymentTypeLegend: any;
    edit: boolean;
}

export default class PaymentServiceProvider extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private channelService: string = '/channels';

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
            paymentServiceProvider: {} as PaymentServiceProviderDetails,
            channelList: [],
            paymentTypeLegend: {},
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
                    Authorization: `Bearer ${response.idToken}`,
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

    getChannels(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getPaymentServiceProvidersChannels({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    pspcode: code
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            this.setState({channelList: response.right.value.channels});
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

    getPaymentTypeLegend(): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getPaymentTypes({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: ""
                })
                    .then((response: any) => {
                        if (response.right.status === 200) {
                            const paymentTypeLegend = {} as any;
                            response.right.value.payment_types.forEach((pt: PaymentType) => {
                                // eslint-disable-next-line functional/immutable-data
                                paymentTypeLegend[pt.payment_type] = pt.description;
                            });
                            this.setState({paymentTypeLegend});
                        }
                    })
                    .catch(() => {
                        this.setState({isError: true});
                    });
            });
    }

    handleEdit() {
        this.props.history.push("/payment-service-providers/" + String(this.props.match.params.code) + "?edit");
    }

    handleChannelDetails(code: string) {
        this.props.history.push(this.channelService + "/" + code);
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({isError: false});
        this.getPaymentServiceProvider(code);
        this.getChannels(code);
        this.getPaymentTypeLegend();
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        // create rows for channels table
        const channelList: any = [];
        this.state.channelList.map((item: any, index: number) => {
            const row = (
                    <tr key={index}>
                        <td>{item.channel_code}</td>
                        <td className="text-center">
                            {item.enabled && <FaCheck className="text-success"/>}
                            {!item.enabled && <FaTimes className="text-danger"/>}
                        </td>
                        <td className="text-center">{item.payment_types.join(" ")}</td>
                        <td className="text-right">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                            <OverlayTrigger placement="top"
                                            overlay={<Tooltip id={`tooltip-details-${index}`}>Visualizza</Tooltip>}>
                                <FaEye role="button" className="mr-3"
                                       onClick={() => this.handleChannelDetails(item.channel_code)}/>
                            </OverlayTrigger>
                        </td>
                    </tr>
            );
            channelList.push(row);
        });

        const paymentTypeLegend: any = Object.keys(this.state.paymentTypeLegend).map((item: any, index: number) => (
                <span key={index} className="mr-2 badge badge-secondary">
                    {item}: {this.state.paymentTypeLegend[item]}
                    {item === "OBEP" && <span className="badge badge-danger ml-2">DEPRECATO</span>}
                </span>
        ));

        return (
            <div className="container-fluid payment-service-providers">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/payment-service-providers">Prestatori Servizio di Pagamento</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.paymentServiceProvider.business_name || "-"}</Breadcrumb.Item>
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
                                        <div className="col-md-10">
                                            <h2>{this.state.paymentServiceProvider.business_name || "-"}</h2>
                                        </div>
                                        <div className="col-md-2 text-right">
                                            <button className={"btn btn-primary"} onClick={() => this.handleEdit()} >Edit</button>
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
                                                checked={this.state.paymentServiceProvider.agid_psp === true}
                                                type={'checkbox'}
                                                id={'agid-psp'}
                                                label={'PSP interno'}
                                            />
                                        </Form.Group>
                                        <Form.Group controlId="stamp" className="col-md-2 custom-control-box">
                                            <Form.Check
                                                custom
                                                disabled
                                                checked={this.state.paymentServiceProvider.stamp === true}
                                                type={'checkbox'}
                                                id={'stamp'}
                                                label={'Marca bollo digitale'}
                                            />
                                        </Form.Group>
                                    </div>
                                </>
                            )
                        }
                    </div>
                </div>
                <div className="row mt-3">
                    <div className="col-md-12">
                        <Card>
                            <Card.Header>
                                <h5>Canali</h5>
                            </Card.Header>
                            <Card.Body>
                                {Object.keys(channelList).length === 0 && (
                                        <Alert className={'col-md-12'} variant={"warning"}><FaInfoCircle
                                                className="mr-1"/>Canali non presenti</Alert>
                                )}
                                {Object.keys(channelList).length > 0 &&
								<Table hover responsive size="sm">
									<thead>
									<tr>
										<th className="">Codice</th>
										<th className="text-center">Abilitata</th>
										<th className="text-center">Tipo Versamento</th>
										<th className="text-right"></th>
									</tr>
									</thead>
									<tbody>
                                    {channelList}
									</tbody>
								</Table>
                                }
                            </Card.Body>
                            <Card.Footer>
                                <div className="legend">
                                    <span className="font-weight-bold mr-2">Legenda:</span>
                                    {paymentTypeLegend}
                                </div>
                            </Card.Footer>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
}
