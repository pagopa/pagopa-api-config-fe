import React from 'react';
import { MsalContext } from "@azure/msal-react";
import { loginRequest } from "../../authConfig";
import { getConfig } from '../../util/config';


interface IProps {
    history: {
        push(url: string): void;
    };
}

interface IState {
    jwt: string | null;
}

(window as any).isFlutterInitialized = (window as any).isFlutterInitialized || false;

export default class PaymentMedothodsPage extends React.Component<IProps, IState> {
    static contextType = MsalContext;


    constructor(props: IProps) {
        super(props);


        this.state = {
            jwt: null,
        };


    }


    componentDidMount(): void {
        console.log("React Component: componentDidMount");
        console.log("Stato Flutter Inizializzato:", (window as any).isFlutterInitialized);

        // --- LA LOGICA CHIAVE ---
        // Se isFlutterInitialized è true, significa che siamo tornati
        // su questa pagina dopo averla già visitata. L'engine di Flutter
        // è in uno stato "sporco".
        if ((window as any).isFlutterInitialized === true) {
            console.warn("Rilevata istanza Flutter precedente. Ricarico la pagina per un avvio pulito.");
            // Forza un ricaricamento completo della pagina
            window.location.reload();
            // Non eseguire altro codice, la pagina si sta ricaricando
            return; 
        }

        // Se siamo qui, è la prima volta che carichiamo la pagina
        // o è il caricamento dopo il reload. Procediamo normalmente.
        console.log("Prima visita o dopo ricaricamento. Avvio normale.");
        
        // Marchiamo che stiamo per inizializzare Flutter
        (window as any).isFlutterInitialized = true;
        
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                this.setState({ jwt: response.idToken });
            })
            .catch((error: any) => {
                console.error("Failed to acquire token silently", error);
            });    }

    componentWillUnmount(): void {
        console.log("React Component: componentWillUnmount");
        // Quando lasciamo la pagina, non resettiamo il flag.
        // Vogliamo che rimanga `true` per attivare il reload al nostro ritorno.
    }



    render(): React.ReactNode {
        const jwt = this.state.jwt;
        const host = getConfig("APICONFIG_HOST") as string;

        return (
            <div className="flutter-container">
                    {jwt && (
                    <payment-methods-manager
                        host={host}
                        jwt={jwt} >
                    </payment-methods-manager>
                )}
            </div>
        );
    }
}
