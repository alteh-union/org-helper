import * as React from 'react';
import { Button } from 'react-bootstrap';
import { getAuthHeader } from '../helpers/auth-header';

import CommandPane from './command-pane';

/**
 * Module component for Application.
 * Upon mounting fetches the list of availables commands from the server and dynamically builds the web UI
 * for them depending on what parameters are required by corresponding commands.
 * Commands can be executed by filling corresponding argument fields and pressing the execution button.
 * @param {React.Props} props
 */
export default class ModulePane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      moduleDefinition: null
    };
  }

  componentDidMount() {
    this.getModuleDefinition();
  }

  handleClick(id) {
    this.props.onDeselectModule(null);
  }

  render() {
    return (
      <div>
        <Button onClick={() => this.handleClick()}>
          Back
        </Button>
        { this.state.moduleDefinition ?
          <ul>
            {this.state.moduleDefinition.commands.map(command =>
              <li key={command.name}>
                <CommandPane serverId={this.props.serverId} commandDefinition={command} />
                <hr />
              </li>
            )}
          </ul>
        : null }
      </div>
    );
  }

  getModuleDefinition() {
    // todo: create preferences.txt like file and put backend base url there
    fetch(`http://localhost:4000/modules/discord/get-module?serverId=${this.props.serverId}&moduleId=${this.props.moduleId}`, {
      headers: getAuthHeader()
    })
      .then(res => res.status === 200 ? res.json() : null).then(jsonResponse => {
        if (jsonResponse) {
          this.setState({ moduleDefinition: jsonResponse.moduleDefinition});
        } else {
          this.setState({ moduleDefinition: null});
        }
      })
      .catch(() => this.setState({ moduleDefinition: null }));
  }
}
