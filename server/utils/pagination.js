// pageSize and pageNumber arrive straight from the query string. Left
// unclamped, ?pageSize=999999 returns the entire collection in one response,
// and a negative pageNumber produces a negative skip, which Mongo rejects
// outright. Both are trivially easy to hit by editing a URL.
const MAX_PAGE_SIZE = 100;

export const getPaging = (query, fallback) => {
  const requestedSize = Number(query.pageSize);

  const pageSize =
    Number.isFinite(requestedSize) && requestedSize > 0
      ? Math.min(Math.floor(requestedSize), MAX_PAGE_SIZE)
      : fallback;

  const requestedPage = Number(query.pageNumber);

  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  return { page, pageSize, skip: pageSize * (page - 1) };
};

export default getPaging;