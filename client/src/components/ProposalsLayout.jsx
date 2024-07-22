import { React, useState, useEffect } from 'react';
import { Row, Col, Button, Form, Card } from 'react-bootstrap';
import { PlusCircle } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom';
import { Finestra } from './Utilities.jsx'
import API from '../API.mjs';
import '../App.css';

// Phase 1
function ProposalsLayout(props) {

    const [proposals, setProposals] = useState([])
    const [showPhase, setShowPhase] = useState(false);
    const [modified, setModified] = useState(false)
    const [budget, setBudget] = useState(props.association.Budget);

    useEffect(() => {
        if (props.user != null) {
            setModified(true)
        }
    }, []);

    useEffect(() => {
        const getProposals = async () => {
            try {
                const p = await API.getProposalsByID()
                setProposals(p.proposals)
            } catch (error) {
                props.handleErrors(error)
                props.setDirty(true)
            }
        }
        if (props.user != null) {
            getProposals()
            setModified(false)
        }
    }, [modified]);

    const handleCancelProposal = async (index) => {
        try {
            await API.deleteProposal(proposals[index].PID)
            setProposals(proposals.splice(index, 1))
            setModified(true)
        } catch (error) {
            props.handleErrors(error)
        }
    }

    const handleSubmitProposal = async (description, budget) => {
        try {
            let newProposal = await API.createProposal(description, budget)
            setProposals([...proposals, newProposal])
            setModified(true)
        } catch (error) {
            props.handleErrors(error)
        }
    }

    const handleEditProposal = async (description, budget, index) => {
        try {
            let editedProposals = proposals
            editedProposals[index] = await API.editProposal(proposals[index].PID, budget, description)
            setProposals(editedProposals)
            setModified(true)
        } catch (error) {
            props.handleErrors(error)
        }
    }

    const handleSubmitPhase = async (event) => {
        try {
            event.preventDefault();
            setShowPhase(false);
            await API.upgradeToPhase2();
            props.setDirty(true);
        } catch (error) {
            props.handleErrors(error);
        }
    };

    return (
        <>
            {props.user != null ? (
                <>
                    <Row className="g-3 justify-content-center">
                        <span className="word-spacing" />
                        <h1>Proposte:</h1>
                    </Row>
                    <hr />
                    <Row xs={1}
                        md={proposals.length < 3 ? proposals.length + 1 : proposals.length}
                        className="g-3 justify-content-center">
                        {proposals.map((proposal, index) => (
                            <Col key={index}>
                                <ProposalForm
                                    proposal={proposal}
                                    index={index}
                                    handleEdit={handleEditProposal}
                                    handleCancel={handleCancelProposal}
                                    handleSubmitProposal={handleSubmitProposal}
                                />
                            </Col>
                        ))}
                        {proposals.length < 3 && (
                            <Col key={proposals.length}>
                                <ProposalForm
                                    proposal={null}
                                    index={proposals.length}
                                    handleEdit={handleEditProposal}
                                    handleCancel={handleCancelProposal}
                                    handleSubmitProposal={handleSubmitProposal}
                                />
                            </Col>
                        )}
                    </Row>
                    <Row className="g-3 justify-content-center">
                        <span className="word-spacing" />
                        <h5>Budget a disposizione: {budget}€</h5>
                    </Row>
                    {props.user.role === 'admin' ? (
                        <Row>
                            <Col className="g-3 justify-content-center">
                                <Link to="/associazioni">
                                    <Button variant="secondary">Indietro</Button>
                                </Link>
                                <span className="button-spacing" />
                                <Finestra
                                    tasto="Fase successiva"
                                    messaggio="Sei sicuro di voler passare alla fase successiva?"
                                    titolo="Fase successiva"
                                    handle={handleSubmitPhase}
                                    tipoBottone="primary"
                                    show={showPhase}
                                    setShow={setShowPhase}
                                    disabilita={false}
                                />
                            </Col>
                        </Row>
                    ) : (
                        <></>
                    )}
                </>
            ) : (
                <Row className="g-3 justify-content-center">
                    <Card>
                        <Card.Body>
                            <Card.Title>
                                <h2>{props.association.Name}</h2>
                            </Card.Title>
                            <h5>La fase di definizione delle proposte è in corso.</h5>
                            <Link to="/associazioni">
                                <Button variant="secondary">Indietro</Button>
                            </Link>
                        </Card.Body>
                    </Card>
                </Row>
            )}
        </>
    );
}

function ProposalForm(props) {
    const [toEdit, setToEdit] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [budget, setBudget] = useState(props.proposal != null ? props.proposal.Budget : 0);
    const [description, setDescription] = useState(props.proposal != null ? props.proposal.Description : '');

    const handleBudgetValue = (value) => {
        if (value === '') {
            setBudget(0);
        } else if (budget === 0) {
            setBudget(value.slice(-1));
        } else {
            setBudget(value);
        }
    }

    useEffect(() => {
        if (toEdit) {
            setDescription(props.proposal.Description)
            setBudget(props.proposal.Budget)
        }
    }, [toEdit]);

    return (
        <>
            {
                toEdit == true ?
                    <Card className="cardProposal">
                        <Form>
                            <h2>Proposta {props.index + 1}</h2>
                            <Form.Group className='mb-3'>
                                <Row>
                                    <Form.Label className="h4">Descrizione: </Form.Label>
                                    <Form.Control type="text" name="description" value={description} onChange={(e) => { setDescription(e.target.value) }} />
                                </Row>
                            </Form.Group>
                            <Form.Group className='mb-3'>
                                <Row>
                                    <Form.Label className="h4">Budget(€): </Form.Label>
                                    <Form.Control type="number" name="budget" min={0} value={budget} onChange={(e) => { handleBudgetValue(e.target.value) }} />
                                </Row>
                            </Form.Group>
                            <Button variant="primary" onClick={() => { props.handleEdit(description, budget, props.index); setToEdit(false) }} disabled={description == ''}>Modifica proposta</Button>
                        </Form>
                    </Card>
                    : props.proposal != null ?
                        <Card className="cardProposal">
                            <Row>
                                <Col>
                                    <h2>Proposta {props.index + 1}</h2>
                                </Col>
                            </Row>
                            <Row>
                                <h4>Descrizione:</h4> <h6>{props.proposal.Description}</h6>
                            </Row>
                            <Row>
                                <h4>Budget:</h4> <h6>{props.proposal.Budget}€</h6>
                            </Row>
                            <Row>
                                <Col>
                                    <Button varaiant="secondary" onClick={() => { setToEdit(true) }} ><i className="bi bi-pencil-square"></i></Button>
                                    <span className="button-spacing" />
                                    <Button variant="danger" onClick={() => { props.handleCancel(props.index) }}><i className="bi bi-trash"></i></Button>
                                </Col>
                            </Row>
                        </Card>
                        : !showForm ?
                            <Card className="cardProposal text-center">
                                <Button onClick={() => { setShowForm(true) }}
                                    variant="secondary"
                                    className="w-100 h-100 custom-button-style">
                                    <PlusCircle />
                                </Button>
                            </Card>
                            :
                            <Card className="cardProposal">
                                <Form>
                                    <h2>Proposta {props.index + 1}</h2>
                                    <Form.Group className='mb-3'>
                                        <Row>
                                            <Form.Label className="h4">Descrizione: </Form.Label>
                                            <Form.Control type="text" name="description" value={description} onChange={(e) => { setDescription(e.target.value) }} />
                                        </Row>
                                    </Form.Group>
                                    <Form.Group className='mb-3'>
                                        <Row>
                                            <Form.Label className="h4">Budget(€): </Form.Label>
                                            <Form.Control type="number" name="budget" min={0} value={budget} onChange={(e) => { handleBudgetValue(e.target.value) }} />
                                        </Row>
                                    </Form.Group>
                                    <Button variant="primary" onClick={() => { props.handleSubmitProposal(description, budget); setToEdit(false) }} disabled={description == ''}>Manda proposta</Button>
                                </Form>
                            </Card>
            }
        </>
    );
}

export { ProposalsLayout }