import * as React from 'react';
import { Button, Nav, Navbar } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import routes from '../routes';

export default function Header(props) {
  return <header className='page__header'>
    <Navbar bg='dark' variant='dark'>
      <Navbar.Brand href='#home'>OrgHelper</Navbar.Brand>
      <Nav className='mr-auto'>
        {routes.filter(route => !route.hiddenInHeader).map(({ id, name, path }) => (
          <Nav.Link
            key={id}
            as={NavLink}
            to={path}
            activeClassName='active'
            exact
          >{name}</Nav.Link>
        ))}
      </Nav>
      <Button variant='outline-info'
              className='mr-3'
              // todo: create preferences.txt like file and put backend base url there
              onClick={() => window.open('http://localhost:4000/auth/discord/go-to-discord-auth',
                '_blank',
                'toolbar=0,location=0,menubar=0')}>
        {props.username ? props.username : 'Log in'}
      </Button>
    </Navbar>
  </header>;
}
