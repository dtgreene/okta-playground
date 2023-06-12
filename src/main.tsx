import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { Layout } from './components';
import { Root, LoggedOut } from './pages';

import './styles.css';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        index: true,
        element: <Root />,
      },
      {
        path: '/login-callback',
        index: true,
        element: null,
      },
      {
        path: '/logged-out',
        index: true,
        element: <LoggedOut />,
      },
    ],
  },
]);
const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
