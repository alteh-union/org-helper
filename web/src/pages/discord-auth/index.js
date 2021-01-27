import * as React from 'react';

export default class DiscordAuth extends React.Component {

  componentDidMount() {
    this.authenticate();
  }

  render() {
    return <p>'Discord authorization in progress. Please wait.'</p>;
  }

  authenticate() {
    const code = new URLSearchParams(this.props.location.search).get('code');
    fetch(`http://localhost:4000/auth/discord/jwt?code=${code}`)
      .then(res => res.json().then(user => {
        if (res.status === 200) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
        }
        window.close();
      }).catch(() => {
        localStorage.removeItem('user');
        window.close();
      }));
  }
}

