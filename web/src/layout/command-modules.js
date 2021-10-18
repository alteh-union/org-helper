import * as React from 'react';
import { getAuthHeader } from '../helpers/auth-header';

/**
 * Command modules component for Application.
 * Each command module is a set of available commands, typically grouped by theme or functionality
 * (like social commands, moderator commands etc.).
 * The list of command modules should be available once the org is selected which the user is going to manipulate.
 * @param {React.Props} props
 */
export default class CommandModules extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modules: []
    };
  }

  componentDidMount() {
    this.getCommandModules();
  }

  handleClick(id) {
    const selectedModule = this.state.modules.find(el => el.id === id);
    this.props.onSelectModule(selectedModule);
  }

  render() {
    return (
      <div>
        <ul>
          {this.state.modules.map(module =>
            <li key={module.id} onClick={() => this.handleClick(module.id)}>
              {module.name}
            </li>
          )}
        </ul>
      </div>
    );
  }

  getCommandModules() {
    // todo: create preferences.txt like file and put backend base url there
    fetch(`http://localhost:4000/modules/discord/get-modules?orgId=${this.props.orgId}`, {
      headers: getAuthHeader()
    })
      .then(res => res.status === 200 ? res.json() : null).then(jsonResponse => {
        if (jsonResponse) {
          this.setState({ modules: jsonResponse.commandModules});
        } else {
          this.setState({ modules: []});
        }
      })
      .catch(() => this.setState({ modules: [] }));
  }
}
