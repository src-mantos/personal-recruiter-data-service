import { IScrapeRequest, IPC, ComponentError } from '../types';
import { inject, singleton } from 'tsyringe';
import ScrapeRequest from '../entity/ScrapeRequest';
import { fork } from 'child_process';
import { ScrapeDao } from '../dao/ScrapeDao';
import { MongoConnection } from '../dao/MongoConnection';
import { clearInterval } from 'timers';

/**
 * @class
 * The primary driver for orchestrating the collection of scrape posting data.
 * The scraping process is a long running process that runs requests in series.
 * @example
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
    scrapeDao: ScrapeDao;
    connection: MongoConnection;

    constructor (
        @inject( 'ScrapeDao' ) scrapeDao: ScrapeDao,
        @inject( 'MongoConnection' ) connection: MongoConnection
    ) {
        this.requestQueue = [];
        this.connection = connection;
        this.scrapeDao = scrapeDao;
    }

    /**
     * Creates the uuid refrence id
     * @param request - {@see IScrapeRequest}
     * @returns {IScrapeRequest} - with uuid populated
     */
    enqueue ( request:IScrapeRequest ):IScrapeRequest {
        const impl = new ScrapeRequest( request );
        this.requestQueue.push( impl );
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
        if ( this.activeRequest )
            result.push({ ...this.activeRequest, posts: [] });

        for ( const task of this.requestQueue )
            result.push( task );


        return result;
    }

    /**
     * Supporting basic UI use-case,
     * find and remove queued function
     * @param {string} - uuid
     * @returns {boolean} - true = found
     */
    removeFromQueue ( uuid: string ): boolean {
        for ( const i in this.requestQueue ) {
            const task = this.requestQueue[i];
            if ( task.uuid === uuid ) {
                this.requestQueue.splice( parseInt( i ), 1 );
                return true;
            }
        }
        return false;
    }

    /**
     * external callable interface
     * @description The long running queue execution process
     */
    async runQueue () {
        // not really a great solution for multiple execution TODO
        if ( this.activeRequest === undefined ) {
            while ( this.requestQueue.length > 0 ) {
                this.activeRequest = undefined;
                await this.run();
            }
            // to clear the external status after inactivity
            setTimeout( () => { this.activeRequest = undefined }, 1000 * 60 );
        }
    }

    /**
     * Scrape process management
     * @description Running combined scrape process interface in single threaded manner
     * @returns {Promise<void>} - this will be resolved on completion or error
     */
    protected run ():Promise<void> {
        return new Promise<void>( ( resolve, reject ) => {
            const request:IScrapeRequest|undefined = this.dequeue();
            if ( request === undefined ) throw new ComponentError( 'No Scrape Request' );
            if ( request?.pageDepth === undefined ) throw new ComponentError( 'No Page Depth Set' );
            if ( request?.uuid === undefined ) throw new ComponentError( 'internal constraint failure' );

            const args:string[] = [ request.uuid, '' + request.pageDepth, request.keyword ];
            if ( request.location )
                args.push( request.location );

            const proc = fork( './dist/src/runScrapeProcess.js', args );

            proc.on( 'message', ( data:IPC<any> ) => {
                switch ( data.operation ) {
                    case 'error':
                        if ( this.activeRequest )
                            this.activeRequest.complete = false;

                        reject( new ComponentError( data ) );
                        break;
                    case 'requestUpdates':
                        this.activeRequest = data.payload as ScrapeRequest;
                        break;
                    default:
                        console.log( 'IPC-msg', JSON.stringify( data ) );
                        break;
                }
            });

            proc.on( 'close', ( _code: number, _args: any[] ) => {
                console.log( `${this.activeRequest?.uuid} completed` );
                resolve();
            });
        });
    }

    /**
     * @deprecated Experimental
     * @description simple attempt to run scrape interfaces in their own threads
     * @protected
     * MongooseError:
     * ```Operation `post-request.findOneAndUpdate()` buffering timed out after 10000ms
    at Timeout.<anonymous> (/home/mantos/workspace/personal-recruiter-suite/personal-recruiter-data-service/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:151:23)```
     *
     * the DB connection from the calling scope isn't dosen't seem to cross into the event handling scope
     */
    async altRun ():Promise<any> {
        const request:IScrapeRequest|undefined = this.dequeue();
        if ( request === undefined ) throw new ComponentError( 'No Scrape Request' );
        if ( request?.pageDepth === undefined ) throw new ComponentError( 'No Page Depth Set' );
        if ( request?.uuid === undefined ) throw new ComponentError( 'internal constraint failure' );

        const clArgs:string[] = [ request.uuid, '' + request.pageDepth, request.keyword ];
        if ( request.location )
            clArgs.push( request.location );

        const updateActiveRequest = async () => {
            if ( !this.connection.isConnected() )
                await this.connection.connect();

            console.log( 'periodic update' );
            if ( this.activeRequest !== undefined ) {
                await this.scrapeDao.upsert( this.activeRequest );
                await this.scrapeDao.updateMetrics( this.activeRequest );
            }
        };
        const periodicScrapeUpdate = setInterval( updateActiveRequest, 1000 * 60 );

        const createProcess = ( args:string[] ) => new Promise<void>( ( resolve, reject ) => {
            const proc = fork( './dist/src/runScrape.js', args );

            proc.on( 'message', ( data:IPC<any> ) => {
                const scraperRequest = data.payload as ScrapeRequest;

                switch ( data.operation ) {
                    case 'error':
                        if ( this.activeRequest )
                            this.activeRequest.complete = false;

                        reject( new ComponentError( data ) );
                        break;
                    case 'requestUpdates':
                        if ( this.activeRequest === undefined ) {
                            this.activeRequest = scraperRequest;
                        } else if ( this.activeRequest.metrics === undefined ) {
                            this.activeRequest.metrics = scraperRequest.metrics;
                        } else {
                            const update = scraperRequest.metrics[0];

                            let updated = false;
                            for ( const metric of this.activeRequest.metrics )
                                if ( metric !== undefined && metric.vendorDesc !== undefined &&
                                    update !== undefined && update.vendorDesc !== undefined &&
                                    metric.vendorDesc === update.vendorDesc ) {
                                    // break - eslint setting?
                                    metric.pageSize = update.pageSize;
                                    metric.numComplete = update.numComplete;
                                    metric.numTotal = update.numTotal;
                                    updated = true;
                                }

                            if ( !updated && update !== null && update !== undefined )
                                this.activeRequest.metrics.push( update );

                            // console.log('metric Request Update' + JSON.stringify(this.activeRequest.metrics));
                        }

                        break;
                    default:
                        console.log( 'IPC-msg', JSON.stringify( data ) );
                        break;
                }
            });

            proc.on( 'close', async ( _code: number, _args: any[] ) => {
                if ( this.activeRequest !== undefined ) {
                    await this.scrapeDao.upsert( this.activeRequest );
                    await this.scrapeDao.updateMetrics( this.activeRequest );
                }

                console.log( `${this.activeRequest?.uuid} completed` );
                clearInterval( periodicScrapeUpdate );
                resolve();
            });
        });
        const scrape1 = createProcess( [ 'IndeedPostScraper', ...clArgs ] );
        const scrape2 = createProcess( [ 'DicePostScraper', ...clArgs ] );

        return Promise.all( [ scrape1, scrape2 ] ).then( () => {
            console.log( 'individual Scrape processes completed' );
            return this.connection.disconnect();
        }).catch( () => {
            console.log( 'individual Scrape processes Failed!!' );
            return this.connection.disconnect();
        });
    }
}
