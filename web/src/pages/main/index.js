import * as React from 'react';
import Servers from '../../layout/servers';
import { getAuthHeader } from '../../helpers/auth-header';


export default class Main extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      authenticated: false,
      selectedServer: null
    };
  }

  componentDidMount() {
    this.checkAuthentication();
  }

  render() {
    return <div>
      <p>Main page</p>
      <button onClick={() => this.checkAuthentication()}>Check authentication</button>
      <p>{this.state.authenticated ? 'Authenticated' : 'Not authenticated'}</p>
      { this.state.authenticated ? <Servers/> : null }
    </div>;
  }

  // todo: remove this demo code
  checkAuthentication() {
    // todo: create preferences.txt like file and put backend base url there
    fetch(`http://localhost:4000/auth/secured-endpoint`, {
      headers: getAuthHeader()
    })
      .then(res => this.setState({ authenticated: res.status === 200 }))
      .catch(() => this.setState({ authenticated: false }));
  }
}
