import React from 'react';
import {CdsSoggetto} from '../../../generated/api/CdsSoggetto';
import CdsServices from './CdsServices';
import CdsSubjects from './CdsSubjects';
import CdsSubjectServices from './CdsSubjectServices';

/* eslint-disable @typescript-eslint/no-empty-interface */
interface IProps {
}

interface IState {
    selectedSubject?: CdsSoggetto;
}

export default class CDS extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedSubject: undefined
        };

        this.handleSelectSubject = this.handleSelectSubject.bind(this);
    }

    handleSelectSubject(subject: CdsSoggetto) {
        this.setState({selectedSubject: subject});
    }

    render(): React.ReactNode {
        const {selectedSubject} = this.state;

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
                        <CdsSubjects onSelectSubject={this.handleSelectSubject}
                                     selectedSubjectId={selectedSubject?.id}/>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12 mb-4">
                        <h4>Associazione Soggetto - Servizio</h4>
                        {
                            selectedSubject
                                ? <CdsSubjectServices subject={selectedSubject}/>
                                : <p>Seleziona su soggeto per vedere i relativi servizi</p>
                        }
                    </div>
                </div>
            </div>
        );
    }
}

