import { useEffect } from 'react';
import { useRouter } from 'next/router';

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_1 || '1201843863809192';

const track = (type: string, params = {}) => {
  if (typeof window !== 'undefined') {
    window.fbq?.('track', type, params);
  }
};

export const usePixel = () => {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => track('PageView');

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return {
    addToCart: (params = {}) => track('AddToCart', params),
    initiateCheckout: (params = {}) => track('InitiateCheckout', params),
    viewContent: (params = {}) => track('ViewContent', params),
  };
};

export default usePixel;