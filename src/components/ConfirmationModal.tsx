import React from "react";
import { Modal, Button } from 'react-bootstrap';

const ConfirmationModal = ({ handleClose, show, children }) => (
            <Modal show={show} onHide={() => handleClose("ko")}>
                <Modal.Header closeButton>
                    <Modal.Title>Attenzione</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {children}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => handleClose("ko")}>
                        Chiudi
                    </Button>
                    <Button variant="primary" onClick={() => handleClose("ok")}>
                        Conferma
                    </Button>
                </Modal.Footer>
            </Modal>
    );
export default ConfirmationModal;

