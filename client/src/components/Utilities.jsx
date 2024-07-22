import { React } from 'react';
import { Button, Modal } from 'react-bootstrap';

import '../App.css';

function Finestra(props) {

    const handleClose = () => props.setShow(false);
    const handleShow = () => props.setShow(true);

    return (
        <>
            <Button variant={props.tipoBottone} disabled={props.disabilita} onClick={handleShow}>
                {props.tasto}
            </Button>

            <Modal
                show={props.show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{props.titolo}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {props.messaggio}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Annulla
                    </Button>
                    <Button variant="primary" onClick={props.handle}>Conferma</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

const chunkArray = (array, chunkSize) => {
    const results = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        results.push(array.slice(i, i + chunkSize));
    }
    return results;
};

export { Finestra, chunkArray }