import 'reflect-metadata';
import { assert, expect } from 'chai';
import { it } from 'mocha';
import container from '../src/util/DIBindings';
import { MongoConnection } from '../src/dao/MongoConnection';
import { ScrapeQueueRunner } from '../src/scrape/ScrapeQueueRunner';
import { IScrapeRequest } from '../src/types';

/**
 * This is where we want to validate the new additions.
 * the ts-node integration is great for jest integration but debugging is problematic
 * this is the primary debug entry point for vs code
 */
process.on('SIGINT', () => {
    // attempt graceful close of the search/scrape
    (async () => {
        console.log('shutting down the db connection');
        const conn = container.resolve(MongoConnection);
        await conn.disconnect();
    })();
});

// This flag should be stored as run configuration
// jest.setTimeout(1000 * 60 * 15);

it('Full Integration: will run the scrape queue with 1 request', async (done) => {
    setTimeout(done, 1000 * 60 * 10);
    const simpleSearch: IScrapeRequest = {
        keyword: 'full stack engineer',
        pageDepth: 1
    };

    const scrapeRunner: ScrapeQueueRunner = container.resolve(ScrapeQueueRunner);
    scrapeRunner.enqueue(simpleSearch);

    await scrapeRunner.runQueue();
});
