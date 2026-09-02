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

// eslint-disable-next-line functional/immutable-data
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
        if ((window as any).isFlutterInitialized === true) {
            // eslint-disable-next-line no-console
            console.warn("Rilevata istanza Flutter precedente. Ricarico la pagina per un avvio pulito.");
            window.location.reload();
            return; 
        }

        
        // eslint-disable-next-line functional/immutable-data
        (window as any).isFlutterInitialized = true;
        
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                this.setState({ jwt: response.idToken });
            })
            .catch((error: any) => {
                // eslint-disable-next-line no-console
                console.error("Failed to acquire token silently", error);
            });    }



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
