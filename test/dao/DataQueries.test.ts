/* eslint-disable no-unused-expressions */
import 'reflect-metadata';
import { assert, expect } from 'chai';
import { it, before, after } from 'mocha';
import { IScrapeRequest, IRunMetric } from '../../src/types';
import container from '../../src/util/DIBindings';
import ScrapeRequest from '../../src/entity/ScrapeRequest';
import { ScrapeDao } from '../../src/dao/ScrapeDao';
import { MongoConnection } from '../../src/dao/MongoConnection';
import { PostDao } from '../../src/dao/PostDao';

let connection: MongoConnection;
before(() => {
    connection = container.resolve(MongoConnection);
    return connection.connect();
});

after(() => {
    return connection.disconnect();
});

it('pulling common posts', async () => {
    const scrapeDao:ScrapeDao = container.resolve(ScrapeDao);
    const data = await scrapeDao.findCommonPosts({
        count: { $gt: 2 }
    });
    console.log(data);
});

it.skip('checking post data facets', async () => {
    const postDao:PostDao = container.resolve(PostDao);
    const data = await postDao.getPostDataFacets();
    console.log(JSON.stringify(data));
});

// it('create new scrape & update it with metrics', async () => {
//     const scrapeDao:ScrapeDao = container.resolve(ScrapeDao);
//     const request = new ScrapeRequest({
//         keyword: 'test scrape request',
//         pageDepth: 3
//     });
//     await scrapeDao.upsert(request);
//     const metric1: IRunMetric = {
//         vendorDesc: 'UNIT',
//         numTotal: -1,
//         numComplete: -1,
//         pageSize: -1
//     };
//     request.metrics.push(metric1);
//     await scrapeDao.upsert(request);

//     const requestData = await scrapeDao.findRequest(request);
//     console.log('request', JSON.stringify(request));
//     console.log('requestData', JSON.stringify(requestData));
//     expect(requestData?.metrics.length).to.be.greaterThan(0);
// });
