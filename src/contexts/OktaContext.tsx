import { ReactNode, createContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Loading } from 'app/pages';
import { IOktaHelperState, OktaHelper } from './OktaHelper';

interface IOktaProviderProps {
  children: ReactNode;
}

interface IOktaContext {
  user: IShiptUser | null;
  accessToken: IAccessToken | null;
  signOut: () => Promise<void>;
  refreshTokens: () => void;
}

interface IAccessToken {
  value: string;
  expiresAt: number;
}

interface IShiptUserBase {
  email: string;
  firstName: string;
  lastName: string;
  profilePic: string;
}

interface IShiptUser extends IShiptUserBase {
  permissions: string[];
}

const defaultContext = {
  user: null,
  accessToken: null,
  signOut: async () => {},
  refreshTokens: () => {},
};

const defaultValue = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

export const OktaContext = createContext<IOktaContext>(defaultContext);
export const OktaProvider = ({ children }: IOktaProviderProps) => {
  const oktaHelper = useRef<OktaHelper>();
  const location = useLocation();
  const navigate = useNavigate();
  const [value, setValue] = useState<IOktaHelperState>(defaultValue);

  useEffect(() => {
    if (!oktaHelper.current) {
      oktaHelper.current = new OktaHelper(
        import.meta.env.VITE_OAUTH_ISSUER,
        import.meta.env.VITE_OAUTH_CLIENTID,
        {
          onStateChange: (state) => {
            if (state) {
              setValue(state);
            } else {
              setValue(defaultValue);
            }
          },
          onNavigate: navigate,
        }
      );
    }
  }, []);

  useEffect(() => {
    if (oktaHelper.current) {
      oktaHelper.current.update(location.pathname);
    }
  }, [location]);

  const signOut = () => {
    if (oktaHelper.current) {
      return oktaHelper.current.signOut();
    }

    return Promise.reject();
  };

  const refreshTokens = () => {
    if(oktaHelper.current) {
      oktaHelper.current.refreshTokens();
    }
  };

  return (
    <OktaContext.Provider
      value={Object.assign(value, { signOut, refreshTokens })}
    >
      {!value.isAuthenticated ? <Loading message="Signing in..." /> : children}
    </OktaContext.Provider>
  );
};
