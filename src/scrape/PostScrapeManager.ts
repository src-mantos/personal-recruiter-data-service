//# sourceMappingURL=dist/src/scrape/PostScrapeManager.js.map
import { PostScraper } from './PostScraper';
import { IndeedPostScraper } from './impl/IndeedPostScraper';
import { DicePostScraper } from './impl/DicePostScraper';
import type { IPostDataScrapeRequest, IPostData, IVendorMetadata, IPostDataSearchRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { injectAll, singleton, registry } from 'tsyringe';
import { setTimeout } from 'timers/promises';
/**
 * PostScrapeManager -
 * The primary driver for orchestrating the collection of scrape posting data
 *
 */
@singleton()
export class PostScrapeManager {
    interfaces: PostScraper[];
    _ready: Promise<any>;
    _runComplete: Promise<any>;

    constructor(@injectAll('PostScraper') scrapeInterfaces: PostScraper[]) {
        this.interfaces = scrapeInterfaces;
        const initilized = [];
        for (const int of this.interfaces) {
            initilized.push(int.init());
        }
        this._ready = Promise.all(initilized);
    }

    async destruct(): Promise<void> {
        const off = [];
        for (const int of this.interfaces) {
            off.push(int.clearInstanceData());
        }
        await Promise.all(off);
    }

    /**
     * Takes in a search parameter to be processed by multiple interfaces.  <br/>
     * The actual scraping will be long running process and we want to provide an identifier so that the process can be referenced later.
     * @param searchQuery
     */
    processRequest(searchQuery: IPostDataScrapeRequest): string {
        if (searchQuery.uuid) {
            throw new Error('known search queries are not supported for scraping.');
        }
        searchQuery.uuid = uuidv4();
        /** initialize all of the scrape interfaces */
        const completion = [];
        for (const inter of this.interfaces) {
            completion.push(inter.searchPostings(searchQuery));
        }

        this._runComplete = Promise.all(completion);
        this._runComplete.then(() => {
            /** search completion */
        });

        return searchQuery.uuid;
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
