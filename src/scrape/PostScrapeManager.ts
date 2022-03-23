//# sourceMappingURL=dist/scrape/PostScrapeManager.js.map
import * as types from '../types';
import { PostScraper } from './PostScraper';
import type { IPostDataScrapeRequest, IPostData, IVendorMetadata, IPostDataSearchRequest } from '../types';
/**
 * PostScrapeManager -
 * The primary driver for orchestrating the collection of scrape posting data
 *
 */
export class PostScrapeManager {
    interfaces: PostScraper[];

    constructor() {
        this.interfaces = [];
    }

    /**
     * Takes in a search parameter to be processed by multiple interfaces.  <br/>
     * The actual scraping will be long running process and we want to provide an identifier so that the process can be referenced later.
     * @param searchQuery
     */
    async processRequest(searchQuery: IPostDataScrapeRequest): Promise<number> {
        throw new Error('Method not implemented.');
    }

    /**
     * We want to be able to report on any given scrape operation
     * @param requestID
     */
    getRequestStatus(requestID: number): any {
        throw new Error('Method not implemented.');
    }

    /**
     * General purpose data storage for the job posting data
     * @param postData
     */
    private async storePostData(postData: IPostData[]): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
