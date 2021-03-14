import * as React from 'react';

/**
 * Component of time argument for Application.
 * Allows to input a time value (either amount of schedule) as an argument for a web command.
 * @param {React.Props} props
 */
export default class TimeArg extends React.Component {
  render() {
    return (
      <div>
        <div><b>{this.props.arg.displayName}</b></div>
        <input type="text"/>
      </div>
    );
  }
}
