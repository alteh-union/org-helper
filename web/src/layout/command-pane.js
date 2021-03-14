import * as React from 'react';
import { Button } from 'react-bootstrap';
import { getAuthHeader } from '../helpers/auth-header';

import StringArg from './arguments/string-arg';
import ArrayArg from './arguments/array-arg';
import BooleanArg from './arguments/boolean-arg';
import TimeArg from './arguments/time-arg';
import ObjectArg from './arguments/object-arg';
import MentionsArg from './arguments/mentions-arg';
import SubjectsArg from './arguments/subjects-arg';
import ChannelsArg from './arguments/channels-arg';

/**
 * Command component for Application.
 * Builds UI based on the Bot's command defintion and allows to execute the corresponding Bot command
 * by filling the argument fields and the pressing the execution button.
 * @param {React.Props} props
 */
export default class CommandPane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      commandResult: null
    };
  }

  getArgComponent(arg) {
    let component;
    switch (arg.scannerType) {
      case 'string':
        component = <StringArg arg={arg}/>;
        break;
      case 'array':
        component = <ArrayArg arg={arg}/>;
        break;
      case 'boolean':
        component = <BooleanArg arg={arg}/>;
        break;
      case 'time':
        component = <TimeArg arg={arg}/>;
        break;
      case 'object':
        component = <ObjectArg arg={arg}/>;
        break;
      case 'mentions':
        component = <MentionsArg arg={arg}/>;
        break;
      case 'subjects':
        component = <SubjectsArg arg={arg}/>;
        break;
      case 'channels':
        component = <ChannelsArg arg={arg}/>;
        break;
      default:
        component = <StringArg arg={arg}/>;
        break;
    }
    return component;
  }

  render() {
    return (
      <div>
        <div>
          <b>{ this.props.commandDefinition.displayName }:</b>
        </div>
        <div>
          { this.props.commandDefinition.help }
        </div>
        <ul>
          {this.props.commandDefinition.args.map(arg =>
            <li key={arg.name} >
              {this.getArgComponent(arg)}
              <hr />
            </li>
          )}
        </ul>
        <Button onClick={() => this.handleExecutionClick()}>
          Execute
        </Button>
        <div>
          { (this.state.commandResult) ? this.state.commandResult.text : null }
        </div>
      </div>
    );
  }

  handleExecutionClick() {
    // todo: create preferences.txt like file and put backend base url there
    fetch(`http://localhost:4000/modules/discord/execute-command`, {
      method: 'POST',
      headers: getAuthHeader()
    })
      .then(res => res.status === 200 ? res.json() : null).then(jsonResponse => {
        if (jsonResponse) {
          this.setState({ commandResult: jsonResponse.commandResult});
        } else {
          this.setState({ commandResult: null});
        }
      })
      .catch(() => this.setState({ commandResult: null }));
  }
}
