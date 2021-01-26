import * as React from 'react';

export default class DiscordAuth extends React.Component {

  componentDidMount() {
    const code = new URLSearchParams(this.props.location.search).get('code');
    fetch(`http://localhost:4000/auth/discord/jwt?code=${code}`)
      .then(res => {
        res.json().then(user => localStorage.setItem("jwt", user.token));
        // window.close();
      });
  }

  render() {
    return <p>'Discord authorization in progress. Please wait.'</p>;
  }
}

