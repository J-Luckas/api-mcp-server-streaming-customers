import { MOVIES_DB, queryAll, withDatabase } from "./database.js";

export type MovieData = {
    id: number;
    name: string;
    slug: string;
    description: string;
    categoryId: number;
    categoryName: string;
}

export type MovieFilterParams = {
    movieId?: number;
    categoryId?: number;
    name?: string;
    slug?: string;
    description?: string;
    categoryName?: string;
}

export type CustomerMovieWishlistFilterParams = {
    customerId?: number;
    movieId?: number;
    movieName?: string;
}

export type CustomerMovieWishlistData = {
    customerId: number;
    movieId: number;
    movieName: string;
}

export async function getMoviesData(filters?: {
    movieId?: number;
    categoryId?: number;
    name?: string;
    slug?: string;
    description?: string;
    categoryName?: string;
}, fields?: string[]): Promise<{
    id?: number;
    name?: string;
    slug?: string;
    description?: string;
    categoryId?: number;
    categoryName?: string;
}[]> {
    return withDatabase(MOVIES_DB, (db) => {
        const { movieId, categoryId, name, slug, description, categoryName } = filters || {};
        const conditions: string[] = [];
        const params: (string | number)[] = [];

        if (movieId) {
            conditions.push("m.id = ?");
            params.push(movieId);
        }

        if (categoryId) {
            conditions.push("m.category_id = ?");
            params.push(categoryId);
        }

        if (name) {
            conditions.push("m.name LIKE ?");
            params.push(`%${name}%`);
        }

        if (slug) {
            conditions.push("m.slug = ?");
            params.push(slug);
        }

        if (description) {
            conditions.push("m.description LIKE ?");
            params.push(`%${description}%`);
        }

        if (categoryName) {
            conditions.push("c.name LIKE ?");
            params.push(`%${categoryName}%`);
        }

        const formattedFields: Record<string, string> = {
            'id': 'm.id AS id',
            'name': 'm.name AS name',
            'slug': 'm.slug AS slug',
            'description': 'm.description AS description',
            'categoryId': 'm.category_id AS categoryId',
            'categoryName': 'c.name AS categoryName'
        };
        
        let sql = `
        SELECT 
            ${fields?.map((field) => formattedFields[field]).join(", ") || "m.id AS id, m.name AS name, m.slug AS slug, m.description AS description, m.category_id AS categoryId, c.name AS categoryName"}
        FROM movies m 
        LEFT JOIN categories c 
            ON m.category_id = c.id`;
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(" AND ")}`;
        }
        sql += ` ORDER BY m.id`;
        return queryAll<{
            id?: number;
            name?: string;
            slug?: string;
            description?: string;
            categoryId?: number;
            categoryName?: string;
        }>(db, sql, params);
    });
}

export async function getCustomerMovieWishlist({
    customerId,
    movieId,
    movieName
}: CustomerMovieWishlistFilterParams): Promise<CustomerMovieWishlistData[]> {
    return withDatabase(MOVIES_DB, (db) => {
        const conditions: string[] = [];
        const params: (string | number)[] = [];

        if (customerId) {
            conditions.push("cw.customer_id = ?");
            params.push(customerId);
        }

        if (movieId) {
            conditions.push("cw.movie_id = ?");
            params.push(movieId);
        }

        if (movieName) {
            conditions.push("m.name LIKE ?");
            params.push(`%${movieName}%`);
        }

        let sql = `
        SELECT 
            cw.customer_id AS customerId,
            cw.movie_id AS movieId,
            m.name AS movieName
        FROM customer_wishlist cw
        LEFT JOIN movies m ON cw.movie_id = m.id`;
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(" AND ")}`;
        }

        return queryAll<CustomerMovieWishlistData>(db, sql, params);
    });
}