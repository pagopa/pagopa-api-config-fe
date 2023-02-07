import React from "react";

import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import debounce from "lodash.debounce";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";
import {ChannelDetails} from "../../../generated/api/ChannelDetails";
import ChannelView from "./ChannelView";
import { getChannel } from "./Services";

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
    channel: ChannelDetails;
    code: string;
    showModal: boolean;
    isLoading: boolean;
    isError: boolean;
}

export default class CreateChannel extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    service = "/channels";

    constructor(props: IProps) {
        super(props);

        this.state = {
            channel: {
                channel_code: "",
                enabled: false,
                password: "",
                protocol: "HTTPS",
                ip: "",
                port: 443,
                service: "",
                broker_psp_code: "",
                proxy_enabled: false,
                proxy_host: "",
                proxy_port: 0,
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
                payment_model: "IMMEDIATE",
                rt_push: false,
                on_us: false,
                card_chart: false,
                recovery: false,
                digital_stamp_brand: false,
                flag_io: false,
                serv_plugin: null,
                agid: false
            } as unknown as ChannelDetails,
            code: "",
            showModal: false,
            isError: false,
            isLoading: false
        };

        this.discard = this.discard.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.debouncedBrokerPspOptions = this.debouncedBrokerPspOptions.bind(this);
        this.promiseWfespOptions = this.promiseWfespOptions.bind(this);
        this.setChannel = this.setChannel.bind(this);
        this.setModal = this.setModal.bind(this);
    }

    setChannel(channel: ChannelDetails): void {
        this.setState({ channel });
    }

    setModal(modal: boolean): void{
        this.setState({showModal: modal});
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    componentDidMount(): void {
        const code = new URLSearchParams(this.props.location.search).get("clone") as string;
        if (code) {
            this.setState({code, isLoading: true});
            getChannel(this.context, code).then((data: any) => {
                const channel = {...data, channel_code: ""} as ChannelDetails;
                this.setChannel(channel);
                this.setState({isError: false});      
            }).catch(() => {
                this.setState({isError: true});
            }).finally(() => this.setState({ isLoading: false }));
        }
        else {
            this.setState({ isLoading: false });
            this.setState({isError: false});
        }
    }

    handleChange(event: any) {
        // eslint-disable-next-line functional/no-let
        let channel: ChannelDetails = this.state.channel;
        const key = event.target.name as string;
        // eslint-disable-next-line functional/no-let
        let value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        if (value === 'null') {
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

    discard(): void {
        this.setState({showModal: true});
    }

    hideModal(status: string): void {
        if (status === "ok") {
            this.props.history.push(this.service);
        }
        this.setState({showModal: false});
    }

    goBack(): void {
        this.props.history.push(this.service);
    }

    isNotValidPort(port: number) {
        return port ? port < 1 || port > 65535 : port;
    }

    isNotValidTimeout(no: number) {
        return no < 0;
    }

    isNotValidThread(no: number) {
        return no < 1;
    }

    isNotValidPrimitiveVersion(no: number) {
        return no < 1 || no > 2;
    }

    validData() {
        if (this.isNotValidPort(this.state.channel.port) || this.isNotValidPort(this.state.channel.proxy_port as number)
            || this.isNotValidPort(this.state.channel.redirect_port as number)) {
            this.toastError("La porta deve avere un valore compreso tra 1 e 65535.");
            return false;
        }

        if (this.isNotValidThread(this.state.channel.thread_number)) {
            this.toastError("Il numero di thread deve essere un valore maggiore di 0.");
            return false;
        }

        if (this.isNotValidTimeout(this.state.channel.timeout_a)
            || this.isNotValidTimeout(this.state.channel.timeout_b) || this.isNotValidTimeout(this.state.channel.timeout_c)) {
            this.toastError("I timeout devono avere un valore maggiore o uguale a 0.");
            return false;
        }

        if (this.isNotValidPrimitiveVersion(this.state.channel.primitive_version)) {
            this.toastError("La versione delle primitive deve essere una tra le seguenti: 1 o 2");
            return;
        }
        return true;
    }

    save(): void {
        if (!this.validData()) {
            return;
        }

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createChannel({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    body: this.state.channel
                }).then((response: any) => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (response.hasOwnProperty("right")) {
                        if (response.right.status === 201) {
                            // eslint-disable-next-line no-console
                            toast.info("Creazione avvenuta con successo.");
                            setTimeout(this.goBack.bind(this), 2000);
                        } else {
                            const message = "detail" in response.right.value ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                            this.toastError(message);
                        }
                    } else {
                        toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
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


    render(): React.ReactNode {
        return (
            <ChannelView channel={this.state.channel} 
                setChannel={this.setChannel}
                saveChannel={this.save}
                showModal={this.state.showModal}
                setShowModal={this.setModal}
                paymentTypeList={[]}
                isLoading={this.state.isLoading}
                isError={this.state.isError}
                history={this.props.history}
                readOnly={false}
                showPaymentTypeList={false}
                pspList={[]}
            />
        );
    } 
}
