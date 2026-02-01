import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';

const pageTitles: Record<string, string> = {
  '/': 'לזכרו הנצחי • In Eternal Memory',
  '/gallery': 'גלריית תמונות • Photo Gallery',
  '/letters': 'מכתבים • Letters',
  '/articles': 'כתבות • Articles',
};

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    document.title = pageTitles[location.pathname] ?? 'לזכרו הנצחי • In Eternal Memory';
  }, [location.pathname]);

  return (
    <>
      <Navigation />
      <main style={{ overflowX: 'hidden' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
