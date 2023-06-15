import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { Layout } from 'app/components';
import { Root, Loading, LoggedOut } from 'app/pages';

import './styles.css';

const router = createBrowserRouter([
  {
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Root />,
          },
          {
            path: '/login-callback',
            index: true,
            element: <Loading message="Signing in..." />,
          },
        ],
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
