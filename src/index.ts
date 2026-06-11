import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getCustomersData } from "./customers.js";
import { getCustomerMovieWishlist, getMoviesData } from "./movies.js";
import { saveLog } from "./logs.js";
const USER_AGENT = "customers-app/1.0";

const server = new McpServer({
  name: "customers",
  version: "1.0.0",
});

server.registerTool(
    'listCustomers', 
    {
        description: 'List all or one customer data',
        inputSchema: {
            filters: z.object({
                customerIdList: z.array(z.number().positive()).optional().describe('The list of customer IDs to list'),
                name: z.string().optional().describe('The name of the customer to list'),
                email: z.string().optional().describe('The email of the customer to list'),
                document: z.string().optional().describe('The document of the customer to list'),
                lastLoginMin: z.coerce.date().optional().describe('The minimum last login date'),
                lastLoginMax: z.coerce.date().optional().describe('The maximum last login date')
            }).optional().describe('The filters to list the customers'),
            fields: z.array(z.enum(['id', 'name', 'email', 'document', 'lastLogin'])).optional().describe('The fields to list the customers'),
        },
    }, 
    async ({
        filters, fields
    }) => {

        await saveLog(`[listCustomers] Finding customers with filters: ${JSON.stringify(filters)} and fields: ${JSON.stringify(fields)}`);
        const customers = await getCustomersData(filters, fields);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(customers, null, 2)
            }]
        }
    }
)

server.registerTool(
    'listMovies',
    {
        description: 'List all or one movie data, filtered by optional parameters',
        inputSchema: {
            filters: z.object({
                movieId: z.number().optional().describe('The movie ID to list'),
                categoryId: z.number().optional().describe('The category ID to list'),
                name: z.string().optional().describe('The movie name to list'),
                slug: z.string().optional().describe('The movie slug to list'),
                description: z.string().optional().describe('The movie description to list'),
                categoryName: z.string().optional().describe('The category name to list'),
            }).optional().describe('The filters to list the movies'),
            fields: z.array(z.enum(['id', 'name', 'slug', 'description', 'categoryId', 'categoryName'])).optional().describe('The fields to list the movies'),
        }
    },
    async ({ filters, fields }) => {
        await saveLog(`[listMovies] Finding movies with filters: ${JSON.stringify(filters)} and fields: ${JSON.stringify(fields)}`);
        const movies = await getMoviesData(filters, fields);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(movies, null, 2)
            }]
        }
    }
);

server.registerTool(
    'getCustomerMovieWishlist',
    {
        description: 'List the movies in the wishlist of a customer, could be filtered by customer ID or document, or by movie',
        inputSchema: {
            customerId: z.number().optional().describe('The customer ID to get the movie wishlist'),
            movieId: z.number().optional().describe('The movie ID to get the movie wishlist'),
            movieName: z.string().optional().describe('The movie name to get the movie wishlist'),
        }
    },
    async ({ customerId, movieId, movieName }) => {
        await saveLog(`[getCustomerMovieWishlist] Finding wishlist with customerId: ${customerId}, movieId: ${movieId}, movieName: ${movieName}`);
        const wishlist = await getCustomerMovieWishlist({ customerId, movieId, movieName });
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(wishlist, null, 2)
            }]
        }
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('Server is running on stdin');
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
