import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    globalSearch(req: any, queryStr: string, filterModule?: string): Promise<{
        users: any[];
        materials: any[];
        orders: any[];
    }>;
}
