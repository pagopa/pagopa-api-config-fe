import React from 'react';
import {Button} from 'react-bootstrap';
import {MsalContext} from "@azure/msal-react";
import ConfirmationModal from "../../components/ConfirmationModal";
import {apiClient} from "../../util/apiClient";
import {toast} from "react-toastify";
import {loginRequest} from "../../authConfig";


interface IProps {
}

interface IState {
    isLoading: boolean;
    showRefreshModal: boolean;
    configToRefresh: {
        name: string;
        param: string;
    }
}

export default class RefreshConfigPage extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            isLoading: false,
            showRefreshModal: false,
            configToRefresh: {
                name: "",
                param: "",
            }
        };
    }

    handleRefresh(configName: string, configParam: string) {
        this.setState({showRefreshModal: true});
        this.setState({configToRefresh: {
                name: configName,
                param: configParam
            }
        });
    }

    hideRefreshModal = (status: string) => {
        if (status === "ok") {
            this.context.instance.acquireTokenSilent({
                ...loginRequest,
                account: this.context.accounts[0]
            })
                .then((response: any) => {
                    apiClient.getRefreshConfig({
                        Authorization: `Bearer ${response.idToken}`,
                        ApiKey: "",
                        configtype: this.state.configToRefresh.param
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
        this.setState({showRefreshModal: false});
        this.setState({configToRefresh: {
            name: "",
            param: ""
        }});
    };

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, {theme: "colored"});
    }

    render(): React.ReactNode {
        const showRefreshModal = this.state.showRefreshModal;
        const configToRefresh = this.state.configToRefresh;

        return (
            <div className="container-fluid configuration">
                <div className="row">
                    <div className="col-md-10 mb-3">
                        <h2>Refresh Configuration</h2>
                    </div>
                </div>

                <div className="row">
                    <div className={"col-md-12"}>
                        <p>In questa sezione è possibile effettuare il refresh delle configurazioni del nodo. Le seguenti azioni innescano l'aggiornamento delle istanze in memoria. </p>
                        <p>Al fine di non creare incosistenze occorre usare tali azioni solo quando necessario.</p>
                    </div>
                </div>

                <div className="row mt-5">
                    <div className={"col-md-4"}>
                        <span className="font-weight-bold">Dominio EC: </span>
                        <span>configurazione delle tabelle PA, Stazioni</span>
                    </div>
                    <div className={"col-md-4"}>
                        <Button onClick={() => this.handleRefresh('PA e Stazioni', 'PA')}>Refresh</Button>
                        {/* eslint-disable-next-line functional/immutable-data */}
                    </div>
                </div>

                <div className="row mt-3">
                    <div className={"col-md-4"}>
                        <span className="font-weight-bold">Dominio PSP: </span>
                        <span>configurazione delle tabelle PSP, Canali</span>
                    </div>
                    <div className={"col-md-4"}>
                        <Button onClick={() => this.handleRefresh('PSP e Canali', 'PSP')}>Refresh</Button>
                        {/* eslint-disable-next-line functional/immutable-data */}
                    </div>
                </div>
                <ConfirmationModal show={showRefreshModal} handleClose={this.hideRefreshModal}>
                        <p>Sei sicuro di voler avviare il refresh della seguente configurazione?</p>
                        <ul>
                            <li>{configToRefresh.name}</li>
                        </ul>
                </ConfirmationModal>
            </div>
        );
    }
}
