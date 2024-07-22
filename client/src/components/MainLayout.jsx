import { React } from 'react';
import { Row, Col, Button, Spinner, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BudgetLayout } from './BudgetLayout.jsx'
import { ProposalsLayout } from './ProposalsLayout.jsx'
import { VotesLayout } from './VotesLayout.jsx'
import { ResultsLayout } from './ResultsLayout.jsx'
import { LoginForm } from './Auth.jsx';
import '../App.css';

function MainLayout(props) {

    const getPhaseDescription = (phase) => {
        switch (phase) {
            case 0:
                return "Impostazione del budget";
            case 1:
                return "Creazione proposte";
            case 2:
                return "Votazione proposte";
            case 3:
                return "Valutazione risultati";
            default:
                return "-";
        }
    };

    return (
        props.association !== null ?
            <>
                <Row className="g-3 justify-content-center">
                    <Col >
                        <Card>
                            <Card.Img variant="top" src={props.association.URI} alt="Image"
                                style={{ width: '450px', height: '250px' }}
                                className="custom-image-class" />
                            <Card.Body>
                                <Card.Title>
                                    {props.association.Name}
                                </Card.Title>
                                <Card.Text>
                                    {props.association.Description}
                                </Card.Text>
                                {props.loggedIn && (
                                    <>
                                        {props.association.Phase !== 0 && (
                                            <Card.Text>
                                                <strong>Budget:</strong> {props.association.Budget}
                                            </Card.Text>
                                        )}
                                        <Card.Text>
                                            <strong>Fase:</strong> {getPhaseDescription(props.association.Phase)}
                                        </Card.Text>
                                    </>
                                )}
                                <Link to='/associazioni/associazione' key={0}>
                                    <Button variant='primary'>Vai alla gestione del budget</Button>
                                </Link>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </> : <></>
    );
}

// Phases Controller
function FasiLayout(props) {

    if (props.association != null && props.association.Phase != null) {
        switch (props.association.Phase) {
            case 0:
                return <BudgetLayout user={props.user} association={props.association} handleErrors={props.handleErrors} setDirty={props.setDirty} />
            case 1:
                return <ProposalsLayout user={props.user} association={props.association} handleErrors={props.handleErrors} setDirty={props.setDirty} />
            case 2:
                return <VotesLayout user={props.user} association={props.association} handleErrors={props.handleErrors} setDirty={props.setDirty} setLoading={props.setLoading} />
            case 3:
                return <ResultsLayout user={props.user} association={props.association} handleErrors={props.handleErrors} setDirty={props.setDirty} setLoading={props.setLoading} />
            default:
                return <NotFoundLayout />
        }
    } else {
        <NotFoundLayout />
    }
}


function NotFoundLayout() {
    return (
        <>
            <h2>Questa non e' la route che stai cercando!</h2>
            <Link to="/">
                <Button variant="primary">Go Home!</Button>
            </Link>
        </>
    );
}

function LoadingLayout() {
    return (
        <Row className="text-center">

            <Col md={12} className="below-nav">
                <h1>
                    <span className="scritte-spacing" />
                    <span className="scritte-spacing" />
                    <span className="scritte-spacing" />
                    <span className="scritte-spacing" />
                    <span className="scritte-spacing" />
                    Caricamento in corso
                    <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
                    <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
                    <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
                </h1>

            </Col>
        </Row>
    )
}

function LoginLayout(props) {
    return (
        <Row className="vh-100">
            <Col md={12} className="below-nav">
                <LoginForm login={props.login} />
            </Col>
        </Row>
    );
}

export { NotFoundLayout, MainLayout, FasiLayout, LoadingLayout, LoginLayout }; 