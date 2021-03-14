import * as React from 'react';
import { Form } from 'react-bootstrap';

/**
 * Component of object argument for Application.
 * Allows to input an arbitrary object as an argument for a web command.
 * @param {React.Props} props
 */
export default class ObjectArg extends React.Component {
  render() {
    return (
      <Form.Group controlId={this.props.arg.name}>
        <Form.Label>{this.props.arg.displayName}</Form.Label>
        <Form.Control type="text" />
      </Form.Group>
    );
  }
}
