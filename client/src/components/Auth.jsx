import { useState } from 'react';
import { Form, Button, Alert, Col, Row } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

function LoginForm(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    props.login(credentials)
      .then( () => {
        if (location.state && location.state.from) {
          navigate(location.state.from);
        } else {
          navigate(-1);
        }
      } )
      .catch((err) => { 
        setErrorMessage(err.error); setShow(true); 
      });
  };

  const handleBack = () => {
    if (location.state && location.state.from) {
      navigate(location.state.from);
    } else {
      navigate(-1);
    }
  };

  return (
    <Row className="vh-100 justify-content-md-center">
    <Col md={800} className="offset-md-4" >
    <span className="button-spacing" />
    <h1 className="pb-6">Login</h1>
    <span className="button-spacing" />
      <Form onSubmit={handleSubmit}>
          <Alert
            dismissible // show X button
            show={show}
            onClose={() => setShow(false)}
            variant="danger">
            {errorMessage}
          </Alert>
          <Form.Group className="mb-6" controlId="username">
            <Form.Label className="h4">Email</Form.Label>
            <Form.Control
              type="email" 
              value={username} placeholder="Example: user1@polito.it"
              onChange={(ev) => setUsername(ev.target.value)}
              required={true}
            />
          </Form.Group>
         <span className="button-spacing" />
          <Form.Group className="mb-6" controlId="password">
            <Form.Label className="h4">Password</Form.Label>
            <Form.Control
              type="password"
              value={password} placeholder="Enter the password."
              onChange={(ev) => setPassword(ev.target.value)}
              required={true} minLength={6}
            />
          </Form.Group>
          <span className="button-spacing" />
          <div>
            <Button className="mt-6" variant="danger" onClick={handleBack}>Annulla</Button>
            <span className="button-spacing" />
            <Button className="mt-6" type="submit">Accedi</Button>
          </div>
      </Form>
      </Col>
      </Row>

  )
};

function LogoutButton(props) {
  return (
    <Button variant="outline-light" onClick={props.logout}>Esci</Button>
  )
}

function LoginButton(props) {
  const navigate = useNavigate();
  return (
    <Button variant="outline-light" onClick={()=> navigate('/login')}>Accedi</Button>
  )
}

export { LoginForm, LogoutButton, LoginButton };
