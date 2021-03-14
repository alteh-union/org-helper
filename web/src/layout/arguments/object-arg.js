import * as React from 'react';

/**
 * Component of object argument for Application.
 * Allows to input an arbitrary object as an argument for a web command.
 * @param {React.Props} props
 */
export default class ObjectArg extends React.Component {
  render() {
    return (
      <div>
        <div><b>{this.props.arg.displayName}</b></div>
        <input type="text"/>
      </div>
    );
  }
}
