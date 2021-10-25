import React from "react";
import { Modal, Button } from 'react-bootstrap';

// const ConfirmationModal = ({ handleClose, show, children }: {handleClose: any, show: any, children: any}) => (
//             <Modal show={show} onHide={() => handleClose("ko")}>
//                 <Modal.Header closeButton>
//                     <Modal.Title>Attenzione</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {children}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => handleClose("ko")}>
//                         Chiudi
//                     </Button>
//                     <Button variant="primary" onClick={() => handleClose("ok")}>
//                         Conferma
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
//     );
// export default ConfirmationModal;

interface IProps {
    show: boolean;
    // eslint-disable-next-line @typescript-eslint/ban-types
    handleClose: Function;
    children?: React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {}

export default class ConfirmationModal extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }

    render(): React.ReactNode {
        return (
            <Modal show={this.props.show} onHide={() => this.props.handleClose("ko")}>
                <Modal.Header closeButton>
                    <Modal.Title>Attenzione</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {this.props.children}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => this.props.handleClose("ko")}>
                        Chiudi
                    </Button>
                    <Button variant="primary" onClick={() => this.props.handleClose("ok")}>
                        Conferma
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
