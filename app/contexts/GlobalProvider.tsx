import {createContext, useContext, useEffect, useMemo, useReducer} from 'react';
import {useCart} from '@shopify/hydrogen-react';
import type {ReactNode} from 'react';
import type {Customer} from '@shopify/hydrogen-react/storefront-api-types';

import type {Action, Dispatch, GlobalContext, GlobalState} from '~/lib/types';
import {useRootLoaderData} from '~/hooks';

const Context = createContext({state: {}, actions: {}} as GlobalContext);

const globalState = {
  cartOpen: false,
  desktopMenuOpen: false,
  iframesHidden: false,
  mobileMenuOpen: false,
  modal: {children: null, props: {}},
  promobarOpen: true,
  searchOpen: false,
  previewModeCustomer: undefined,
  isHydrated: false,
};

const reducer = (state: GlobalState, action: Action) => {
  switch (action.type) {
    case 'OPEN_CART':
      return {
        ...state,
        cartOpen: true,
        desktopMenuOpen: false,
        mobileMenuOpen: false,
        modal: {children: null, props: {}},
        searchOpen: false,
      };
    case 'CLOSE_CART':
      return {
        ...state,
        cartOpen: false,
      };
    case 'OPEN_DESKTOP_MENU':
      return {
        ...state,
        cartOpen: false,
        desktopMenuOpen: true,
        mobileMenuOpen: false,
        modal: {children: null, props: {}},
        searchOpen: false,
      };
    case 'CLOSE_DESKTOP_MENU':
      return {
        ...state,
        desktopMenuOpen: false,
      };
    case 'OPEN_MOBILE_MENU':
      return {
        ...state,
        cartOpen: false,
        desktopMenuOpen: false,
        mobileMenuOpen: true,
        modal: {children: null, props: {}},
        searchOpen: false,
      };
    case 'CLOSE_MOBILE_MENU':
      return {
        ...state,
        mobileMenuOpen: false,
      };
    case 'OPEN_MODAL':
      return {
        ...state,
        cartOpen: false,
        desktopMenuOpen: false,
        mobileMenuOpen: false,
        modal: {
          children: action.payload.children,
          props: {...action.payload.props},
        },
        searchOpen: false,
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        modal: {children: null, props: {}},
      };
    case 'TOGGLE_PROMOBAR':
      return {
        ...state,
        promobarOpen: action.payload,
      };
    case 'TOGGLE_IFRAMES_HIDDEN':
      return {
        ...state,
        iframesHidden: action.payload,
      };
    case 'OPEN_SEARCH':
      return {
        ...state,
        cartOpen: false,
        desktopMenuOpen: false,
        mobileMenuOpen: false,
        modal: {children: null, props: {}},
        searchOpen: true,
      };
    case 'CLOSE_SEARCH':
      return {
        ...state,
        searchOpen: false,
      };
    case 'CLOSE_ALL':
      return {
        ...state,
        cartOpen: false,
        desktopMenuOpen: false,
        mobileMenuOpen: false,
        modal: {children: null, props: {}},
        searchOpen: false,
      };
    case 'SET_PREVIEW_MODE_CUSTOMER':
      return {
        ...state,
        previewModeCustomer: action.payload,
      };
    case 'SET_IS_CART_READY':
      return {
        ...state,
        isCartReady: action.payload,
      };
    case 'SET_IS_HYDRATED':
      return {
        ...state,
        isHydrated: action.payload,
      };

    default:
      throw new Error(`Invalid Context action of type: ${action.type}`);
  }
};

const actions = (dispatch: Dispatch) => ({
  openCart: () => {
    dispatch({type: 'OPEN_CART'});
  },
  closeCart: () => {
    dispatch({type: 'CLOSE_CART'});
  },
  openDesktopMenu: () => {
    dispatch({type: 'OPEN_DESKTOP_MENU'});
  },
  closeDesktopMenu: () => {
    dispatch({type: 'CLOSE_DESKTOP_MENU'});
  },
  openMobileMenu: () => {
    dispatch({type: 'OPEN_MOBILE_MENU'});
  },
  closeMobileMenu: () => {
    dispatch({type: 'CLOSE_MOBILE_MENU'});
  },
  openModal: (children: ReactNode, props?: Record<string, any>) => {
    dispatch({type: 'OPEN_MODAL', payload: {children, props}});
  },
  closeModal: () => {
    dispatch({type: 'CLOSE_MODAL'});
  },
  togglePromobar: (isOpen: boolean) => {
    dispatch({type: 'TOGGLE_PROMOBAR', payload: isOpen});
  },
  toggleIframesHidden: (isHidden: boolean) => {
    dispatch({type: 'TOGGLE_IFRAMES_HIDDEN', payload: isHidden});
  },
  openSearch: () => {
    dispatch({type: 'OPEN_SEARCH'});
  },
  closeSearch: () => {
    dispatch({type: 'CLOSE_SEARCH'});
  },
  closeAll: () => {
    dispatch({type: 'CLOSE_ALL'});
  },
  setPreviewModeCustomer: (customer: Customer | null | undefined) => {
    dispatch({type: 'SET_PREVIEW_MODE_CUSTOMER', payload: customer});
  },
  setIsCartReady: (isReady: boolean) => {
    dispatch({type: 'SET_IS_CART_READY', payload: isReady});
  },
  setIsHydrated: (isHydrated: boolean) => {
    dispatch({type: 'SET_IS_HYDRATED', payload: isHydrated});
  },
});

export function GlobalProvider({children}: {children: ReactNode}) {
  const {isPreviewModeEnabled, siteSettings} = useRootLoaderData();
  const cart = useCart();
  const cartIsIdle = cart.status === 'idle';
  const [state, dispatch] = useReducer(reducer, {
    ...globalState,
    settings: siteSettings?.data?.siteSettings?.settings,
    isPreviewModeEnabled,
    isCartReady: cartIsIdle,
  });

  const value = useMemo(() => ({state, actions: actions(dispatch)}), [state]);

  const iframesShouldBeHidden =
    state.iframesHidden || state.mobileMenuOpen || state.searchOpen;

  useEffect(() => {
    if (state.isHydrated) return;
    value.actions.setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (cartIsIdle && !state.isCartReady) {
      value.actions.setIsCartReady(true);
    } else {
      // uninitialized cart never becomes idle so instead set cart ready after 1 sec
      setTimeout(() => {
        value.actions.setIsCartReady(true);
      }, 1000);
    }
  }, [cartIsIdle]);

  useEffect(() => {
    if (!state.isHydrated) return;
    const iframes = document.querySelectorAll('iframe');
    if (iframesShouldBeHidden) {
      [...(iframes || [])].forEach((iframe) => {
        iframe.classList.add('!invisible');
      });
    } else {
      [...(iframes || [])].forEach((iframe) => {
        iframe.classList.remove('!invisible');
      });
    }
  }, [iframesShouldBeHidden]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useGlobalContext = () => useContext(Context);
