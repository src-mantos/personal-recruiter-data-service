import 'reflect-metadata';
import http from 'http';
import express, { Request, Response } from 'express';
import Router from 'express-promise-router';
import { check, param, validationResult, CustomValidator } from 'express-validator';

import { PostScrapeManager } from './scrape/PostScrapeManager';
import container from './DIBindings';

import ScrapeRequest from './entity/ScrapeRequest';
import PostData from './entity/PostData';
import { IPostDataScrapeRequest, IPostDataSearchRequest } from '.';
import { PostDao } from './dao/PostDao';
import { ScrapeDao } from './dao/ScrapeDao';
import { MongoConnection } from './dao/MongoConnection';

/**
 * This is where we want to validate the new additions.
 * the ts-node integration is great for jest integration but debugging is problematic
 * this is the primary debug entry point for vs code
 */

const app = express();
const port = 3000; //process.env.PORT || 3000;
process.setMaxListeners(0);

const manager: PostScrapeManager = container.resolve(PostScrapeManager);
const postDao: PostDao = container.resolve(PostDao);
const scrapeDao: ScrapeDao = container.resolve(ScrapeDao);
const mongo: MongoConnection = container.resolve(MongoConnection);

process.on('SIGINT', () => {
    //attempt graceful close of the search/scrape
    (async () => {
        console.log('shutting down the db connection');
        await mongo.disconnect();
    })();
});

/** quick and dirty async routing */
const scrape = Router();
const post = Router();
const search = Router();

scrape.get(
    '/',
    /*Sanitization Chain*/
    [
        check('keyword', 'keywords are required to search for posts').exists().not().isEmpty(),
        check('pageDepth').isInt().optional({ checkFalsy: true }).escape(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json(errors);
        }

        const query: IPostDataScrapeRequest = req.query as unknown as IPostDataScrapeRequest;
        if (!query.pageDepth) query.pageDepth = 1;

        try {
            //manager.processRequest(query);
            const uuid = manager.queueRequest(query);
            query.uuid = uuid;
            res.json(query);
        } catch (ex) {
            console.error(ex);
            res.status(500);
        }

        res.status(400);
    }
);
scrape.get('/status', async (_req: Request, res: Response) => {
    try {
        res.json(manager.getQueueStatus());
    } catch (ex) {
        console.error(ex);
        res.status(500);
    }
    res.status(404);
});
scrape.get('/active', async (_req: Request, res: Response) => {
    // try {
    //     res.json(manager.activeRequest);
    // } catch (ex) {
    //     console.error(ex);
    //     res.status(500);
    // }
    res.status(404);
});
scrape.get('/isRunning', async (_req: Request, res: Response) => {
    try {
        console.log(manager.isRunning());
        res.json(manager.isRunning());
    } catch (ex) {
        console.error(ex);
        res.status(500);
    }
    res.status(404);
});
scrape.patch('/run', async (_req: Request, res: Response) => {
    try {
        if (manager.workQueue.length > 0) {
            manager.runPromiseQueue();
        }
        res.json(manager.activeRequest);
    } catch (ex) {
        console.error(ex);
        res.status(500);
    }
    res.status(404);
});
/** if we want to keep, will need to put under the post/data route */
post.get('/:uuid', async (req: Request, res: Response) => {
    try {
        const data = await scrapeDao.findRequest(req.params.uuid);
        if (data) {
            const results = await postDao.getRequestData(data._id);
            res.json({
                ...data,
                data: results,
            });
        } else {
            res.json(data);
        }
    } catch (ex) {
        console.error(ex);
        res.status(500);
    }
    res.status(404);
});

scrape.delete('/:uuid', async (req: Request, res: Response) => {
    try {
        const data = req.params.uuid;
        let success = false;
        if (data) {
            success = manager.removeFromQueue(data);
        }
        res.status(200);
        res.json([success]);
    } catch (ex) {
        console.error(ex);
        res.status(500);
    }
    res.status(404);
});

search.get(
    '/',
    [check('keywords', 'keywords are required to search for posts').exists().not().isEmpty()],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json(errors);
        }

        const query: IPostDataSearchRequest = req.query as unknown as IPostDataSearchRequest;
        const results = await postDao.searchStoredData(query);

        // const results = await mongo.//search(requstSearch);
        res.json(results);
    }
);

export const init = (async () => {
    app.use(express.json());
    app.get('/', async (_req, res) => {
        setTimeout(() => {
            res.json({ hello: 'world' });
        }, 1000);
    });

    app.use('/scrape', scrape);
    app.use('/data', post);
    app.use('/search', search);
    app.use((_req, res) => res.status(404).json({ message: "These are not the droids you're looking for." }));

    const server = app.listen(port, () => {
        console.log(`MikroORM express TS example started at http://localhost:${port}`);
        mongo.connect();
    });
})();
