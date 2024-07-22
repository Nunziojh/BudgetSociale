import { React, useState } from 'react';
import { Row, Col, Button, Form, Card, CardText  } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Finestra } from './Utilities';
import API from '../API.mjs';
import '../App.css';

// Phase 0
function BudgetLayout(props){
    const [budget, setBudget] = useState(props.association.Budget);
    const [showBudget, setShowBudget] = useState(false);
    const [showPhase, setShowPhase] = useState(false);
    
    const handleBudgetValue = (value) => {
      if (value === '') {
        setBudget(0);
      } else if (budget === 0) {
        setBudget(value.slice(-1));
      } else {
        setBudget(value);
      }
    }
    const handleSubmitBudget = async (event) => {
      try{
        event.preventDefault();
        setShowBudget(false);
        await API.setBudget(budget);
        props.setDirty(true);
      }catch(error){
        props.handleErrors(error);
        props.setDirty(true);
      }
    };
    const handleSubmitPhase = async (event) => {
      try{
        event.preventDefault();
        setShowPhase(false);
        await API.setBudget(budget);
        await API.upgradeToPhase1();
        props.setDirty(true);
      }catch(error){
        props.handleErrors(error);
      }
    };
  
    return (
        <Row className="g-3 justify-content-center">
            <Col >
            { props.user != null && props.user.role == 'admin' 
            ?
            <Card>
                <Card.Body>
                <Card.Title><h2>{props.association.Name}</h2></Card.Title>
                  <div>
                  <Form onSubmit={handleSubmitPhase}>
                    <Form.Group className='mb-3'>
                      <Form.Label className="h4">Budget(€): </Form.Label>
                      <Form.Control type="number" name="budget" min={0} value={budget} onChange={(e) => {handleBudgetValue(e.target.value)}}/>
                    </Form.Group>
                    <Finestra tasto="Imposta Budget" messaggio={`Sei sicuro di voler impostare ${budget}€ come budget?`} titolo="Scelta Budget" handle={handleSubmitBudget} tipoBottone="primary" show={showBudget} setShow={setShowBudget} disabilita={false} />
                    <span className="button-spacing" />
                    <Finestra tasto="Fase successiva" messaggio={`Sei sicuro di voler passare alla fase successiva con budget ${budget}€?`} titolo="Fase successiva" handle={handleSubmitPhase} tipoBottone="primary" show={showPhase} setShow={setShowPhase} disabilita={!(props.user.role == 'admin')} />
                    <Row>
                      <span className="word-spacing" />
                      <Link to='/associazioni'>
                        <Button variant='secondary'>Indietro</Button>
                      </Link>
                    </Row>
                  </Form> 
                  </div>
                </Card.Body>
              </Card>
            :
              <Card>
                <Card.Body>
                  <Card.Title><h2>{props.association.Name}</h2></Card.Title>
                  <CardText> La fase di definizione delle proposte è ancora chiusa</CardText>
                  <CardText>
                    <Link to='/associazioni'>
                      <Button variant='secondary'>Indietro</Button>
                    </Link>
                  </CardText>
                </Card.Body>
              </Card>
            }
            </Col>
        </Row>
    );
  }

  export { BudgetLayout }