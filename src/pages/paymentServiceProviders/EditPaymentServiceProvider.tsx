import React from "react";
import {Alert, Breadcrumb, Button, Card, Form, OverlayTrigger, Table, Tooltip} from "react-bootstrap";
import {FaCheck, FaEdit, FaInfoCircle, FaPlus, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import AsyncSelect from "react-select/async";
import debounce from "lodash.debounce";
import Select from "react-select";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {PaymentServiceProviderDetails} from "../../../generated/api/PaymentServiceProviderDetails";
import {PspChannelCode} from "../../../generated/api/PspChannelCode";
import {PaymentType} from "../../../generated/api/PaymentType";
import ConfirmationModal from "../../components/ConfirmationModal";

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
    channelSection: any;
    channelCode: string;
    optionPaymentTypes: any;
    paymentTypes: [];
    paymentTypeLegend: any;
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
            edit: false,
            channelSection: {
                new: false,
                edit: false,
                delete: false,
                item: PspChannelCode
            },
            channelCode: "",
            optionPaymentTypes: {},
            paymentTypes: [],
            paymentTypeLegend: {},
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleChannel = this.handleChannel.bind(this);
        this.handleChannelDelete = this.handleChannelDelete.bind(this);
        this.handleChannelEdit = this.handleChannelEdit.bind(this);
        this.handlePaymentTypes = this.handlePaymentTypes.bind(this);
        this.newChannel = this.newChannel.bind(this);
        this.saveChannel = this.saveChannel.bind(this);
        this.discardChannel = this.discardChannel.bind(this);
        this.debouncedChannelOptions = this.debouncedChannelOptions.bind(this);
        this.getPaymentTypesOptions = this.getPaymentTypesOptions.bind(this);
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
                    Authorization: `Bearer ${response.idToken}`,
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
                    Authorization: `Bearer ${response.idToken}`,
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

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({code, isError: false});
        this.getPaymentServiceProvider(code);
        this.getChannels(code);
        this.getPaymentTypeLegend();
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let paymentServiceProvider: PaymentServiceProviderDetails = this.state.paymentServiceProvider;
        const key = event.target.name as string;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        paymentServiceProvider = {...paymentServiceProvider, [key]: value};
        this.setState({paymentServiceProvider});
    }

    handleChannel(event: any) {
        this.setState({channelCode: event.value.channel_code, paymentTypes: []});
    }

    handlePaymentTypes(paymentTypesString: any) {
        const paymentTypes = paymentTypesString.map((elem: any) => elem.value);
        this.setState({paymentTypes});
    }

    newChannel() {
        const channelSection = {new: true, edit: false, delete: false};
        this.setState({channelSection});
    }

    discardChannel() {
        const channelSection = {new: false, edit: false, delete: false};
        this.setState({channelSection, channelCode: "", paymentTypes: []});
    }

    saveChannel() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                const data = {
                    "channel_code": this.state.channelCode,
                    "payment_types": this.state.paymentTypes
                };

                apiClient.createPaymentServiceProvidersChannels({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    pspcode: this.state.paymentServiceProvider.psp_code,
                    body: data
                })
                    .then((response: any) => {
                        if (response.right.status === 201) {
                            this.getChannels(this.state.paymentServiceProvider.psp_code);
                            toast.info("Relazione con canale salvata con successo");
                        } else {
                            const message = "detail" in response.right.value ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                            this.toastError(message);
                        }
                    })
                    .catch(() => {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    })
                    .finally(this.discardChannel);
            });
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    handleChannelEdit(item: PspChannelCode) {
        const channelSection = {new: false, edit: true, delete: false, item};
        this.setState({channelSection, channelCode: item.channel_code, paymentTypes: item.payment_types as []});
    }

    handleChannelDelete(item: PspChannelCode) {
        const channelSection = {new: false, edit: false, delete: true, item};
        this.setState({channelSection, channelCode: item.channel_code, paymentTypes: item.payment_types as []});
    }

    editChannel() {
        // eslint-disable-next-line functional/no-let
        let exit = false;
        for (const pt of this.state.paymentTypes) {
            if (!Object.keys(this.state.paymentTypeLegend).includes(pt)) {
                toast.warning(String(pt).toUpperCase() + " non è un tipo versamento valido", {theme: "colored"});
                exit = true;
                break;
            }
        }
        if (!exit) {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    const data = {
                        "payment_types": this.state.paymentTypes
                    };

                    apiClient.updatePaymentServiceProvidersChannels({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        pspcode: this.state.paymentServiceProvider.psp_code,
                        channelcode: this.state.channelCode,
                        body: data
                    })
                        .then((resp: any) => {
                            if (resp.right.status === 200) {
                                this.getChannels(this.state.paymentServiceProvider.psp_code);
                                toast.info("Relazione con canale aggiornata con successo");
                            } else {
                                const message = "detail" in resp.right.value ? resp.right.value.detail : "Operazione non avvenuta a causa di un errore";
                                this.toastError(message);
                            }
                        })
                        .catch(() => {
                            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                        })
                        .finally(this.discardChannel);
                });
        }
    }

    hideDeleteModal = (status: string) => {
        if (status === "ok") {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    apiClient.deletePaymentServiceProvidersChannels({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        pspcode: this.state.code,
                        channelcode: this.state.channelCode
                    })
                        .then((res: any) => {
                            if (res.right.status === 200) {
                                toast.info("Rimozione avvenuta con successo");
                                this.getChannels(this.state.code);
                            } else if (res.right.status === 409) {
                                this.toastError(res.right.value.detail);

                            } else {
                                this.toastError(res.right.value.title);
                            }
                        })
                        .catch(() => {
                            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                        })
                        .finally(() => {
                            const channelSection = {new: false, edit: false, delete: false};
                            this.setState({channelSection, channelCode: "", paymentTypes: []});
                        });
                });
        } else {
            const channelSection = {new: false, edit: false, delete: false};
            this.setState({channelSection, channelCode: "", paymentTypes: []});
        }
    };

    savePaymentServiceProvider() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updatePaymentServiceProvider({
                    Authorization: `Bearer ${response.idToken}`,
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

    debouncedChannelOptions = debounce((inputValue, callback) => {
        this.promiseChannelOptions(inputValue, callback);
    }, 500);


    promiseChannelOptions(inputValue: string, callback: any) {
        const limit = inputValue.length === 0 ? 10 : 99999;
        const code = inputValue.length === 0 ? "" : inputValue;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getChannels({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page: 0,
                    limit,
                    code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const items: Array<any> = [];
                        resp.right.value.channels.map((channel: any) => {
                            // eslint-disable-next-line functional/immutable-data
                            items.push({
                                value: {channel_code: channel.channel_code, version: channel.version},
                                label: channel.channel_code,
                            });
                        });
                        callback(items);
                    } else {
                        callback([]);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    callback([]);
                });
            });
    }


    getPaymentTypesOptions(channel_code: string) {
        if (this.state.optionPaymentTypes[channel_code]) {
            return;
        }
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getChannelPaymentTypes({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    channelcode: channel_code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const options: any = resp.right.value.payment_types.map((item: string) => (
                            {value: item, label: item}
                        ));

                        const optionsMap: any = {};
                        // eslint-disable-next-line functional/immutable-data
                        optionsMap[channel_code] = options;
                        this.setState({optionPaymentTypes: optionsMap});
                    }

                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });
            });
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
                    <td className="text-center">
                        {
                            !this.state.channelSection.edit && item.payment_types.join(" ")
                        }
                        {
                            this.state.channelSection.edit && this.state.channelSection.item === item &&
                            <Select name="payment_types"
                                    isMulti={true}
                                    isSearchable={false}
                                    value={this.state.paymentTypes.map(elem => ({value: elem, label: elem}))}
                                    options={this.state.optionPaymentTypes[item.channel_code]}
                                    onChange={(e) => this.handlePaymentTypes(e)}
                                    onMenuOpen={() => this.getPaymentTypesOptions(item.channel_code)}
                                    menuPortalTarget={document.body}
                            />
                        }
                    </td>
                    <td className="text-right">
                        {
                            !this.state.channelSection.edit &&
                            <>
                                {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                                <OverlayTrigger placement="top"
                                                overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                                    <FaEdit role="button" className="mr-3"
                                            onClick={() => this.handleChannelEdit(item)}/>
                                </OverlayTrigger>
                                {/* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */}
                                <OverlayTrigger placement="top"
                                                overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                    <FaTrash role="button" className="mr-3"
                                             onClick={() => this.handleChannelDelete(item)}/>
                                </OverlayTrigger>
                            </>
                        }
                        {
                            this.state.channelSection.edit && this.state.channelSection.item === item &&
                            <>
                                <Button className="ml-2 float-md-right"
                                        variant="secondary" onClick={() => {
                                    this.discardChannel();
                                }}>Annulla</Button>

                                <Button className="float-md-right" onClick={() => {
                                    this.editChannel();
                                }}>Salva</Button>
                            </>
                        }

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
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href={this.service}>Prestatori Servizio di Pagamento</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.pspName || "-"}</Breadcrumb.Item>
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
                                            <h2>{this.state.pspName || "-"}</h2>
                                        </div>
                                    </div>

                                    <Card>
                                        <Card.Header>
                                            <h5>Anagrafica</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="row">
                                                <Form.Group controlId="code" className="col-md-3">
                                                    <Form.Label>Nome <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control name="business_name" placeholder=""
                                                                  value={this.state.paymentServiceProvider.business_name}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>

                                                <Form.Group controlId="code" className="col-md-3">
                                                    <Form.Label>Codice <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control name="psp_code" placeholder=""
                                                                  value={this.state.paymentServiceProvider.psp_code}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="enabled" className="col-md-3">
                                                    <Form.Label>Stato <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control as="select" name="enabled" placeholder="stato"
                                                                  onChange={(e) => this.handleChange(e)}
                                                                  value={String(this.state.paymentServiceProvider.enabled)}>
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
                                                <Form.Group controlId="vat_number" className="col-md-2">
                                                    <Form.Label>Partita IVA</Form.Label>
                                                    <Form.Control placeholder="" name="vat_number"
                                                                  value={this.state.paymentServiceProvider.vat_number}
                                                                  onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="agid_psp" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.state.paymentServiceProvider.agid_psp === true}
                                                        name="agid_psp"
                                                        type={'checkbox'}
                                                        id={'agid-psp'}
                                                        label={'PSP interno'}
                                                        onChange={(e) => this.handleChange(e)}/>
                                                </Form.Group>
                                                <Form.Group controlId="stamp" className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.state.paymentServiceProvider.stamp === true}
                                                        name="stamp"
                                                        type={'checkbox'}
                                                        id={'stamp'}
                                                        label={'Marca bollo digitale'}
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
                                                    {Object.keys(channelList).length === 0 && !this.state.channelSection.new && (
                                                        <Alert className={'col-md-12'} variant={"warning"}><FaInfoCircle
                                                            className="mr-1"/>Canali non presenti</Alert>
                                                    )}
                                                    {(Object.keys(channelList).length > 0 || this.state.channelSection.new) &&
                                                        <Table hover responsive size="sm">
                                                            <thead>
                                                            <tr>
                                                                <th className="">Codice <span
                                                                    className="text-danger">*</span></th>
                                                                <th className="text-center">Abilitato</th>
                                                                <th className="text-center">Tipo Versamento <span
                                                                    className="text-danger">*</span></th>
                                                                <th className="text-right"/>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {channelList}
                                                            {
                                                                this.state.channelSection.new &&
                                                                <tr>
                                                                    <td>
                                                                        <AsyncSelect
                                                                            cacheOptions defaultOptions
                                                                            loadOptions={this.debouncedChannelOptions}
                                                                            placeholder="Cerca codice canale"
                                                                            menuPortalTarget={document.body}
                                                                            styles={{
                                                                                menuPortal: base => ({
                                                                                    ...base,
                                                                                    zIndex: 9999
                                                                                })
                                                                            }}
                                                                            name="channel_code"
                                                                            onChange={(e) => this.handleChannel(e)}
                                                                        />
                                                                    </td>
                                                                    <td/>
                                                                    <td>
                                                                        <Select name="payment_types"
                                                                                isMulti={true}
                                                                                isDisabled={!this.state.channelCode}
                                                                                isSearchable={false}
                                                                                value={this.state.paymentTypes.map(elem => ({
                                                                                    value: elem,
                                                                                    label: elem
                                                                                }))}
                                                                                options={this.state.optionPaymentTypes[this.state.channelCode]}
                                                                                onChange={(e) => this.handlePaymentTypes(e)}
                                                                                onMenuOpen={() => this.getPaymentTypesOptions(this.state.channelCode)}
                                                                                menuPortalTarget={document.body}
                                                                        />
                                                                    </td>
                                                                    <td/>
                                                                </tr>
                                                            }
                                                            </tbody>
                                                        </Table>
                                                    }
                                                </Card.Body>
                                                <Card.Footer>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            <div className="legend">
                                                                <span className="font-weight-bold mr-2">Legenda:</span>
                                                                {paymentTypeLegend}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        {
                                                            !this.state.channelSection.edit &&

                                                            <div className="col-md-12">
                                                                {
                                                                    !this.state.channelSection.new &&
                                                                    <Button className="float-md-right"
                                                                            onClick={() => this.newChannel()}>Nuovo <FaPlus/></Button>
                                                                }
                                                                {
                                                                    this.state.channelSection.new &&
                                                                    <Button className="ml-2 float-md-right"
                                                                            variant="secondary" onClick={() => {
                                                                        this.discardChannel();
                                                                    }}>Annulla</Button>
                                                                }
                                                                {
                                                                    this.state.channelSection.new &&
                                                                    <Button className="float-md-right" onClick={() => {
                                                                        this.saveChannel();
                                                                    }}>Salva</Button>
                                                                }
                                                            </div>
                                                        }
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
                <ConfirmationModal show={this.state.channelSection.delete} handleClose={this.hideDeleteModal}>
                    <p>Sei sicuro di voler eliminare la seguente relazione PSP-Canale?</p>
                    <ul>
                        <li>{this.state.code} - {this.state.channelCode}</li>
                    </ul>
                </ConfirmationModal>
            </div>
        );
    }
}
