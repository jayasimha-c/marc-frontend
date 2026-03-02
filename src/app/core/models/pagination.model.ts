export interface PaginationModel {
    first: number;
    rows: number;
    sortField?: string;
    sortOrder?: number;
    filters?: any;
    globalFilter?: string;
    page?: number;
    pageCount?: number;
}
