import { Outlet, useNavigate } from 'react-router-dom';

import { OktaProvider } from '../contexts';

export const Layout = () => {
  const navigate = useNavigate();
  
  return (
    <OktaProvider onNavigate={navigate}>
      <Outlet />
    </OktaProvider>
  );
};
