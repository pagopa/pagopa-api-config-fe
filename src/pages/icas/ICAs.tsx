import React from 'react';
import {Breadcrumb} from 'react-bootstrap';
import {Props} from "io-ts";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {}

export default class Ica extends React.Component<IProps, IState> {

    constructor(props: Props) {
        super(props);
    }


    render(): React.ReactNode {

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item active>Informativa Conto Accredito</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <h2>Informativa Conto Accredito</h2>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        todo
                    </div>
                </div>
            </div>

        );
    }
}
