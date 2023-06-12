import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import OktaAuth, {
  AuthState,
  CustomUserClaimValue,
  toRelativeUrl,
} from '@okta/okta-auth-js';

interface IOktaProviderProps {
  children: ReactNode;
  onNavigate?: (url: string) => void;
}

interface IOktaContext {
  user: IShiptUser | null;
  accessToken: IAccessToken | null;
  signOut: () => Promise<void>;
  refreshToken: () => void;
}

interface IAccessToken {
  value: string;
  expiresAt: number;
}

interface IShiptUser {
  email: string;
  firstName: string;
  lastName: string;
  permissions: string[];
  profilePic: string;
}

const defaultContext = {
  user: null,
  accessToken: null,
  signOut: async () => {},
  refreshToken: () => {},
};

export const OktaContext = createContext<IOktaContext>(defaultContext);

export const OktaProvider = ({ children, onNavigate }: IOktaProviderProps) => {
  // where okta will send the user after signing in
  const callbackPath = '/login-callback';
  const logoutPath = '/logged-out';
  // where to redirect if the user manually lands on the login callback path
  const fallbackPath = '/';

  const clientRef = useRef(
    new OktaAuth({
      issuer: process.env.REACT_APP_OAUTH_ISSUER,
      clientId: process.env.REACT_APP_OAUTH_CLIENTID,
      redirectUri: `${location.origin}${callbackPath}`,
      postLogoutRedirectUri: `${location.origin}${logoutPath}`,
      scopes: ['openid', 'profile'],
    })
  );
  const oktaClient = clientRef.current;

  const [value, setValue] = useState<{
    user: IShiptUser | null;
    accessToken: IAccessToken | null;
  }>({ user: null, accessToken: null });

  const [authState, setAuthState] = useState(
    oktaClient.authStateManager.getAuthState()
  );
  useEffect(() => {
    const navigate = (path?: string) => {
      if (path) {
        if (onNavigate) {
          // use the given navigate function if available
          onNavigate(path);
        } else {
          // default navigation method
          location.replace(path);
        }
      }
    };
    const init = async () => {
      // auth state callback
      const stateHandler = (state: AuthState) => {
        setAuthState(state);

        if (!state) return;

        // if the user is not signed in and not on the login callback path
        // this is the main login flow
        if (!state.isAuthenticated) {
          if (!matchPath(callbackPath)) {
            const currentUri = toRelativeUrl(
              window.location.href,
              window.location.origin
            );
            // store the current uri before navigating away to sign in
            oktaClient.setOriginalUri(currentUri);
            oktaClient.signInWithRedirect();
          }
        } else if (state.idToken && state.accessToken) {
          const { accessToken, expiresAt } = state.accessToken;
          const { claims, user_permissions } = state.idToken.claims;
          const permissions = (user_permissions as string[]) ?? [];

          // extract string claims
          const { email, firstName, lastName, profilePic } = getUserClaims(
            claims as Record<string, CustomUserClaimValue>
          );

          // set the user and access token
          setValue({
            user: {
              email,
              firstName,
              lastName,
              permissions,
              profilePic,
            },
            accessToken: {
              value: accessToken,
              expiresAt,
            },
          });
        }
      };

      // subscribe to authState change event
      oktaClient.authStateManager.subscribe(stateHandler);

      // after signing in on okta.com, the user will be redirected to BASE_URL/login-callback
      // the tokens and state are stored as query params after redirecting
      if (matchPath(callbackPath)) {
        if (oktaClient.isLoginRedirect()) {
          // parse and sync the tokens stored in the url
          const { state, tokens } = await oktaClient.token.parseFromUrl();
          oktaClient.tokenManager.setTokens(tokens);

          // update the auth state with the newly-added tokens
          await oktaClient.authStateManager.updateAuthState();

          const originalUri = oktaClient.getOriginalUri(state);

          if (originalUri) {
            // navigate to the original uri
            navigate(originalUri);
          } else {
            // otherwise, navigate to the fallback page
            navigate(fallbackPath);
          }
        } else {
          // this is the login callback but the Okta query params are missing
          navigate(fallbackPath);
        }
      }

      // start the okta client
      oktaClient.start();
    };

    init();

    // unsubscribe on dismount
    return () => {
      oktaClient.authStateManager.unsubscribe();
      oktaClient.stop();
    };
  }, []);

  const signOut = useCallback(() => {
    return oktaClient.signOut();
  }, []);

  const refreshToken = useCallback(() => {}, []);

  return (
    <OktaContext.Provider
      value={Object.assign(value, { signOut, refreshToken })}
    >
      {!authState?.isAuthenticated ? 'Loading...' : children}
    </OktaContext.Provider>
  );
};

function getUserClaims(claims: Record<string, CustomUserClaimValue>) {
  const defaultClaims = {
    email: '',
    profilePic: '',
    firstName: '',
    lastName: '',
  };

  return (
    Object.keys(defaultClaims) as Array<keyof typeof defaultClaims>
  ).reduce((acc, key) => {
    const value = typeof claims[key] === 'string' ? claims[key] : '';
    acc[key] = value as string;

    return acc;
  }, defaultClaims);
}

function matchPath(path: string, exact: boolean = true) {
  if (exact) {
    return location.pathname === path;
  } else {
    return location.pathname.startsWith(path);
  }
}
