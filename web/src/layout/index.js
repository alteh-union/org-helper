import * as React from 'react';
import Header from './header';
import Footer from './footer';

// import './main.scss';

/**
 * Layout component for Application
 * @param {React.Props} props
 */
export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main className="main__content">{children}</main>
      <Footer />
    </>
  );
}