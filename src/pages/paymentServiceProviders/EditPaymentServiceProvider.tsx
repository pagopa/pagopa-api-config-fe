import React from "react";
import {Alert, Breadcrumb, Button, Card, Form, Table} from "react-bootstrap";
import {FaCheck, FaInfoCircle, FaPlus, FaSpinner, FaTimes} from "react-icons/fa";
import {toast} from "react-toastify";
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
    backup: any;
    pspName: string;
    code: string;
    paymentServiceProvider: PaymentServiceProviderDetails;
    channelList: [];
    edit: boolean;
}

export default class EditPaymentServiceProvider extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/payment-service-providers";

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            backup: {
                paymentServiceProvider: {} as PaymentServiceProviderDetails,
                channelList: []
            },
            pspName: "",
            code: "",
            paymentServiceProvider: {} as PaymentServiceProviderDetails,
            channelList: [],
            edit: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.savePaymentServiceProvider = this.savePaymentServiceProvider.bind(this);
        this.discard = this.discard.bind(this);
    }

    updateBackup(section: string, data: PaymentServiceProviderDetails | any) {
        // eslint-disable-next-line functional/no-let
        let backup = {...this.state.backup};
        backup = {...backup, [section]: data};
        this.setState({backup});
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
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        this.setState({paymentServiceProvider: response.right.value});
                        this.setState({pspName: response.right.value.business_name});
                        this.updateBackup("paymentServiceProvider", response.right.value);
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
                        Authorization: `Bearer ${response.accessToken}`,
                        ApiKey: "",
                        pspcode: code
                    })
                            .then((response: any) => {
                                if (response.right.status === 200) {
                                    this.setState({channelList: response.right.value.channels});
                                    this.updateBackup("channelList", response.right.value.channels);
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
        this.getPaymentServiceProvider(code);
        this.getChannels(code);
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let paymentServiceProvider: PaymentServiceProviderDetails = this.state.paymentServiceProvider;
        const key = event.target.name as string;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        paymentServiceProvider = {...paymentServiceProvider, [key]: value};
        this.setState({paymentServiceProvider});
    }

    savePaymentServiceProvider() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updatePaymentServiceProvider({
                    Authorization: `Bearer ${response.accessToken}`,
                    ApiKey: "",
                    pspcode: this.state.code,
                    body: this.state.paymentServiceProvider
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        toast.info("Modifica avvenuta con successo.");
                        this.setState({paymentServiceProvider: response.right.value});
                        this.setState({pspName: response.right.value.business_name});
                        this.updateBackup("paymentServiceProvider", response.right.value);
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

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    createChannel(): void {
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
                        <td className="text-center">{item.payment_type.join(" ")}</td>
                    </tr>
            );
            channelList.push(row);
        });

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href={this.service}>Prestatori Servizio di Pagamento</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.pspName}</Breadcrumb.Item>
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
                                            <h2>{this.state.pspName}</h2>
                                        </div>
                                    </div>

                                    <Card>
                                        <Card.Header>
                                            <h5>Anagrafica</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="row">
                                                <Form.Group controlId="code" className="col-md-3">
                                                    <Form.Label>Nome</Form.Label>
                                                    <Form.Control name="business_name" placeholder=""
                                                                  value={this.state.paymentServiceProvider.business_name}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="code" className="col-md-3">
                                                    <Form.Label>Codice</Form.Label>
                                                    <Form.Control name="psp_code" placeholder=""
                                                                  value={this.state.paymentServiceProvider.psp_code}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="enabled" className="col-md-3">
                                                    <Form.Label>Stato</Form.Label>
                                                    <Form.Control as="select" name="enabled" placeholder="stato"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  defaultValue={String(this.state.paymentServiceProvider.enabled)}>
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="tax_code" className="col-md-3">
                                                    <Form.Label>Codice Fiscale</Form.Label>
                                                    <Form.Control placeholder="" name="tax_code"
                                                                  value={this.state.paymentServiceProvider.tax_code}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="abi" className="col-md-4">
                                                    <Form.Label>Codice ABI</Form.Label>
                                                    <Form.Control placeholder="" name="abi"
                                                                  value={this.state.paymentServiceProvider.abi}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="bic" className="col-md-3">
                                                    <Form.Label>Codice BIC</Form.Label>
                                                    <Form.Control placeholder="" name="bic"
                                                                  value={this.state.paymentServiceProvider.bic}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="agid_psp" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                            custom
                                                            defaultChecked={this.state.paymentServiceProvider.agid_psp === true}
                                                            name="agid_psp"
                                                            type={'checkbox'}
                                                            id={'agid-psp'}
                                                            label={'PSP interno'}
                                                            onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="stamp" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                            custom
                                                            defaultChecked={this.state.paymentServiceProvider.stamp === true}
                                                            name="stamp"
                                                            type={'checkbox'}
                                                            id={'stamp'}
                                                            label={'Marca bollo digitale'}
                                                            onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="transfer" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                            custom
                                                            defaultChecked={this.state.paymentServiceProvider.transfer === true}
                                                            name="transfer"
                                                            type={'checkbox'}
                                                            id={'transfer'}
                                                            label={'Storno pagamento'}
                                                            onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>
                                        </Card.Body>
                                        <Card.Footer>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <Button className="ml-2 float-md-right" variant="secondary"
                                                            onClick={() => {
                                                                this.discard("paymentServiceProvider");
                                                            }}>Annulla</Button>
                                                    <Button className="float-md-right" onClick={() => {
                                                        this.savePaymentServiceProvider();
                                                    }}>Salva</Button>
                                                </div>
                                            </div>
                                        </Card.Footer>
                                    </Card>

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
														</tr>
														</thead>
														<tbody>
                                                        {channelList}
														</tbody>
													</Table>
                                                    }
                                                </Card.Body>
                                                <Card.Footer>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            <Button className="float-md-right" onClick={() => {
                                                                this.createChannel();
                                                            }} disabled>
                                                                Nuovo <FaPlus/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card.Footer>
                                            </Card>
                                        </div>
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
