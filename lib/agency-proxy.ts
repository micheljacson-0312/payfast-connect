export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get('page') || searchParams.get('pageNumber') || 0) || 1;
  const per_page = Number(searchParams.get('per_page') || searchParams.get('perPage') || searchParams.get('limit') || 0) || 50;
  const date_from = searchParams.get('date_from') || searchParams.get('from') || null;
  const date_to = searchParams.get('date_to') || searchParams.get('to') || null;
  return { page, per_page, date_from, date_to };
}

export function normalizeUpstreamResponse(upstream: any, page: number, per_page: number) {
  if (upstream == null) return { total: 0, page, per_page, items: [] };

  // If upstream already provides items/data + total, use it
  const items = Array.isArray(upstream) ? upstream
    : upstream.items || upstream.data || upstream.records || upstream.transactions || null;

  if (items && Array.isArray(items)) {
    const total = typeof upstream.total === 'number' ? upstream.total : items.length;
    const upstreamPage = upstream.page || upstream.currentPage || upstream.pageNumber || page;
    const upstreamPer = upstream.per_page || upstream.perPage || upstream.limit || per_page;
    // If upstream likely handled pagination, respect its values
    if (upstream.page || upstream.per_page || upstream.total) {
      return { total, page: upstreamPage || page, per_page: upstreamPer || per_page, items };
    }
    // Otherwise paginate locally
    const offset = (page - 1) * per_page;
    return { total: items.length, page, per_page, items: items.slice(offset, offset + per_page) };
  }

  // If upstream is object with single record
  if (typeof upstream === 'object') {
    return { total: 1, page, per_page, items: [upstream] };
  }

  // Fallback: wrap primitive
  return { total: 1, page, per_page, items: [upstream] };
}
