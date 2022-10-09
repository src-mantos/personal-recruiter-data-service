import { IScrapeRequest, IPostData, IRunMetric, IPC, ComponentError } from '..';
import { injectAll, singleton, inject } from 'tsyringe';
import { ScrapeDao } from '../dao/ScrapeDao';
import ScrapeRequest from '../entity/ScrapeRequest';
import { fork } from 'child_process';

/**
 * The primary driver for orchestrating the collection of scrape posting data.
 * The scraping process is a long running process that runs requests in series.
 *  @example
```
    const instance = container.resolve(ScrapeQueueRunner);
    instance.enqueue( IScrapeRequest );
    await instance.runQueue();
```
 */
@singleton()
export class ScrapeQueueRunner {
    activeRequest: ScrapeRequest|undefined;
    requestQueue: IScrapeRequest[];

    constructor () {
        this.requestQueue = [];
    }

    /**
     * Creates the uuid refrence id
     * @param request - {@see IScrapeRequest}
     * @returns {IScrapeRequest} - with uuid populated
     */
    enqueue (request:IScrapeRequest):IScrapeRequest {
        const impl = new ScrapeRequest(request);
        this.requestQueue.push(impl);
        return impl;
    }

    /**
     * @returns {IScrapeRequest|undefined}
     */
    dequeue ():IScrapeRequest|undefined {
        return this.requestQueue.shift();
    }

    /**
     * Reporting on the current state of the in-memory queue & active function
     * @group Function Queue
     * @returns {IScrapeRequest[]} - @see ScrapeRequest for more on the active request
     */
    getQueueStatus (): IScrapeRequest[] {
        const result = [];
        if (this.activeRequest) {
            result.push(this.activeRequest);
        }
        for (const task of this.requestQueue) {
            result.push(task);
        }

        return result;
    }

    /**
     * Supporting basic UI use-case,
     * find and remove queued function
     * @param {string} - uuid
     * @returns {boolean} - true = found
     */
    removeFromQueue (uuid: string): boolean {
        for (const i in this.requestQueue) {
            const task = this.requestQueue[i];
            if (task.uuid === uuid) {
                this.requestQueue.splice(parseInt(i), 1);
                return true;
            }
        }
        return false;
    }

    /**
     * external callable interface
     */
    async runQueue () {
        while (this.requestQueue.length > 0) {
            this.activeRequest = undefined;
            await this.run();
        }
    }

    /**
     * Scrape process management
     */
    protected run ():Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const runner = this;
        return new Promise<void>((resolve) => {
            const request:IScrapeRequest|undefined = this.dequeue();
            if (request === undefined) { throw new ComponentError('No Scrape Request'); }
            if (request?.pageDepth === undefined) { throw new ComponentError('No Page Depth Set'); }
            if (request?.uuid === undefined) { throw new ComponentError('internal constraint failure'); }

            const args:string[] = [request.uuid, '' + request.pageDepth, request.keyword];
            if (request.location) {
                args.push(request.location);
            }
            const proc = fork('./dist/src/runScrapeProcess.js', args);

            proc.on('message', (data:IPC<any>) => {
                switch (data.operation) {
                    case 'error':
                        if (runner.activeRequest) {
                            runner.activeRequest.complete = false;
                        }
                        throw new ComponentError(data);

                    case 'requestUpdates':
                        runner.activeRequest = data.payload as ScrapeRequest;
                        break;
                    default:
                        console.log(JSON.stringify(data));
                        break;
                }
            });

            proc.on('close', (_code: number, _args: any[]) => {
                console.log(`${runner.activeRequest?.uuid} completed`);
                resolve();
            });
        });
    }
}
