import * as React from 'react';

/**
 * Component of mentions argument for Application.
 * Allows to input a list of channels as an argument for a web command.
 * @param {React.Props} props
 */
export default class MentionsArg extends React.Component {
  render() {
    return (
      <div>
        <div><b>{this.props.arg.displayName}</b></div>
        <input type="text"/>
      </div>
    );
  }
}
