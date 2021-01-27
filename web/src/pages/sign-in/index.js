import * as React from 'react';
import { getAuthHeader } from '../../helpers/auth-header';


export default class SignIn extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      authenticated: false
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
    </div>;
  }

  // todo: remove this demo code
  checkAuthentication() {
    fetch(`http://localhost:4000/auth/secured-endpoint`, {
      headers: getAuthHeader()
    })
      .then(res => this.setState({ authenticated: res.status === 200 }))
      .catch(() => this.setState({ authenticated: false }));
  }
}
