import * as React from 'react';
import { authHeader } from '../../helpers/auth-header';


export default class SignIn extends React.Component {

  constructor(props) {
    super(props);
    setInterval(function () {
      fetch(`http://localhost:4000/auth/secured-endpoint`, {
        headers: authHeader()
      })
        .then(res => {
          console.log(res);
        });
    }, 5000);
  }


  render() {
    return <div>
      <p>Main page</p>
    </div>;
  }
}
