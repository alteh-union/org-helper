import * as React from 'react';
import { Button, Form } from 'react-bootstrap';
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
    this.handleExecutionClick = this.handleExecutionClick.bind(this);
  }

  getArgComponent(arg) {
    let component;
    switch (arg.scannerType) {
      case 'string':
        component = <StringArg key={arg.name} arg={arg} />;
        break;
      case 'array':
        component = <ArrayArg key={arg.name} arg={arg} />;
        break;
      case 'boolean':
        component = <BooleanArg key={arg.name} arg={arg} />;
        break;
      case 'time':
        component = <TimeArg key={arg.name} arg={arg} />;
        break;
      case 'object':
        component = <ObjectArg key={arg.name} arg={arg} />;
        break;
      case 'mentions':
        component = <MentionsArg key={arg.name} arg={arg} />;
        break;
      case 'subjects':
        component = <SubjectsArg key={arg.name} arg={arg} />;
        break;
      case 'channels':
        component = <ChannelsArg key={arg.name} arg={arg} />;
        break;
      default:
        component = <StringArg key={arg.name} arg={arg} />;
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
        <Form onSubmit={this.handleExecutionClick}>
          {this.props.commandDefinition.args.map(arg => this.getArgComponent(arg))}
          <Button type='submit'>
            Execute
          </Button>
        </Form>
        <div>
          { (this.state.commandResult) ? this.state.commandResult.text : '' }
        </div>
      </div>
    );
  }

  async handleExecutionClick(event) {
    event.preventDefault();

    const data = new FormData();
    data.append('command', this.props.commandDefinition.name);
    data.append('orgId', this.props.orgId);

    const payload = {};
    for (const arg of this.props.commandDefinition.args) {
      payload[arg.name] = event.target.elements[arg.name].value;
    }
    data.append('payload', JSON.stringify(payload));

    // todo: create preferences.txt like file and put backend base url there
    const res = await fetch(`http://localhost:4000/commands/discord/execute-command`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: data
    });
    if (res.status === 200) {
      const parsedJson = await res.json();
      this.setState({ commandResult: parsedJson.commandResult });
    } else {
      const errorText = await res.text();
      this.setState({ commandResult: { text: errorText } });
    }
  }
}
