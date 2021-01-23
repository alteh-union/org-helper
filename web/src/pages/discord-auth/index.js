import * as React from 'react';

export default class DiscordAuth extends React.Component {

  componentDidMount() {
    const code = new URLSearchParams(this.props.location.search).get('code');
    fetch(`http://localhost:4000/auth/discord/jwt?code=${code}`)
      .then(res => {
        console.log('auth success');
        res.json().then(body => console.log('your auth jwt: ' + body.token))
        // window.close();
      })
      .catch(() => {
        console.log('auth failed');
        // window.close();
      });
  }

  render() {
    return <p>'Discord authorization in progress. Please wait.'</p>;
  }
}

