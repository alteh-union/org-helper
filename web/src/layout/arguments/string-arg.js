import * as React from 'react';
import { Form } from 'react-bootstrap';

/**
 * Component of simple string argument for Application.
 * Allows to input an arbitrary string as an argument for a web command.
 * @param {React.Props} props
 */
export default class StringArg extends React.Component {
  render() {
    return (
      <Form.Group controlId={this.props.arg.name}>
        <Form.Label>{this.props.arg.displayName}</Form.Label>
        <Form.Control type="text" />
      </Form.Group>
    );
  }
}
