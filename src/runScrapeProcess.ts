/* eslint-disable no-undef */
import 'reflect-metadata';
import { ISearchQuery, IScrapeRequest, IPostData } from '.';

import { MongoConnection } from './dao/MongoConnection';
import { PostDao } from './dao/PostDao';
import { ScrapeDao } from './dao/ScrapeDao';
import container from './DIBindings';
import ScrapeRequest from './entity/ScrapeRequest';
import { PostScraper } from './scrape/PostScraper';

const pd = parseInt(process.argv[2]);
/**
 * Scrape Process
 * @param pageDepth - process.argv[2]
 * @param keywords - process.argv[3]
 * @param location - process.argv[4]
 */
const request:IScrapeRequest = {
    keyword: process.argv[3],
    pageDepth: (isNaN(pd)) ? 0 : pd,
    location: process.argv[4]
};

/**
 * temproary interface
 */
export interface IPC<T> {
    operation: 'userRequest'|'processMetrics'|'error'|'exit',
    payload: T
}

const sendMessage = (obj:IPC<any>) => {
    if (process && process.send) {
        process.send(JSON.stringify(obj));
    } else {
        console.error('Unable to report to parent process.');
    }
};

const updateRequestInterval = 1000 * 60 * 1.5;

async function run () {
    console.log('starting child process');
    const scrapeRequest: ScrapeRequest = new ScrapeRequest(request);
    sendMessage({
        operation: 'userRequest',
        payload: scrapeRequest
    });

    const scrapeInit = [];
    const interfaces:PostScraper[] = container.resolveAll('PostScraper');
    for (const inter of interfaces) {
        scrapeInit.push(inter.init());
    }
    await Promise.all(scrapeInit);

    const connection = container.resolve(MongoConnection);
    const scrapeDao = container.resolve(ScrapeDao);
    if (!connection.isConnected()) {
        await connection.connect();
    }
    scrapeDao.insert(scrapeRequest);

    const scrapeComp = [];
    for (const inter of interfaces) {
        scrapeComp.push(
            inter.run(scrapeRequest).catch((err) => {
                console.info('Scrape interface Failure!', JSON.stringify(err));
            })
        );
    }

    const timer = setInterval(() => {
        (async () => {
            console.log('updating active request', JSON.stringify(scrapeRequest));
            sendMessage({
                operation: 'userRequest',
                payload: scrapeRequest
            });
            await scrapeDao.update(scrapeRequest);
        })();
    }, updateRequestInterval);

    await Promise.all(scrapeComp);
    clearInterval(timer);
    scrapeRequest.complete = true;
    sendMessage({
        operation: 'userRequest',
        payload: scrapeRequest
    });
    await scrapeDao.update(scrapeRequest);

    const scrapeDest = [];
    for (const inter of interfaces) {
        scrapeDest.push(inter.clearInstanceData());
    }
    await Promise.all(scrapeDest);

    await connection.disconnect();
}

if (request.pageDepth > 0 && request.keyword !== undefined) {
    run();
}
