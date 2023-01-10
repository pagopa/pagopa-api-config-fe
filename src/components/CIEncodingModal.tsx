import React from "react";
import {Modal, Button, Table, Tooltip, OverlayTrigger} from 'react-bootstrap';
import {FaEye} from "react-icons/fa";

interface IProps {
    show: boolean;
    // eslint-disable-next-line @typescript-eslint/ban-types
    handleClose: Function;
    encoding: string;
    creditorInstitutions: any;

    history: {
        push(url: string): void;
    };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
}

export default class CITableModal extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }

    goto(code: string) {
        this.props.history.push("/creditor-institutions/" + code);
    }

    render(): React.ReactNode {
        return (
                <Modal show={this.props.show} onHide={() => this.props.handleClose("ko")} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Enti Creditori</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                    <span>Di seguito la lista degli Enti Creditori avente Il Codice Postale <span
                            className="font-weight-bold">{this.props.encoding}</span>
                    </span>
                        <span>
                        {
                                (this.props.creditorInstitutions.length > 1) &&
                                <div className={"text-danger"}>Attenzione! Più Enti Creditori hanno lo stesso codice postale</div>
                        }
                    </span>
                        <Table hover responsive size="sm">
                            <thead>
                            <tr>
                                <th className="fixed-td-width">Ente creditore</th>
                                <th className="fixed-td-width">Codice</th>
                                <th/>
                            </tr>
                            </thead>
                            <tbody>
                            {this.props.creditorInstitutions.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td>{item.business_name}</td>
                                        <td>{item.creditor_institution_code}</td>
                                        <td className="text-right">
                                            <OverlayTrigger placement="top"
                                                            overlay={<Tooltip
                                                                    id={`tooltip-details-${index}`}>Visualizza</Tooltip>}>
                                                <FaEye role="button" className="mr-3"
                                                       onClick={() => this.goto(item.creditor_institution_code)}/>
                                            </OverlayTrigger>
                                        </td>
                                    </tr>
                            ))
                            }
                            </tbody>
                        </Table>


                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => this.props.handleClose("ko")}>
                            Chiudi
                        </Button>
                    </Modal.Footer>
                </Modal>
        );
    }
}
