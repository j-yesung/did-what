const readUrlPathname = (url: URL) => url.pathname;

let readPathname = readUrlPathname;

export const getAppPathname = (href = window.location.href) => readPathname(new URL(href, window.location.href));

export const setAppPathnameReader = (reader: (url: URL) => string) => {
  readPathname = reader;
  return () => {
    readPathname = readUrlPathname;
  };
};
