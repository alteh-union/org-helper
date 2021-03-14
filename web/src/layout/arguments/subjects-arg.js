import * as React from 'react';

/**
 * Component of subjects argument for Application.
 * Allows to input a list of subjects as an argument for a web command.
 * @param {React.Props} props
 */
export default class SubjectsArg extends React.Component {
  render() {
    return (
      <div>
        <div><b>{this.props.arg.displayName}</b></div>
        <input type="text"/>
      </div>
    );
  }
}
