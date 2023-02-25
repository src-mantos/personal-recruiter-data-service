/**
 * Fork Scrape Request Processing
 * @param uuid - process.argv[2]
 * @param pageDepth - process.argv[3]
 * @param keywords - process.argv[4]
 * @param location - process.argv[5]
 */
import 'reflect-metadata';
import { ISearchQuery, IScrapeRequest, IPostData, IPC } from './types';
import { MongoConnection } from './dao/MongoConnection';
import { ScrapeDao } from './dao/ScrapeDao';
import container from './util/DIBindings';
import ScrapeRequest from './entity/ScrapeRequest';
import { PostScraper } from './scrape/PostScraper';

const updateRequestInterval = 1000 * 10;
const pd = parseInt( process.argv[3] );

const request:IScrapeRequest = {
    uuid     : process.argv[2],
    keyword  : process.argv[4],
    pageDepth: ( isNaN( pd ) ) ? 0 : pd,
    location : process.argv[5]
};

const sendMessage = ( obj:IPC<any> ) => {
    if ( process && process.send )
        process.send( obj );// JSON.stringify(obj));
    else
        console.error( 'Unable to report to parent process.' );
};

/**
 * Scrape Process
 */
async function run () {
    console.log( 'starting child process' );
    const scrapeRequest: ScrapeRequest = new ScrapeRequest( request );
    sendMessage({
        operation: 'requestUpdates',
        payload  : scrapeRequest
    });

    /** initialize scrape interfaces */
    const scrapeInit = [];
    const interfaces:PostScraper[] = container.resolveAll( 'PostScraper' );
    for ( const inter of interfaces )
        scrapeInit.push( inter.init() );

    await Promise.all( scrapeInit );

    /** acquire database interfaces */
    const connection = container.resolve( MongoConnection );
    const scrapeDao = container.resolve( ScrapeDao );
    if ( !connection.isConnected() )
        await connection.connect();

    scrapeDao.upsert( scrapeRequest );

    /** start scrape */
    const scrapeComp = [];
    for ( const inter of interfaces )
        scrapeComp.push( inter.run( scrapeRequest ).catch( ( err ) => {
            console.info( 'Scrape interface Failure!', JSON.stringify( err ) );
        }) );


    /** periodic request & metric flush to db & calling process */
    let debounceDbUpdate = 1;
    const timer = setInterval( () => {
        ( async () => {
            sendMessage({
                operation: 'requestUpdates',
                payload  : scrapeRequest
            });
            if ( debounceDbUpdate % 9 === 0 )
                await scrapeDao.upsert( scrapeRequest );

            debounceDbUpdate++;
        })();
    }, updateRequestInterval );

    /** wait for run to complete and wrap up the thread */
    await Promise.all( scrapeComp );
    clearInterval( timer );
    scrapeRequest.complete = true;
    sendMessage({
        operation: 'requestUpdates',
        payload  : scrapeRequest
    });
    await scrapeDao.upsert( scrapeRequest );

    const scrapeDest = [];
    for ( const inter of interfaces )
        scrapeDest.push( inter.clearInstanceData() );

    await Promise.all( scrapeDest );

    await connection.disconnect();
}

if ( request.pageDepth > 0 && request.keyword !== undefined )
    run();

