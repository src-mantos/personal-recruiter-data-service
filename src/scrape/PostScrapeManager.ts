//# sourceMappingURL=dist/src/scrape/PostScrapeManager.js.map
import { PostScraper } from './PostScraper';
import type { IPostDataScrapeRequest, IPostData, IVendorMetadata, IPostDataSearchRequest, IRunMetric } from '../types';
import { injectAll, singleton, inject } from 'tsyringe';
import { PostDao } from '../dao/PostDao';
import { SearchDao } from '../dao/SearchDao';
import ScrapeRequest from '../entity/ScrapeRequest';
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
    requestData: IPostData[][];
    searchDao: SearchDao;
    activeRequest: ScrapeRequest;

    constructor(@injectAll('PostScraper') scrapeInterfaces: PostScraper[], @inject('SearchDao') searchDao: SearchDao) {
        this.interfaces = scrapeInterfaces;
        this.requestData = [];
        const initialized = [];
        for (const int of this.interfaces) {
            initialized.push(int.init());
        }
        this.searchDao = searchDao;
        this._ready = Promise.all(initialized);
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
        const completion = [];
        this.activeRequest = new ScrapeRequest(searchQuery);

        this.searchDao.connect().then(() => {
            this.searchDao.insert(this.activeRequest);
        });

        searchQuery.uuid = this.activeRequest.uuid;
        for (const inter of this.interfaces) {
            completion.push(inter.run(this.activeRequest));
        }

        this.searchDao.connect().then(() => {
            this.searchDao.update(this.activeRequest);
        });

        this._runComplete = Promise.all(completion);
        this._runComplete.then(() => {
            /** search completion */
            this.activeRequest.complete = true;
            for (const inter of this.interfaces) {
                this.requestData.push(inter.getPageData());
            }
        });

        return searchQuery.uuid;
    }

    isRunning(): boolean {
        return this.activeRequest && !this.activeRequest.complete;
    }

    getRequestMetrics(): IRunMetric[] {
        return this.activeRequest.metrics;
    }
}
