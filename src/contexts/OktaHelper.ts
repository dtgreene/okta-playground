import OktaAuth, {
  AuthState,
  CustomUserClaimValue,
  toRelativeUrl,
} from '@okta/okta-auth-js';

import { getStorageItem } from 'app/utils';
import { STORAGE_KEY, EXPIRE_SECONDS } from 'app/constants';
import { PlaygroundStorage } from 'app/types';

export interface IAccessToken {
  value: string;
  expiresAt: number;
}

export interface IShiptUserBase {
  email: string;
  firstName: string;
  lastName: string;
  profilePic: string;
}

export interface IShiptUser extends IShiptUserBase {
  permissions: string[];
}

export interface IOktaHelperState {
  user: IShiptUser | null;
  accessToken: IAccessToken | null;
  isAuthenticated: boolean;
}

export interface IOktaHelperOptions {
  onStateChange?: (state: IOktaHelperState) => void;
  onNavigate?: (path: string) => void;
}

const logoutPath = '/logged-out';
const callbackPath = '/login-callback';
const fallbackPath = '/';

export class OktaHelper {
  auth: OktaAuth;
  onStateChange: IOktaHelperOptions['onStateChange'];
  onNavigate: IOktaHelperOptions['onNavigate'];
  target = new EventTarget();
  state: IOktaHelperState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
  };
  redirectInProgress: boolean = false;

  constructor(
    issuer: string,
    clientId: string,
    options: IOktaHelperOptions = {}
  ) {
    const storage = getStorageItem<PlaygroundStorage>(STORAGE_KEY, {});

    this.auth = new OktaAuth({
      issuer,
      clientId,
      redirectUri: `${location.origin}${callbackPath}`,
      postLogoutRedirectUri: `${location.origin}${logoutPath}`,
      scopes: ['openid', 'profile'],
      tokenManager: {
        expireEarlySeconds: Boolean(storage.expireEarly)
          ? EXPIRE_SECONDS.early
          : EXPIRE_SECONDS.default,
      },
    });
    this.onStateChange = options.onStateChange;
    this.onNavigate = options.onNavigate;

    // Subscribe to auth state changes
    this.auth.authStateManager.subscribe(this.handleStateChange);
    // Start the auth service
    this.auth.start();
  }
  destroy = () => {
    // This does not actually destroy the instance
    // but it should not be used after calling this
    // method.
    this.auth.authStateManager.unsubscribe(this.handleStateChange);
    this.auth.stop();
  };
  handleStateChange = (state?: AuthState) => {
    if (state && state.isAuthenticated) {
      if (!state.idToken || !state.accessToken) {
        console.error('User was authenticated but required tokens are missing');
        return;
      }

      try {
        const { accessToken, expiresAt } = state.accessToken;
        const { claims, user_permissions } = state.idToken.claims;
        const permissions = (user_permissions as string[]) ?? [];

        const baseUserClaims = getBaseUserClaims(
          claims as Record<string, CustomUserClaimValue>
        );

        this.state = {
          user: Object.assign(baseUserClaims, {
            permissions,
          }),
          accessToken: {
            value: accessToken,
            expiresAt,
          },
          isAuthenticated: state.isAuthenticated,
        };
        this.redirectInProgress = false;

        if (this.onStateChange) {
          this.onStateChange(this.state);
        }
      } catch (error) {
        console.error(`Could not get user claims: ${error}`);
      }
    } else if (!this.redirectInProgress) {
      const currentUri = toRelativeUrl(
        window.location.href,
        window.location.origin
      );

      // Store the current uri before navigating
      this.auth.setOriginalUri(currentUri);
      this.auth.signInWithRedirect();
    }
  };
  update = async (pathname: string) => {
    if (this.redirectInProgress) return;

    if (this.auth.isLoginRedirect()) {
      try {
        this.redirectInProgress = true;
        await this.auth.handleRedirect();
      } catch (error) {
        console.error(`Redirect failed: ${error}`);
        this.navigate(fallbackPath);
      }
    } else if (pathname === callbackPath) {
      // In this case, the auth instance doesn't consider this
      // to be a login redirect even though the user is on
      // /login-callback.  This could happen if the user manually
      // landed here.  We just need to try and send them away
      // from this page.
      this.navigate(fallbackPath);
    }
  };
  navigate = (path: string) => {
    if (this.onNavigate) {
      this.onNavigate(path);
    } else {
      window.location.replace(path);
    }
  };
  signOut = () => {
    return this.auth.signOut();
  };
}

function getBaseUserClaims(claims: Record<string, CustomUserClaimValue>) {
  const claimKeys = ['email', 'firstName', 'lastName', 'profilePic'] as Array<
    keyof IShiptUserBase
  >;

  return claimKeys.reduce((accumulator, key) => {
    if (typeof claims[key] === 'string') {
      accumulator[key] = claims[key] as string;
    } else {
      accumulator[key] = '';
    }

    return accumulator;
  }, {} as IShiptUserBase);
}
