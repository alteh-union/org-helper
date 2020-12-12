import * as React from 'react';
import { Navbar, Nav, Form, Button } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';
import routes from '../routes';

export default function Header(props) {
    const location = useLocation();

    return <header className="page__header">
        <Navbar bg="dark" variant="dark">
            <Navbar.Brand href="#home">OrgHelper</Navbar.Brand>
            <Nav className="mr-auto">
                {routes.map(({ id, name, path }) => (
                    <Nav.Link
                        key={id}
                        as={NavLink}
                        to={path}
                        activeClassName="active"
                        exact
                    >{name}</Nav.Link>
                ))}
            </Nav>
            {/* <Form inline className="mr-3">
                <Form.Control type="text" placeholder="Search" className="mr-sm-2" />
                <Button variant="outline-info">ok</Button>
            </Form>
            <Form inline>
                <Form.Control type="text" placeholder="Search" className="mr-sm-2" />
                <Button variant="outline-info">ok</Button>
            </Form> */}
            <Button variant="outline-info" className="mr-3">Log in</Button>
        </Navbar>
    </header>
}