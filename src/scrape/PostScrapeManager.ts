//# sourceMappingURL=dist/src/scrape/PostScrapeManager.js.map
import { PostScraper } from './PostScraper';
import type { IPostDataScrapeRequest, IPostData, IVendorMetadata, IPostDataSearchRequest, IRunMetric } from '../types';
import { injectAll, singleton, inject } from 'tsyringe';
import { PostDao } from '../dao/PostDao';
import { ScrapeDao } from '../dao/ScrapeDao';
import ScrapeRequest from '../entity/ScrapeRequest';
import mongoose from 'mongoose';
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
    scrapeDao: ScrapeDao;
    activeRequest: ScrapeRequest;
    workQueue: { (): Promise<any> }[];

    constructor(@injectAll('PostScraper') scrapeInterfaces: PostScraper[], @inject('ScrapeDao') scrapeDao: ScrapeDao) {
        this.interfaces = scrapeInterfaces;
        this.requestData = [];
        this.workQueue = [];
        const initialized = [];
        for (const int of this.interfaces) {
            initialized.push(int.init());
        }
        this.scrapeDao = scrapeDao;
        initialized.push(this.scrapeDao.connection.connect());
        this._ready = Promise.all(initialized);
    }

    async destruct(): Promise<void> {
        const off = [];
        for (const int of this.interfaces) {
            off.push(int.clearInstanceData());
        }
        off.push(this.scrapeDao.connection.disconnect());
        await Promise.all(off);
    }

    queueRequest(searchQuery: IPostDataScrapeRequest): string {
        const req = new ScrapeRequest(searchQuery);
        this.workQueue.push(async () => {
            await this.processQueue(req);
        });
        return req.uuid;
    }

    dequeueRequest(): { (): Promise<any> } {
        const next = this.workQueue.shift();
        if (next != undefined) {
            return next;
        }
        return async () => {
            Promise.resolve('Queue Complete');
        };
    }

    async runPromiseQueue(): Promise<void> {
        while (this.workQueue.length >= 1) {
            const result = await this.dequeueRequest()();
            if (result) {
                console.log('The Resolve failover tripped?', result);
                break;
            }
        }
    }

    private async processQueue(query: ScrapeRequest): Promise<void> {
        const completion = [];
        this.activeRequest = query;
        this.scrapeDao.insert(this.activeRequest);
        for (const inter of this.interfaces) {
            completion.push(inter.run(this.activeRequest));
        }

        const timer = setInterval(() => {
            (async () => {
                console.log('updating active request', JSON.stringify(this.activeRequest));
                await this.scrapeDao.update(this.activeRequest);
            })();
        }, 60000);

        await Promise.all(completion);
        clearInterval(timer);
        this.activeRequest.complete = true;
        await this.scrapeDao.update(this.activeRequest);
    }

    /**
     * Takes in a search parameter to be processed by multiple interfaces.  <br/>
     * The actual scraping will be long running process and we want to provide an identifier so that the process can be referenced later.
     * @param searchQuery
     */
    processRequest(searchQuery: IPostDataScrapeRequest): string {
        const completion = [];
        this.activeRequest = new ScrapeRequest(searchQuery);
        this.activeRequest._id = new mongoose.Types.ObjectId();

        this.scrapeDao.insert(this.activeRequest);

        searchQuery.uuid = this.activeRequest.uuid;
        for (const inter of this.interfaces) {
            completion.push(inter.run(this.activeRequest));
        }
        /** Adding periodic updates for metric reporting */
        const timer = setInterval(() => {
            (async () => {
                await this.scrapeDao.update(this.activeRequest);
            })();
        }, 60000);

        this._runComplete = Promise.all(completion);
        this._runComplete.then(() => {
            /** search completion */
            clearInterval(timer);
            this.activeRequest.complete = true;
            this.scrapeDao.update(this.activeRequest);
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
