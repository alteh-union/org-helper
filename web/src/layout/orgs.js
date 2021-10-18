import * as React from 'react';
import { getAuthHeader } from '../helpers/auth-header';

/**
 * Orgs component for Application.
 * Orgs list should be available once the user gets logged in.
 * Most of the action related to the Bot should be related to a particular org only where the Bot is present.
 * So selecting an org should be the next steps after signing in.
 * @param {React.Props} props
 */
export default class Orgs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orgs: []
    };
  }

  componentDidMount() {
    this.getUserOrgs();
  }

  handleClick(id) {
    const selectedOrg = this.state.orgs.find(el => el.id === id);
    this.props.onSelectOrg(selectedOrg);
  }

  render() {
    return (
      <div>
        <ul>
          {this.state.orgs.map(org =>
            <li key={org.id} onClick={() => this.handleClick(org.id)}>
              {org.name}
            </li>
          )}
        </ul>
      </div>
    );
  }

  getUserOrgs() {
    // todo: create preferences.txt like file and put backend base url there
    fetch(`http://localhost:4000/orgs/discord/get-orgs`, {
      headers: getAuthHeader()
    })
      .then(res => res.status === 200 ? res.json() : null).then(jsonResponse => {
        if (jsonResponse) {
          this.setState({ orgs: jsonResponse.userOrgs});
        } else {
          this.setState({ orgs: []});
        }
      })
      .catch(() => this.setState({ orgs: [] }));
  }
}
