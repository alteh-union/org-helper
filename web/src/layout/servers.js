import * as React from 'react';
import { getAuthHeader } from '../helpers/auth-header';

/**
 * Servers component for Application.
 * Servers list should be available once the user gets logeed in.
 * Most of the action related to the Bot should be related to a particular server only where the Bot is present.
 * So selecting a server should be the next steps after signing in.
 * @param {React.Props} props
 */
export default class Servers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      servers: []
    };
  }

  componentDidMount() {
    this.getUserServers();
  }

  render() {
    return (
      <div>
        <ul>
          {this.state.servers.map(server =>
            <li key={server.id} onClick={this.handleClick}>
              {server.name}
            </li>
          )}
        </ul>
      </div>
    );
  }

  getUserServers() {
    // todo: create preferences.txt like file and put backend base url there
    fetch(`http://localhost:4000/servers/discord/get-servers`, {
      headers: getAuthHeader()
    })
      .then(res => res.status === 200 ? res.json() : null).then(jsonResponse => {
        if (jsonResponse) {
          this.setState({ servers: jsonResponse.userServers});
        } else {
          this.setState({ servers: []});
        }
      })
      .catch(() => this.setState({ servers: [] }));
  }
}
