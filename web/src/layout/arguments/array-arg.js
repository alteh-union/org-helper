import * as React from 'react';

/**
 * Component of array argument for Application.
 * Allows to input a set of arbitrary strings as an argument for a web command.
 * @param {React.Props} props
 */
export default class ArrayArg extends React.Component {
  render() {
    return (
      <div>
        <div><b>{this.props.arg.displayName}</b></div>
        <input type="text"/>
      </div>
    );
  }
}
