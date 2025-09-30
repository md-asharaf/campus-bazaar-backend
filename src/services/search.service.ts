import envVars from "@/config/envVars";
import { Client } from "@elastic/elasticsearch";

export interface UpsertItemParams {
    text: string;
    type: string;
    id?: string | number;
    category?: string;
}

export interface DeleteItemParams {
    type: string;
    id?: string | number;
    text?: string;
}

export class SearchService {
    private client: Client;
    private index: string;

    constructor() {
        this.client = new Client({
            node: envVars.ELASTICSEARCH_URL,
            auth: {
                username: envVars.ELASTICSEARCH_USERNAME,
                password: envVars.ELASTICSEARCH_PASSWORD,
            },
        });
        this.index = envVars.ELASTICSEARCH_INDEX;
    }

    async upsertItem({
        text,
        type,
        id,
        category,
    }: UpsertItemParams): Promise<void> {
        if (!text || !type) throw new Error("text and type are required");

        const docId = `${type}_${id ?? text.toLowerCase()}`;

        await this.client.update({
            index: this.index,
            id: docId,
            script: {
                source: "ctx._source.popularity += 1; ctx._source.last_searched = params.now",
                params: { now: new Date().toISOString() },
            },
            upsert: {
                text,
                type,
                id: id ?? null,
                category: category ?? null,
                popularity: 1,
                last_searched: new Date().toISOString(),
            },
        });
    }

    async deleteItem({ type, id, text }: DeleteItemParams): Promise<void> {
        const docId = `${type}_${id ?? text?.toLowerCase()}`;
        try {
            await this.client.delete({ index: this.index, id: docId });
        } catch (err: any) {
            if (err.meta && err.meta.statusCode !== 404) throw err;
        }
    }

    async getSuggestions(query: string, size: number = 10): Promise<any[]> {
        if (!query) return [];

        const result = await this.client.search({
            index: this.index,
            size,
            _source: ["text", "type", "id", "category"],
            query: {
                bool: {
                    should: [
                        { match_phrase_prefix: { text: query } },
                        {
                            fuzzy: {
                                text: { value: query, fuzziness: "AUTO" },
                            },
                        },
                    ],
                },
            },
            sort: [{ popularity: "desc" }],
        });

        return result.hits.hits.map((hit: any) => hit._source);
    }

    async search(query: string, size: number = 20): Promise<any[]> {
        if (!query) return [];

        const result = await this.client.search({
            index: this.index,
            size,
            _source: ["text", "type", "id", "category"],
            query: {
                bool: {
                    should: [
                        { match: { text: { query, boost: 3 } } }, // exact match weighted higher
                        { match_phrase_prefix: { text: query } }, // prefix match
                        {
                            fuzzy: {
                                text: { value: query, fuzziness: "AUTO" },
                            },
                        }, // fuzzy match
                    ],
                },
            },
            sort: [{ popularity: "desc" }],
        });

        return result.hits.hits.map((hit: any) => hit._source);
    }
}

export default new SearchService();
