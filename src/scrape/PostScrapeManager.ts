import { PostScraper } from './PostScraper';
import type { IScrapeRequest, IPostData, IRunMetric } from '..';
import { injectAll, singleton, inject } from 'tsyringe';
import { ScrapeDao } from '../dao/ScrapeDao';
import ScrapeRequest from '../entity/ScrapeRequest';
import { MongoConnection } from '../dao/MongoConnection';

interface DescriptiveFunction {
    run: { (): Promise<any> };
    spec: IScrapeRequest;
}
/**
 * PostScrapeManager -
 * The primary driver for orchestrating the collection of scrape posting data
 * @example
```
    const instance = container.resolve(PostScrapeManager);
    await instance.initialize();
    instance.queueRequest(simpleSearch);
```
 */
@singleton()
export class PostScrapeManager {
    interfaces: PostScraper[];
    requestData: IPostData[][];
    scrapeDao: ScrapeDao;
    activeRequest: ScrapeRequest;
    workQueue: DescriptiveFunction[];
    connection: MongoConnection;
    updateRequestInterval: number;

    /**
     * inject dependencies and start scrape/database/etc interfaces
     * @param scrapeInterfaces
     * @param scrapeDao
     * @param connection
     */
    constructor (
        @injectAll('PostScraper') scrapeInterfaces: PostScraper[],
        @inject('ScrapeDao') scrapeDao: ScrapeDao,
        @inject('MongoConnection') connection: MongoConnection
    ) {
        this.interfaces = scrapeInterfaces;
        this.updateRequestInterval = 1000 * 60 * 1.5;
        this.requestData = [];
        this.workQueue = [];

        this.scrapeDao = scrapeDao;
        this.connection = connection;
    }

    initialize ():Promise<any> {
        const initialized = [];
        for (const int of this.interfaces) {
            initialized.push(int.init());
        }
        initialized.push(this.connection.connect());
        return Promise.all(initialized);
    }

    /**
     * Close all of the open interfaces
     */
    async destruct (): Promise<void> {
        const off = [];
        for (const int of this.interfaces) {
            off.push(int.clearInstanceData());
        }
        off.push(this.connection.disconnect());
        await Promise.all(off);
    }

    /**
     * accept user request into the in-memory function queue
     * @group Function Queue
     * @param searchQuery - {@link IScrapeRequest}
     * @returns string - the uuid that will be associated to this request
     */
    queueRequest (searchQuery: IScrapeRequest): string {
        const req = new ScrapeRequest(searchQuery);
        this.workQueue.push({
            run: async () => {
                await this.processQueue(req);
            },
            spec: req
        });
        return req.uuid;
    }

    /**
     * retrieves next run function from queue
     * @group Function Queue
     * @returns Function
     */
    dequeueRequest (): { (): Promise<any> } {
        const next = this.workQueue.shift();
        if (next !== undefined) {
            return next.run;
        }
        return async () => {
            Promise.resolve('Queue Complete');
        };
    }

    /**
     * Primary Async Entry Point
     * Starts the in-memory function queue
     * @group Function Queue
     */
    async runPromiseQueue (): Promise<void> {
        while (this.workQueue.length >= 1) {
            const result = await this.dequeueRequest()();
            if (result) { // unreachable
                console.log('The Resolve failover tripped?', result);
                break;
            }
        }
    }

    /**
     * Reporting on the current state of the in-memory queue & active function
     * @group Function Queue
     * @returns Array - {@link ScrapeRequest}
     */
    getQueueStatus (): any {
        const result = [];
        if (this.activeRequest) {
            result.push(this.activeRequest);
        }
        for (const task of this.workQueue) {
            result.push(task.spec);
        }

        return result;
    }

    /**
     * Supporting basic UI use-case,
     * find and remove queued function
     * @param uuid - string
     * @returns boolean - true = found
     */
    removeFromQueue (uuid: string): boolean {
        let ret = false;
        for (const i in this.workQueue) {
            const { spec } = this.workQueue[i];
            if (spec.uuid === uuid) {
                ret = true;
                this.workQueue.splice(parseInt(i), 1);
                break;
            }
        }
        return ret;
    }

    isRunning (): boolean {
        return this.activeRequest === undefined ? false : !this.activeRequest.complete;
    }

    getRequestMetrics (): IRunMetric[] {
        return this.activeRequest.metrics;
    }

    /**
     * Runnable Function implementation details
     * @param query - {@link ScrapeRequest}
     */
    private async processQueue (query: ScrapeRequest): Promise<void> {
        const completion = [];
        this.activeRequest = query;
        const insertActiveRequest:{():Promise<void>} = () => { return this.scrapeDao.insert(this.activeRequest); };
        if (!this.connection.isConnected()) {
            this.connection.connect(insertActiveRequest);
        } else {
            insertActiveRequest();
        }

        // const catchException = (err:any) => {
        //     console.warn('Scrape interface Failure!', err);
        // };
        for (const inter of this.interfaces) {
            completion.push(
                inter.run(this.activeRequest).catch((err) => {
                    console.info('Scrape interface Failure!', JSON.stringify(err));
                })
            );
        }

        const timer = setInterval(() => {
            (async () => {
                console.log('updating active request', JSON.stringify(this.activeRequest));
                await this.scrapeDao.update(this.activeRequest);
            })();
        }, this.updateRequestInterval);

        await Promise.all(completion);
        clearInterval(timer);
        this.activeRequest.complete = true;
        await this.scrapeDao.update(this.activeRequest);
    }
}
