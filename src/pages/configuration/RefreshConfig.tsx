import React from 'react';
import {Table, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {FaExclamationTriangle, FaRedo, FaSpinner} from "react-icons/fa";
import {MsalContext} from "@azure/msal-react";
import {toast} from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import {apiClient} from "../../util/apiClient";
import {loginRequest} from "../../authConfig";

/* eslint-disable @typescript-eslint/no-empty-interface */
interface IProps {
}

interface IState {
    isLoading: boolean;
    configTypes: any;
    configToRefresh: {
        domain: string;
        description: string;
        param: string;
    };
    refresh: boolean;
}

export default class RefreshConfigPage extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            isLoading: false,
            configTypes: [],
            configToRefresh: {
                domain: "",
                description: "",
                param: ""
            },
            refresh: false
        };

        this.handleRefresh = this.handleRefresh.bind(this);
    }

    componentDidMount(): void {
        this.setState({isLoading: true});
        this.getData();
        this.setState({isLoading: false});
    }

    handleRefresh(configDomain: string, configDescription: string, configParam: string) {
        this.setState({
            configToRefresh: {
                domain: configDomain,
                description: configDescription,
                param: configParam
            },
            refresh: true
        });
    }

    hideRefreshModal = (status: string) => {
        const param = this.state.configToRefresh.param;
        if (status === "ok") {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    apiClient.getRefreshConfig({
                        ApiKey: "",
                        Authorization: `Bearer ${response.idToken}`,
                        configtype: param
                    })
                        .then((res: any) => {
                            if (res.right.status === 200) {
                                toast.info("Refresh avvenuto con successo");
                            } else {
                                this.toastError(res.right.value.detail);
                            }
                        })
                        .catch(() => {
                            toast.error("Operazione non avvenuta a causa di un errore", {theme: "colored"});
                        });
                });
        }
        this.setState({refresh: false});
        this.setState({configToRefresh: {
            domain: "",
            description: "",
            param: ""
        }});
    };

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    getData() {
        this.setState({
            configTypes: [{
                domain: "Globale",
                description: "configurazione globale del nodo",
                param: "GLOBAL"
            }]
        });
    }

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const showRefreshModal = this.state.refresh;
        const configToRefresh = this.state.configToRefresh;
        const configTypes: any = [];

        this.state.configTypes.map((configuration: any) => {
            const index = String(configuration.domain);
            const code = (
                <tr key={configuration.domain}>
                    <td className="key-td-width">{configuration.domain}</td>
                    <td className="description-td-width text-left">
                        {configuration.description}
                    </td>
                    <td className="text-right">
                        <>
                        <OverlayTrigger placement="top" 
                                        overlay={<Tooltip id={`tooltip-edit-${index}`}>Refresh</Tooltip>}>
                            <FaRedo role="button" className="mr-1" 
                                    onClick={() => this.handleRefresh(configuration.domain, configuration.description, configuration.param)}/>
                        </OverlayTrigger>
                        </>
                    </td>
                </tr>
            );
            configTypes.push(code);
        });

        return (
            <div className="container-fluid configuration">
                <div className="row">
                    <div className="col-md-10 mb-3">
                        <h2>Refresh Configuration</h2>
                    </div>
                </div>

                <div className="row">
                    <div className={"col-md-12"}>
                        {/* eslint-disable-next-line react/no-unescaped-entities */}
                        <p>In questa sezione è possibile effettuare il refresh delle configurazioni del nodo. Le seguenti azioni innescano il caricamento e l'eventuale aggiornamento delle istanze in memoria. </p>
                        <p className="alert alert-warning">
                                <FaExclamationTriangle/> Usare tali azioni solo quando necessario.
                        </p>
                    </div>
                </div>
                {isLoading && (<FaSpinner className="spinner"/>)}
                {!isLoading && (
                    <>
                    <Table hover responsive size="sm">
                        <thead>
                        <tr>
                            <th className="key-td-width">Dominio</th>
                            <th className="description-td-width text-left">Descrizione</th>
                            <th className="buttons-td-width"/>
                        </tr>
                        </thead>
                        <tbody>
                            {configTypes}
                        </tbody>
                    </Table>
                    </>
                )}
                <ConfirmationModal show={showRefreshModal} handleClose={this.hideRefreshModal}>
                        <p>Sei sicuro di voler avviare il refresh della seguente configurazione?</p>
                        <ul>
                            <li>{configToRefresh.domain}: {configToRefresh.description}</li>
                        </ul>
                </ConfirmationModal>
            </div>
        );
    }
}
