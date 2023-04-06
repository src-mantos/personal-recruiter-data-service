import 'reflect-metadata';
import { assert, expect } from 'chai';
import Mocha, { describe, it, before, after } from 'mocha';
import container from '../../src/util/DIBindings';
import ScrapeRequest from '../../src/entity/ScrapeRequest';
import { IScrapeRequest, IRunMetric } from '../../src/types';
import { MongoConnection, mongoDoc } from '../../src/dao/MongoConnection';
import { PostDao, PostDataModel } from '../../src/dao/PostDao';
import { ScrapeDao, ScrapeDataModel } from '../../src/dao/ScrapeDao';
import PostData from '../../src/entity/PostData';

let connection: MongoConnection;
// let postDao:PostDao;
// let scrapeDao:ScrapeDao;
before(async () => {
    connection = container.resolve(MongoConnection);
    connection.reconfig({ dbName: 'TEST' });
    return connection.connect();
});

after(async () => connection.disconnect());

describe('Sample Database Execution', async function (this:Mocha.Suite) {
    const postDao = container.resolve(PostDao);
    const scrapeDao = container.resolve(ScrapeDao);

    const request:ScrapeRequest = new ScrapeRequest({
        keyword: 'full stack engineer',
        location: 'Seattle, WA',
        pageDepth: 0
    });
    let requestDBO: mongoDoc<ScrapeRequest>;

    const postTempl = {
        directURL: 'http://www.google.com',
        title: 'shell test',
        location: 'nowhere',
        organization: 'noOne',
        description: 'nothing',
        captureTime: new Date(),
        postedTime: '',
        userModified: false
    };

    let postDBO: mongoDoc<PostData>;

    it('will create a "new" scrape request & save it to db', async () => {
        requestDBO = await scrapeDao.upsert(request);
        console.log(JSON.stringify(requestDBO));
        expect(request.uuid, `UUID: ${request.uuid}`).match(/[a-zA-z0-9]+(-[a-zA-z0-9]+)+/);
    });
    it('will create "new" post data & save it to db', async () => {
        const pd1 = new PostData({ ...postTempl });

        await postDao.upsert(pd1);

        if (requestDBO !== null) {
            requestDBO.posts.push(pd1);
            await scrapeDao.upsert(requestDBO);
        }
    });
    it('will create "new" post data & save it to db', async () => {
        const pd1 = new PostData({ ...postTempl, directURL: 'http://www.google.com/maps' });

        await postDao.upsert(pd1);

        if (requestDBO !== null) {
            requestDBO.posts.push(pd1);
            await scrapeDao.upsert(requestDBO);
        }
    });
});
