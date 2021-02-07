import * as React from 'react';
import Header from './header';
import Footer from './footer';
import { getCurrentUser } from '../helpers/auth-header';

// import './main.scss';

/**
 * Layout component for Application
 * @param {React.Props} props
 */
export default class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: getCurrentUser()
    };
  }

  componentDidMount() {
    this.registerUserChangeEvent();
  }

  render() {
    let { children } = this.props;
    return (
      <>
        <Header username={this.state.user?.username}/>
        <main className='main__content'>{children}</main>
        <Footer />
      </>
    );
  }

  registerUserChangeEvent() {
    window.addEventListener('storage', event => {
      if (event.key === 'user' && event.storageArea === window.localStorage) {
        this.setState({
          user: getCurrentUser()
        });
      }
    });
  }
}
