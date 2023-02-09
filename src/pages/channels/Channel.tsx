import React from "react";
import {MsalContext} from "@azure/msal-react";
import axios, {AxiosRequestConfig} from "axios";
import {toast} from "react-toastify";
import {loginRequest} from "../../authConfig";
import {ChannelDetails, Payment_modelEnum} from "../../../generated/api/ChannelDetails";
import {PaymentType} from "../../../generated/api/PaymentType";
import {getConfig} from "../../util/config";
import { getChannel, getPaymentTypeLegend, getPaymentTypeList, getPspList } from "./Services";
import ChannelView from "./ChannelView";

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
    channel: ChannelDetails;
    paymentTypeList: [];
    paymentTypeLegend: any;
    pspList: [];
    edit: boolean;
}

export default class Channel extends React.Component<IProps, IState> {
    static contextType = MsalContext;
    private pspService: string = '/payment-service-providers';

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
            channel: {
                channel_code: "",
                enabled: false,
                broker_psp_code: "",
                password: "",
                new_password: "",
                protocol: "",
                ip: "",
                port: 80,
                service: "",
                proxy_enabled: false,
                proxy_host: "",
                proxy_port: 80,
                target_host: "",
                target_port: 443,
                target_path: "",
                thread_number: 2,
                timeout_a: 15,
                timeout_b: 30,
                timeout_c: 120,
                primitive_version: 1,
                new_fault_code: false,
                redirect_protocol: "",
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
                serv_plugin: "-",
                flag_io: false,
                agid: false,
                description: "",
            } as unknown as ChannelDetails,
            paymentTypeList: [],
            paymentTypeLegend: {},
            pspList: [],
            edit: false
        };

        this.setChannel = this.setChannel.bind(this);
        this.setPaymentTypeList = this.setPaymentTypeList.bind(this);
        this.setPaymentTypeLegend = this.setPaymentTypeLegend.bind(this);
        this.setPspList = this.setPspList.bind(this);
        this.handlePspDetails = this.handlePspDetails.bind(this);
        this.downloadCsv = this.downloadCsv.bind(this);
    }

    setChannel(channel: ChannelDetails): void {
        this.setState({ channel });
    }

    setPaymentTypeList(paymentTypeList: []){
        this.setState({paymentTypeList});
    }

    setPaymentTypeLegend(paymentTypeLegend: any){
        this.setState({paymentTypeLegend});
    }

    setPspList(pspList: []){
        this.setState({pspList});
    }

    handleEdit() {
        this.props.history.push("/channels/" + String(this.props.match.params.code) + "?edit");
    }

    handlePspDetails(code: string) {
        this.props.history.push(this.pspService + "/" + code);
    }

    downloadCsv() {
        const baseUrl = getConfig("APICONFIG_HOST") as string;
        const basePath = getConfig("APICONFIG_BASEPATH") as string;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        }).then((response: any) => {
            const config = {
                headers: {
                    Authorization: `Bearer ${response.idToken}`
                },
                responseType: 'blob'
            } as AxiosRequestConfig;
            const anchor = document.createElement("a");
            document.body.appendChild(anchor);
            const url = `${String(baseUrl)}${String(basePath)}/channels/${this.state.channel.channel_code}/paymentserviceproviders/csv`;
            axios.get(url, config)
                .then((res: any) => {
                    if (res.data.size > 1) {
                        const objectUrl = window.URL.createObjectURL(res.data);
                        // eslint-disable-next-line functional/immutable-data
                        anchor.href = objectUrl;
                        // eslint-disable-next-line functional/immutable-data
                        anchor.download = this.state.channel.channel_code + '-psp.csv';
                        anchor.click();
                        window.URL.revokeObjectURL(objectUrl);
                    } else {
                        toast.warn("Problemi nella generazione del file CSV richiesto.", {theme: "colored"});
                    }
                })
                .catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                });
        });
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({code, isLoading: true});
        Promise.all([getChannel(this.context, code), getPaymentTypeLegend(this.context),
            getPaymentTypeList(this.context, code), getPspList(this.context, code)])
        .then((result: any) => {
            const channel = {...this.state.channel, ...result[0]} as ChannelDetails;
            this.setChannel(channel);
            this.setPaymentTypeList(result[2].payment_types);
            const paymentTypeLegend = {} as any;
            result[1].payment_types.forEach((pt: PaymentType) => {
                // eslint-disable-next-line functional/immutable-data
                paymentTypeLegend[pt.payment_type] = pt.description;
            });
            this.setPaymentTypeLegend(paymentTypeLegend);
            this.setPspList(result[3].payment_service_providers as []);
            this.setState({isError: false});
        }).catch(() => {
            this.setState({isError: true});
        });
        this.setState({isLoading: false});
    }

    render(): React.ReactNode {
        return (
            <ChannelView channel={this.state.channel} 
                setChannel={this.setChannel}
                showModal={false}
                paymentTypeList={this.state.paymentTypeList}
                paymentTypeLegend={this.state.paymentTypeLegend}
                isLoading={this.state.isLoading}
                isError={this.state.isError}
                history={this.props.history}
                readOnly={true}
                showPaymentTypeList={true}
                pspList={this.state.pspList}
                handlePspDetails={this.handlePspDetails}
                downloadCsv={this.downloadCsv}
            />
        );
    } 
}
