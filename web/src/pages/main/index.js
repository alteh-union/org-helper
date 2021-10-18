import * as React from 'react';
import Orgs from '../../layout/orgs';
import CommandModules from '../../layout/command-modules';
import ModulePane from '../../layout/module-pane';
import { getAuthHeader } from '../../helpers/auth-header';


export default class Main extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      authenticated: false,
      selectedOrg: null,
      selectedModule: null,
    };
  }

  componentDidMount() {
    this.checkAuthentication();
  }

  handleOrg = (org) => {
    if (!this.state.selectedOrg || this.state.selectedOrg.id !== org.id) {
      this.setState({selectedOrg: org});
      this.setState({selectedModule: null});
    }
  }

  handleModule = (commandModule) => {
    this.setState({selectedModule: commandModule});
  }

  render() {
    return <div>
      <p>Main page</p>
      <button onClick={() => this.checkAuthentication()}>Check authentication</button>
      <p>{this.state.authenticated ? 'Authenticated' : 'Not authenticated'}</p>
      { (this.state.authenticated)
        ? <Orgs onSelectOrg={this.handleOrg}/> : null }
      { (this.state.selectedOrg && !this.state.selectedModule) ?
        <CommandModules onSelectModule={this.handleModule} orgId={this.state.selectedOrg.id} /> : null }
      { (this.state.selectedOrg && this.state.selectedModule) ?
        <ModulePane onDeselectModule={this.handleModule}
          orgId={this.state.selectedOrg.id}
          moduleId={this.state.selectedModule.id} />
        : null }
    </div>;
  }

  // todo: remove this demo code
  checkAuthentication() {
    // todo: create preferences.txt like file and put backend base url there
    fetch(`http://localhost:4000/auth/secured-endpoint`, {
      headers: getAuthHeader()
    })
      .then(res => this.setState({ authenticated: res.status === 200 }))
      .catch(() => this.setState({ authenticated: false }));
  }
}
