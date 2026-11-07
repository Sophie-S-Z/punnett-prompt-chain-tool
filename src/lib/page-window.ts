type PageResponse<T> = {
  data: T[] | null;
  count: number | null;
  error: unknown;
  status?: number;
};

/** Recount a stale range, then fetch the actual last page rather than page one. */
export async function loadPage<T>(
  read: (page: number) => PromiseLike<PageResponse<T>>,
  requested: number,
  size: number,
) {
  if (
    !Number.isSafeInteger(requested) ||
    requested < 1 ||
    !Number.isSafeInteger(size) ||
    size < 1
  )
    throw new Error("Invalid page.");
  const check = (r: PageResponse<T>) => {
    if (
      r.error ||
      r.count === null ||
      !Number.isSafeInteger(r.count) ||
      r.count < 0 ||
      !Array.isArray(r.data)
    )
      throw new Error("The records could not be loaded.");
    return { rows: r.data, total: r.count };
  };
  let page = requested;
  let response = await read(page);
  if (response.status === 416 && requested > 1) {
    page = 1;
    response = await read(page);
  }
  let result = check(response);
  const last = Math.max(1, Math.ceil(result.total / size));
  const target = Math.min(requested, last);
  if (page !== target) {
    page = target;
    result = check(await read(page));
  }
  return { ...result, page, last };
}
