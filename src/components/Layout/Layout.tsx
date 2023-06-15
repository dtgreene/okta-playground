import { Outlet } from 'react-router-dom';

import { OktaProvider } from 'app/contexts';

export const Layout = () => (
  <OktaProvider>
    <Outlet />
  </OktaProvider>
);
