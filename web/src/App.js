import React from 'react';
// import logo from './logo.svg';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import routes from './routes';
import Layout from './layout';
import './App.css';
import './main.scss';

function App() {
  return <Router>
    <Layout>

      <Switch>
        {routes.map(({ id, path, component, exact }) => (
          <Route key={id} path={path} component={component} exact={exact} />
        ))}
      </Switch>

    </Layout>
  </Router>

}

export default App;
