import * as React from 'react';
import { Form } from 'react-bootstrap';

/**
 * Component of boolean argument for Application.
 * Allows to input a binay value (true/false or enabled/disabled or yes/no) as an argument for a web command.
 * @param {React.Props} props
 */
export default class BooleanArg extends React.Component {
  render() {
    return (
      <Form.Group controlId={this.props.arg.name}>
        <Form.Label>{this.props.arg.displayName}</Form.Label>
        <Form.Control type="text" />
      </Form.Group>
    );
  }
}
