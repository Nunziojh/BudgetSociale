import { React, useState, useEffect } from 'react';
import { Row, Col, Button, Form, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { chunkArray, Finestra } from './Utilities.jsx'
import API from '../API.mjs';
import '../App.css';

// Phase 2
function VotesLayout(props) {

    const [preferences, setPreferences] = useState([]);
    const [myProposals, setMyProposals] = useState([]);
    const [remainingProposals, setRemainingProposals] = useState([]);
    const [allProposals, setAllProposals] = useState([]);
    const [modified, setModified] = useState(false);
    const [showPhase, setShowPhase] = useState(false);

    useEffect(() => {
        setModified(true);
    }, []);

    useEffect(() => {
        if (modified && props.user) {
            const getAllProposals = async () => {
                try {
                    let all = await API.getProposalsForVoting();
                    all = all.map(proposal => ({
                        ...proposal,
                        Value: 0
                    }));
                    setAllProposals(all);
                } catch (error) {
                    props.handleErrors(error);
                    props.setDirty(true)
                }
            }
            props.setLoading(true);
            getAllProposals();
            setModified(false);
            props.setLoading(false)
        }
    }, [modified]);

    useEffect(() => {
        if (props.user) {

            const updatedMyProposals = allProposals.filter(proposal => proposal.UserID === props.user.id);
            setMyProposals(updatedMyProposals);


            const getPreferences = async () => {
                try {
                    const myVotes = await API.getVotesByID();
                    if (!myVotes || myVotes == [] || myVotes.length === 0) {
                        setPreferences([])
                        const updatedRemainingProp = allProposals.filter((proposal) => proposal.UserID != props.user.id);
                        setRemainingProposals(updatedRemainingProp);
                    } else {
                        const updatedPreferences = allProposals
                            .map(proposal => {
                                // join dei voti con le proposte
                                const vote = myVotes.find(v => v.PID === proposal.PID);
                                return vote ? {
                                    ...proposal,
                                    Value: vote.Value
                                } : null;
                            })
                            .filter(proposal => proposal !== null)
                        setPreferences(updatedPreferences);
                        if (updatedPreferences.length === 0) {
                            const updatedRemainingProposals = allProposals.filter((proposal) => !updatedMyProposals.some((myProposal) => myProposal.PID === proposal.PID));
                            setRemainingProposals(updatedRemainingProposals)
                        } else {
                            const votedProposalIDs = updatedPreferences.map((pref) => pref.PID);
                            const updatedRemainingProp = allProposals.filter((proposal) =>
                                !updatedMyProposals.some((myProposal) => myProposal.PID === proposal.PID) &&
                                !votedProposalIDs.includes(proposal.PID)
                            );
                            setRemainingProposals(updatedRemainingProp)
                        }
                    }
                } catch (error) {
                    props.handleErrors(error)
                }
            }
            props.setLoading(true);
            getPreferences();
            props.setLoading(false);
        }
    }, [allProposals])

    const handleSubmitVotes = async (PID, value) => {
        try {
            await API.voteProposal(PID, value);
            setModified(true);
        } catch (error) {
            props.handleErrors(error);
        }
    }

    const handleCancelVotes = async (PID) => {
        try {
            await API.deleteVote(PID);
            setModified(true);
        } catch (error) {
            props.handleErrors(error);
        }
    }

    const handleSubmitPhase = async (event) => {
        try {
            event.preventDefault();
            setShowPhase(false);
            await API.upgradeToPhase3();
            props.setDirty(true);
        } catch (error) {
            props.handleErrors(error);
        }
    };


    return (
        <>
            {
                props.user != null ?
                    <>
                        <Row className="g-3 justify-content-center">
                            <span className='word-spacing' />
                            <span className='word-spacing' />
                            <h1>{props.association.Name}</h1>
                        </Row>
                        <Row >
                            <span className='word-spacing' />
                            <h3>Preferenze</h3>
                        </Row>
                        <hr />
                        {
                            preferences == [] ?
                                <>
                                    <span className='word-spacing' />
                                    <h5>Nessun votazione effettuata</h5>
                                    <span className='word-spacing' />
                                </>
                                :
                                <ProposalsGrid
                                    proposals={preferences}
                                    handleCancelVotes={handleCancelVotes}
                                    handleSubmitVotes={handleSubmitVotes}
                                    toShow={true}
                                />
                        }
                        <Row>
                            <span className='word-spacing' />
                            <h3>Mie proposte</h3>
                        </Row>
                        <hr />
                        {
                            myProposals == [] ?
                                <>
                                    <span className='word-spacing' />
                                    <h5>Nessun proposta presentata</h5>
                                    <span className='word-spacing' />
                                </>
                                :
                                <Row>
                                    {myProposals.map((proposal, index) => (
                                        <Col key={index}>
                                            <Card className="cardProposal">
                                                <Row>
                                                    <Col>
                                                        <h2>Proposta {index + 1}</h2>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <h4>Descrizione:</h4> <h6>{proposal.Description}</h6>
                                                </Row>
                                                <Row>
                                                    <h4>Budget:</h4> <h6>{proposal.Budget}€</h6>
                                                </Row>
                                            </Card>
                                        </Col>
                                    ))}
                                    <span className='word-spacing' />
                                </Row>
                        }
                        <Row>
                            <span className='word-spacing' />
                            <h3>Proposte rimanenti</h3>
                        </Row>
                        <hr />
                        {
                            remainingProposals == [] ?
                                <>
                                    <span className='word-spacing' />
                                    <h5>Nessun proposta presente</h5>
                                    <span className='word-spacing' />
                                </>
                                :
                                <ProposalsGrid
                                    proposals={remainingProposals}
                                    handleCancelVotes={handleCancelVotes}
                                    handleSubmitVotes={handleSubmitVotes}
                                    toShow={false}
                                />
                        }
                        {
                            props.user.role == "admin" ?
                                <Row>
                                    <Col className="g-3 justify-content-center">
                                        <Link to="/associazioni">
                                            <Button variant="secondary">Indietro</Button>
                                        </Link>
                                        <span className="button-spacing" />
                                        <Finestra
                                            tasto="Termina processo"
                                            messaggio="Sei sicuro di voler terminare il processo di votazione?"
                                            titolo="Termina processo"
                                            handle={handleSubmitPhase}
                                            tipoBottone="primary"
                                            show={showPhase}
                                            setShow={setShowPhase}
                                            disabilita={false}
                                        />
                                    </Col>
                                </Row>
                                :
                                <>
                                    <Row>
                                        <Col className="g-3 justify-content-center">
                                            <Link to="/associazioni">
                                                <Button variant="secondary">Indietro</Button>
                                            </Link>
                                        </Col>
                                    </Row>
                                </>
                        }
                    </>
                    :
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
            }
        </>
    );
}

const ProposalsGrid = ({ proposals, handleCancelVotes, handleSubmitVotes, toShow }) => {
    const proposalChunks = chunkArray(proposals, 3);

    return (
        <>
            {proposalChunks.map((chunk, rowIndex) => (
                <Row key={rowIndex} className="mb-3">
                    {chunk.map((proposal, colIndex) => (
                        <Col key={colIndex}>
                            <VotesForm
                                proposal={proposal}
                                index={rowIndex * 3 + colIndex}
                                handleCancel={handleCancelVotes}
                                handleSubmitVotes={handleSubmitVotes}
                                toShow={toShow}
                            />
                        </Col>
                    ))}
                </Row>
            ))}
        </>
    );
};

function VotesForm(props) {
    const [vote, setVote] = useState(0)

    return (
        props.toShow
            ?
            <Card className="cardProposal">
                <Row>
                    <h4>Descrizione:</h4> <h6>{props.proposal.Description}</h6>
                </Row>
                <Row>
                    <h4>Budget:</h4> <h6>{props.proposal.Budget}€</h6>
                </Row>
                <Row>
                    <h4>Voto:</h4> <h6>{props.proposal.Value}</h6>
                </Row>
                <Row>
                    <Col>
                        <Button variant="danger" onClick={() => { props.handleCancel(props.proposal.PID) }}><i className="bi bi-trash"></i></Button>
                    </Col>
                </Row>
            </Card>
            :
            <Card>
                <Row>
                    <h4>Descrizione:</h4> <h6>{props.proposal.Description}</h6>
                </Row>
                <Row>
                    <h4>Budget:</h4> <h6>{props.proposal.Budget}€</h6>
                </Row>
                <Row>
                    <Form>
                        <Form.Group className='mb-3'>
                            <Row>
                                <Form.Label className="h4">Voto: </Form.Label>
                                <Form.Control type="number" name="vote" min={0} max={3} value={vote} onChange={(e) => { setVote(e.target.value) }} />
                            </Row>
                        </Form.Group>
                    </Form>
                </Row>
                <Row>
                    <Col>
                        <Button variant="primary" onClick={() => { props.handleSubmitVotes(props.proposal.PID, vote); setVote(0); }} disabled={(vote < 1 || vote > 3)}>Vota</Button>
                    </Col>
                </Row>
            </Card>
    );
}

export { VotesLayout }