import React from "react";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import debounce from "lodash.debounce";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {ChannelDetails, Payment_modelEnum} from "../../../generated/api/ChannelDetails";
import {PspChannelPaymentTypes} from "../../../generated/api/PspChannelPaymentTypes";
import {PaymentType} from "../../../generated/api/PaymentType";
import {getChannel, getPaymentTypeList, getPaymentTypeLegend} from "./Services";
import ChannelView from "./ChannelView";
interface IProps {
    match: {
        params: Record<string, unknown>;
    };
    history: {
        push(url: string): void;
    };
    location?: any;
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    backup: any;
    channelName: string;
    code: string;
    channel: ChannelDetails;
    paymentTypeList: Array<string>;
    paymentTypeLegend: Array<any>;
    edit: boolean;
    newPaymentType: boolean;
    paymentType: string;
    showDeleteModal: boolean;

}

export default class EditChannel extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/channels";

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            backup: {
                channel: {} as ChannelDetails
            },
            channelName: "",
            code: "",
            channel: {
                channel_code: "",
                enabled: false,
                broker_psp_code: "",
                password: "",
                new_password: "",
                protocol: "HTTPS",
                ip: "",
                port: 80,
                service: "",
                proxy_enabled: false,
                proxy_host: "",
                proxy_port: 80,
                target_host: "",
                target_port: 443,
                target_path: "",
                thread_number: 1,
                timeout_a: 15,
                timeout_b: 30,
                timeout_c: 120,
                primitive_version: 1,
                new_fault_code: false,
                redirect_protocol: "HTTPS",
                redirect_ip: "",
                redirect_port: 80,
                redirect_path: "",
                redirect_query_string: "",
                payment_model: Payment_modelEnum.IMMEDIATE,
                rt_push: false,
                on_us: false,
                card_chart: false,
                recovery: false,
                digital_stamp_brand: false,
                serv_plugin: '-',
                flag_io: false,
                agid: false,
                description: "",
            } as unknown as ChannelDetails,
            paymentTypeList: [],
            paymentTypeLegend: [],
            edit: false,
            newPaymentType: false,
            paymentType: "",
            showDeleteModal: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handlePaymentType = this.handlePaymentType.bind(this);
        this.saveChannel = this.saveChannel.bind(this);
        this.discard = this.discard.bind(this);
        this.setNewPaymentType = this.setNewPaymentType.bind(this);
        this.debouncedBrokerPspOptions = this.debouncedBrokerPspOptions.bind(this);
        this.promiseWfespOptions = this.promiseWfespOptions.bind(this);
        this.setModal = this.setModal.bind(this);
        this.setChannel = this.setChannel.bind(this);
        this.setPaymentTypeList = this.setPaymentTypeList.bind(this);
        this.setPaymentTypeLegend = this.setPaymentTypeLegend.bind(this);
        this.discardPaymentType = this.discardPaymentType.bind(this);
        this.savePaymentType = this.savePaymentType.bind(this); 
        this.removePaymentType = this.removePaymentType.bind(this);
        this.removePaymentTypeApi = this.removePaymentTypeApi.bind(this);
    }

    setChannel(channel: ChannelDetails): void {
        this.setState({ channel });
    }

    setModal(modal: boolean): void{
        this.setState({showDeleteModal: modal});
    }

    setPaymentTypeList(paymentTypeList: []){
        this.setState({paymentTypeList});
    }

    setPaymentTypeLegend(paymentTypeLegend: any){
        this.setState({paymentTypeLegend});
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    goBack(): void {
        this.props.history.push(this.service);
    }

    updateBackup(section: string, data: ChannelDetails | any) {
        // eslint-disable-next-line functional/no-let
        let backup = {...this.state.backup};
        if (section === "channel") {
            const keys = ["new_password"];
            for (const key of keys) {
                // eslint-disable-next-line no-prototype-builtins
                if (!data.hasOwnProperty(key)) {
                    // eslint-disable-next-line functional/immutable-data
                    data[key] = "";
                }
            }
        }
        backup = {...backup, [section]: data};
        this.setState({backup});
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({code, isLoading: true});
        Promise.all([getChannel(this.context, code), getPaymentTypeLegend(this.context), 
            getPaymentTypeList(this.context, code)])
        .then((result: any) => {
            const channel = {...this.state.channel, ...result[0]} as ChannelDetails;
            this.setChannel(channel);
            this.setPaymentTypeList(result[2].payment_types);
            const paymentTypeLegend = [] as any;
            result[1].payment_types.forEach((pt: PaymentType) => {
                // eslint-disable-next-line functional/immutable-data
                paymentTypeLegend[pt.payment_type] = pt.description;
            });
            this.setPaymentTypeLegend(paymentTypeLegend);
            this.setState({isError: false});
        }).catch(() => {
            this.setState({isError: true});
        });
        this.setState({isLoading: false});
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let channel: ChannelDetails = this.state.channel;
        const key = event.target.name as string;
        // eslint-disable-next-line functional/no-let
        let value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        if (value === '-') {
            value = null;
        }
        channel = {...channel, [key]: value};
        this.setState({channel});
    }

    handleBrokerPspChange(event: any) {
        const channel: ChannelDetails = this.state.channel;
        // eslint-disable-next-line functional/immutable-data
        channel.broker_psp_code = event.value;
        this.setState({channel});
    }

    handleWfespChange(event: any) {
        const channel: ChannelDetails = this.state.channel;
        // eslint-disable-next-line functional/no-let
        let value = event.value;
        if (value === 'null') {
            value = null;
        }
        // eslint-disable-next-line functional/immutable-data
        channel.serv_plugin = value;
        this.setState({channel});
    }

    handlePaymentType(paymentType: string) {
        this.setState({paymentType});
    }

    saveChannel() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updateChannel({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    channelcode: this.state.code,
                    body: this.state.channel
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        toast.info("Modifica avvenuta con successo.");
                        this.setState({channel: response.right.value});
                        this.setState({channelName: response.right.value.description});
                        this.updateBackup("channel", response.right.value);
                        setTimeout(this.goBack.bind(this), 2000);
                    } else {
                        const message = "detail" in response.right.value ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
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

    removePaymentTypeApi = (paymentType: string) => {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        }).then((response: any) => {
                apiClient.deleteChannelPaymentType({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    channelcode: this.state.code,
                    paymenttypecode: paymentType
                }).then((res: any) => {
                        if (res.right.status === 200) {
                            toast.info("Rimozione avvenuta con successo");
                        } else {
                            this.toastError(res.right.value.detail);
                        }
                    }).catch(() => {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    });
            });
    };

    removePaymentType(paymentType: string) {
        this.setState({paymentTypeList: this.state.paymentTypeList.filter((p) => p !== paymentType)});
        this.removePaymentTypeApi(paymentType);
    }

    setNewPaymentType() {
        this.setState({newPaymentType: true, paymentType: ""});
    }

    discardPaymentType() {
        this.setState({newPaymentType: false});
    }

    savePaymentType() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                const ptList: Array<string> = [this.state.paymentType];
                const data = {
                    "payment_types": ptList
                } as PspChannelPaymentTypes;
                apiClient.createChannelPaymentType({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    channelcode: this.state.code,
                    body: data
                }).then((response: any) => {
                    if (response.right.status === 201) {
                        toast.info("Modifica avvenuta con successo.");
                        this.setState({paymentTypeList: response.right.value.payment_types});
                    } else {
                        const message = "detail" in response.right.value ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                        toast.error(message, {theme: "colored"});
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                }).finally(() => {
                    this.setState({newPaymentType: false});
                });
            });
    }

    debouncedBrokerPspOptions = debounce((inputValue, callback) => {
        this.promiseBrokerPspOptions(inputValue, callback);
    }, 500);

    promiseBrokerPspOptions(inputValue: string, callback: any) {
        const limit = inputValue.length === 0 ? 10 : 99999;
        const code = inputValue.length === 0 ? "" : inputValue;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getBrokersPsp({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page: 0,
                    limit,
                    code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const items: Array<any> = [];
                        resp.right.value.brokers_psp.map((broker_psp: any) => {
                            // eslint-disable-next-line functional/immutable-data
                            items.push({
                                value: broker_psp.broker_psp_code,
                                label: broker_psp.broker_psp_code,
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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    promiseWfespOptions(inputValue: string, callback: any) {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getWfespPlugins({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const items: Array<any> = [];
                        // eslint-disable-next-line functional/immutable-data
                        items.push({
                            value: 'null',
                            label: '-',
                        });
                        resp.right.value.wfesp_plugin_confs.map((plugin: any) => {
                            // eslint-disable-next-line functional/immutable-data
                            items.push({
                                value: plugin.id_serv_plugin,
                                label: plugin.id_serv_plugin,
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

    render(): React.ReactNode {
        return (
            <ChannelView channel={this.state.channel} 
                setChannel={this.setChannel}
                saveChannel={this.saveChannel}
                showModal={this.state.showDeleteModal}
                setShowModal={this.setModal}
                paymentTypeList={this.state.paymentTypeList}
                isLoading={this.state.isLoading}
                isError={this.state.isError}
                history={this.props.history}
                readOnly={false}
                showPaymentTypeList={true}
                newPaymentType={this.state.newPaymentType}
                setNewPaymentType={this.setNewPaymentType}
                handlePaymentType={this.handlePaymentType}
                paymentTypeLegend={this.state.paymentTypeLegend}
                discardPaymentType={this.discardPaymentType}
                savePaymentType={this.savePaymentType}
                removePaymentType={this.removePaymentType}
                pspList={[]}
            />
        );
    } 
}
