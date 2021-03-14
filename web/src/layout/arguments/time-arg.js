import * as React from 'react';
import { Form } from 'react-bootstrap';

/**
 * Component of time argument for Application.
 * Allows to input a time value (either amount of schedule) as an argument for a web command.
 * @param {React.Props} props
 */
export default class TimeArg extends React.Component {
  render() {
    return (
      <Form.Group controlId={this.props.arg.name}>
        <Form.Label>{this.props.arg.displayName}</Form.Label>
        <Form.Control type="text" />
      </Form.Group>
    );
  }
}
