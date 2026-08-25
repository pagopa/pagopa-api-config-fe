import React from 'react';
import CdsServices from './CdsServices';

/* eslint-disable @typescript-eslint/no-empty-interface */
interface IProps {
}

const LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

export default class CDS extends React.Component<IProps> {

    render(): React.ReactNode {
        return (
            <div className="container-fluid configuration">
                <div className="row">
                    <div className="col-md-10 mb-3">
                        <h2>Catalogo Dati Servizi</h2>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12 mb-4">
                        <h4>Servizio</h4>
                        <CdsServices/>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12 mb-4">
                        <h4>Soggetto</h4>
                        <p>{LOREM_IPSUM}</p>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12 mb-4">
                        <h4>Associazione Soggetto - Servizio</h4>
                        <p>{LOREM_IPSUM}</p>
                    </div>
                </div>
            </div>
        );
    }
}
