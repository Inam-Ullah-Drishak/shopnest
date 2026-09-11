import { useEffect } from 'react';

const SITE = 'ShopNest';

// Sets the tab title while a page is mounted, and restores it on the way out
export const usePageTitle = (title) => {
  useEffect(() => {
    const previous = document.title;

    document.title = title ? `${title} · ${SITE}` : SITE;

    return () => {
      document.title = previous;
    };
  }, [title]);
};