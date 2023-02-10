import React from "react";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
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
            isError: false,
            isLoading: false,
            code: "",
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
                payment_model: "IMMEDIATE",
                rt_push: false,
                on_us: false,
                card_chart: false,
                recovery: false,
                digital_stamp_brand: false,
                flag_io: false,
                serv_plugin: '-',
                agid: false
            } as unknown as ChannelDetails,
            showModal: false
        };

        this.save = this.save.bind(this);
        // this.handleChange = this.handleChange.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.setChannel = this.setChannel.bind(this);
        this.setModal = this.setModal.bind(this);
    }

    setChannel(channel: ChannelDetails): void {
        this.setState({ channel });
    }

    setModal(modal: boolean): void{
        this.setState({showModal: modal});
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

    hideModal(status: string): void {
        if (status === "ok") {
            this.props.history.push(this.service);
        }
        this.setState({showModal: false});
    }

    goBack(): void {
        this.props.history.push(this.service);
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    save(): void {
        const channel = {...this.state.channel} as any;
        // eslint-disable-next-line functional/immutable-data
        channel.serv_plugin = channel.serv_plugin === '-' ? null : channel.serv_plugin;
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createChannel({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    body: channel
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
                        const message = "detail" in response.right.value ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                        this.toastError(message);
                    }
                }).catch(() => {
                    this.toastError("Operazione non avvenuta a causa di un errore");
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
