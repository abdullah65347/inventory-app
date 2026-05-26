export interface PageResult<T> {
    items: T[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

export function paginate<T>(
    allItems: T[],
    currentPage: number,
    pageSize: number
): PageResult<T> {
    const totalItems = allItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = allItems.slice(start, start + pageSize);

    return { items, totalItems, totalPages, currentPage: safePage, pageSize };
}