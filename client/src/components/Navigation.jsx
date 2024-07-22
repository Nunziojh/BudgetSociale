import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { Navbar, Nav, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { LogoutButton, LoginButton } from './Auth';
//import { IoIosAirplane } from 'react-icons/io';

const Navigation = (props) => {

  const handleSubmit = (event) => {
    event.preventDefault();
  }

  return (
    <Navbar bg="primary" expand="sm" variant="dark" fixed="top" className="navbar-padding">
      <span className="button-spacing" />
      <Link to="/">
        <Navbar.Brand>
          <i className="bi bi-piggy-bank-fill"> Budget Sociale</i>
        </Navbar.Brand>
      </Link>
      
      <Navbar.Toggle aria-controls="navbar-nav" />

      {/*<Nav className="ml-md-auto">*/}
      <Navbar.Collapse id="navbar-nav" className="justify-content-end">
        <Nav>
        <Navbar.Text className="mx-2">
          {props.user && props.user.name && `Benvenuto, ${props.user.name}!`}
        </Navbar.Text>
        <Form>
          {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
        </Form>
        </Nav>
        <span className="button-spacing" />
      </Navbar.Collapse>
    </Navbar>
  );
}

export { Navigation };