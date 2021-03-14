import * as React from 'react';

/**
 * Component of boolean argument for Application.
 * Allows to input a binay value (true/false or enabled/disabled or yes/no) as an argument for a web command.
 * @param {React.Props} props
 */
export default class BooleanArg extends React.Component {
  render() {
    return (
      <div>
        <div><b>{this.props.arg.displayName}</b></div>
        <input type="text"/>
      </div>
    );
  }
}
