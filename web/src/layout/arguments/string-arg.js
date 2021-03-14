import * as React from 'react';

/**
 * Component of simple string argument for Application.
 * Allows to input an arbitrary string as an argument for a web command.
 * @param {React.Props} props
 */
export default class StringArg extends React.Component {
  render() {
    return (
      <div>
        <div><b>{this.props.arg.displayName}</b></div>
        <input type="text"/>
      </div>
    );
  }
}
