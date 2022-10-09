/* eslint-disable no-undef */
import 'reflect-metadata';

import container from '../../src/DIBindings';
import ScrapeRequest from '../../src/entity/ScrapeRequest';
import { ScrapeDao } from '../../src/dao/ScrapeDao';
import { IRunMetric } from '../../src';

// This flag should be stored as run configuration
jest.setTimeout(1000 * 60 * 1);

const simpleSearch: ScrapeRequest = new ScrapeRequest({
    keyword: 'full stack engineer',
    location: 'Seattle, WA',
    pageDepth: 1 /* this includes underling pagination handling and is required minimum for testing any scraper */
});

let scrapeDao: ScrapeDao;
beforeAll(() => {
    scrapeDao = container.resolve(ScrapeDao);
    return scrapeDao.connection.connect();
});

afterAll(() => {
    return scrapeDao.connection.disconnect();
});

it('pulling scrape requests by UUID', async () => {
    let requestData = await scrapeDao.findRequest('7b066efe-d225-496a-97ee-3f0ed2d593fc');
    expect(requestData?.keyword).not.toBeUndefined();
    console.log('7b066efe-d225-496a-97ee-3f0ed2d593fc', JSON.stringify(requestData));

    requestData = await scrapeDao.findRequest('3f542ae2-9579-4b06-90ac-09ee75e60782');
    expect(requestData?.keyword).not.toBeUndefined();
    console.log('3f542ae2-9579-4b06-90ac-09ee75e60782', JSON.stringify(requestData));

    requestData = await scrapeDao.findRequest('658ff9b2-e1ae-44d5-91c5-29b500a85541');
    expect(requestData?.keyword).not.toBeUndefined();
    console.log('658ff9b2-e1ae-44d5-91c5-29b500a85541', JSON.stringify(requestData));
});

it('create new scrape & update it with metrics', async () => {
    const request = new ScrapeRequest({
        keyword: 'test scrape request',
        pageDepth: 3
    });
    await scrapeDao.insert(request);
    const metric1: IRunMetric = {
        vendorDesc: 'UNIT',
        numTotal: -1,
        numComplete: -1,
        pageSize: -1
    };
    request.metrics.push(metric1);
    await scrapeDao.upsert(request);

    const requestData = await scrapeDao.findRequest(request);
    console.log('request', JSON.stringify(request));
    console.log('requestData', JSON.stringify(requestData));
    expect(requestData?.metrics.length).toBeGreaterThan(0);
});
