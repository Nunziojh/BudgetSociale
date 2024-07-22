import { React, useState, useEffect } from 'react';
import { Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { chunkArray, Finestra } from './Utilities.jsx'
import API from '../API.mjs';
import '../App.css';

// Phase 3
function ResultsLayout(props) {
  const [takenProposals, setTakenProposals] = useState([]);
  const [notTakenProposals, setNotTakenProposals] = useState([]);
  const [showReset, setShowReset] = useState(false);
  const [budget, setBudget] = useState(props.association.Budget)
  const [usedBudget, setUsedBudget] = useState(0)

  useEffect(() => {
    const getResults = async () => {
      try {
        const results = await API.getResults();
        const resultsWithIndex = results.map((item, index) => ({
          ...item,
          initialPosition: index
        }));
        const taken = resultsWithIndex.filter(it => it.IsTaken === 1)
        setTakenProposals(taken);
        setNotTakenProposals(resultsWithIndex.filter(it => it.IsTaken !== 1));
        if(taken.length !== 0){
          setUsedBudget(taken.reduce((sum, item) => sum + item.Budget, 0));
        }
      } catch (error) {
        props.handleErrors(error);
        props.setDirty(true);
      }
    };
    props.setLoading(true);
    getResults();
    props.setLoading(false);
  }, [])

  const handleSubmitReset = async () => {
    API.resetPhases()
      .then(() => { props.setDirty(true) })
      .catch((error) => { props.handleErrors(error) })
  }

  return (
    <>
      <Row>
        <span className="word-spacing" />
        <span className="word-spacing" />
        <h1>{props.association.Name}</h1>
      </Row>
      <Row>
        <h2>Classifica - Budget usato {usedBudget}/{budget}€</h2>
        <span className="word-spacing" />
      </Row>
      <Row>
        <h4>Proposte scelte</h4>
        <hr />
        <span className="word-spacing" />
      </Row>
      {
        takenProposals.length == 0 ?
          <>
            <h5>Non ci sono proposte scelte</h5>
            <span className="word-spacing" />
          </>
          :
          <ResultsGrid proposals={takenProposals} />
        }
      <span className="word-spacing" />
      <Row>
        <h4>Proposte scartate</h4>
        <span className="word-spacing" />
        <hr />
      </Row>
      {
        notTakenProposals.length == 0 ?
          <>
            <h5>Non ci sono proposte scartate</h5>
            <span className="word-spacing" />
          </>
          :
          <ResultsGrid proposals={notTakenProposals} />
      }
      <span className="word-spacing" />
      <Row>
        <span className="word-spacing" />
        <Col>
          <Link to='/associazioni'>
            <Button variant='secondary'>Indietro</Button>
          </Link>
        </Col>
        <span className="word-spacing" />
        {(props.user && props.user.role === "admin") ?
          <Col>
            <Finestra
              tasto="Reset"
              messaggio="Sei sicuro di voler resettare tutto riportando il processo alla fase 0?"
              titolo="Reset"
              handle={handleSubmitReset}
              tipoBottone="primary"
              show={showReset}
              setShow={setShowReset}
              disabilita={false}
            />
          </Col>
          :
          <></>}
      </Row>
    </>
  );
}

const ResultsGrid = ({ proposals }) => {
  const proposalChunks = chunkArray(proposals, 3);

  return (
    <>
      {proposalChunks.map((chunk, rowIndex) => (
        <Row key={rowIndex} className="mb-3">
          {chunk.map((proposal, colIndex) => (
            <Col key={colIndex}>
              <Card className="cardProposal">
                <Row>
                  <Col>
                    <h2>{proposal.initialPosition + 1}° Proposta</h2>
                  </Col>
                </Row>
                <Row>
                  <h4>Descrizione:</h4> <h6>{proposal.Description}</h6>
                </Row>
                <Row>
                  <h4>Budget:</h4> <h6>{proposal.Budget}€</h6>
                </Row>
                <Row>
                  <h4>Autore:</h4> <h6>{proposal.UserID}</h6>
                </Row>
                <Row>
                  <h4>Voti:</h4> <h6>{proposal.totalVotes}</h6>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      ))}
    </>
  );
};

export { ResultsLayout }