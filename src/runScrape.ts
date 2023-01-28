/**
 * Fork Scrape Run Request
 * @param scraper - process.argv[2]
 * @param uuid - process.argv[3]
 * @param pageDepth - process.argv[4]
 * @param keywords - process.argv[5]
 * @param location - process.argv[6]
 */
import 'reflect-metadata';
import { ISearchQuery, IScrapeRequest, IPostData, IPC } from './types';

import { MongoConnection } from './dao/MongoConnection';
import { PostDao } from './dao/PostDao';
import { ScrapeDao } from './dao/ScrapeDao';
import container from './util/DIBindings';
import ScrapeRequest from './entity/ScrapeRequest';
import { PostScraper } from './scrape/PostScraper';
import { DicePostScraper } from './scrape/impl/DicePostScraper';
import { IndeedPostScraper } from './scrape/impl/IndeedPostScraper';

const updateRequestInterval = 1000 * 10;
const pd = parseInt(process.argv[4]);
const scraper = process.argv[2];

const request:IScrapeRequest = {
    uuid: process.argv[3],
    keyword: process.argv[5],
    pageDepth: (isNaN(pd)) ? 0 : pd,
    location: process.argv[6]
};

const sendMessage = (obj:IPC<any>) => {
    if (process && process.send) {
        process.send(obj);// JSON.stringify(obj));
    } else {
        console.error('Unable to report to parent process.');
    }
};

export enum ParallelScrapers {
    DicePostScraper='DicePostScraper',
    IndeedPostScraper='IndeedPostScraper'
}

/**
 * Scrape Process
 */
async function run () {
    console.log('starting child process');
    const scrapeRequest: ScrapeRequest = new ScrapeRequest(request);

    /** initialize scrape interface for thread */
    let scrapeInterface:PostScraper;
    switch (scraper) {
        case ParallelScrapers.DicePostScraper:
            scrapeInterface = container.resolve(DicePostScraper);
            break;
        case ParallelScrapers.IndeedPostScraper:
            scrapeInterface = container.resolve(IndeedPostScraper);
            break;
        default:
            throw new Error('unable to run either scraper, none were specified');
    }
    await scrapeInterface.init();

    /** acquire database interfaces */
    const connection = container.resolve(MongoConnection);
    // const scrapeDao = container.resolve(ScrapeDao);
    if (!connection.isConnected()) {
        await connection.connect();
    }

    /** periodic request updates to calling process */
    const timer = setInterval(() => {
        (async () => {
            sendMessage({
                operation: 'requestUpdates',
                payload: scrapeRequest
            });
        })();
    }, updateRequestInterval);

    /**
     * wait for run to complete and wrap up the thread
     **/
    await scrapeInterface.run(scrapeRequest).catch((err) => {
        console.info('Scrape interface Failure!', JSON.stringify(err));
    });
    clearInterval(timer);
    scrapeRequest.complete = true;
    sendMessage({
        operation: 'requestUpdates',
        payload: scrapeRequest
    });
    // await scrapeDao.upsert(scrapeRequest);
    await scrapeInterface.clearInstanceData();
    await connection.disconnect();
}

if (request.pageDepth > 0 && request.keyword !== undefined) {
    run();
}
