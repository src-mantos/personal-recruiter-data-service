import express, { Request, Response } from 'express';
import { check, ValidationError, validationResult } from 'express-validator';

import container from './DIBindings';
import { ScrapeQueueRunner } from './scrape/ScrapeQueueRunner';

import { IScrapeRequest, ISearchQuery } from '.';
import { PostDao } from './dao/PostDao';
import { ScrapeDao } from './dao/ScrapeDao';

export const ScrapePath = '/scrape';
export const DataPath = '/data';
export const ScrapeRouter = express.Router();
export const DataRouter = express.Router();

const scrapeRunner: ScrapeQueueRunner = container.resolve(ScrapeQueueRunner);
const postDao: PostDao = container.resolve(PostDao);
const scrapeDao: ScrapeDao = container.resolve(ScrapeDao);

/**
 * GET /v1/scrape/
 * @summary Submit Scrape Request for processing
 * @tags scrape
 * @param {string} keyword.query.required - Search Keywords
 * @param {number} pageDepth.query - scrape depth
 * @param {string} location.query - Location (city, st)
 * @return {IScrapeRequest} 200 - success response - application/json
 * @return {Result<object>} 400 - validation response - application/json
 */
ScrapeRouter.get('/',
    check('keyword', 'keywords are required to search for posts').exists().not().isEmpty(),
    check('pageDepth').isInt().optional({ checkFalsy: true }).escape(),
    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json(errors);
        }

        let query: IScrapeRequest = req.query as unknown as IScrapeRequest;
        if (!query.pageDepth) query.pageDepth = 1;

        query = scrapeRunner.enqueue(query);
        res.json(query);
    }
);

/**
 * GET /v1/scrape/status/
 * @summary Getting the current state of the scrape queue. if running/active the first result will contain run metrics
 * @tags scrape
 * @return {IScrapeRequest[]} 200 - success response - application/json
 * @return {object} 500 - validation response - application/json
 */
ScrapeRouter.get('/status',
    (_req: Request, res: Response) => {
        try {
            res.json(scrapeRunner.getQueueStatus());
            res.status(200);
        } catch (ex) {
            res.json(ex);
            res.status(500);
        }
    }
);

/**
 * DELETE /v1/scrape/{uuid}
 * @summary Delete a scrape request by uuid from the request queue
 * @tags scrape
 * @param {string} uuid.path.required - Search Keywords
 * @return 200 - success response - application/json
 * @return {string} 404 - request not found - application/json
 * @return {Result<object>} 500 - validation response - application/json
 */
ScrapeRouter.delete('/:uuid',
    check('uuid', 'Request UUID Required').exists().not().isEmpty(),
    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(500).json(errors);
            return;
        }
        try {
            const data = req.params.uuid;
            console.log(req.params);
            if (data) {
                const isRemoved = scrapeRunner.removeFromQueue(data);
                res.json(isRemoved);
                res.status(200);
            }
        } catch (ex) {
            console.error(ex);
            res.status(500);
        }
        res.status(404);
    }
);

/**
 * PATCH /v1/scrape/run/
 * @summary Starts the queue
 * @tags scrape
 * @return 200 - success response - application/json
 * @return {string} 404 - request not found - application/json
 * @return {object} 500 - validation response - application/json
 */
ScrapeRouter.patch('/run',
    async (_req: Request, res: Response) => {
        try {
            scrapeRunner.runQueue();
            res.json(scrapeRunner.activeRequest);
        } catch (ex) {
            res.json(ex);
            res.status(500);
        }
        res.status(404);
    }
);

/**
 * GET /v1/data/request/
 * @summary Pulls stored request and post data
 * @tags data
 * @param {string} uuid.query.required - Search Keywords
 * @return {IScrapeRequest} 200 - success response - application/json
 * @return {string} 404 - request not found - application/json
 * @return {Result<object>} 500 - validation response - application/json
 */
DataRouter.get('/request',
    check('uuid', 'Request UUID Required').exists().not().isEmpty(),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(500).json(errors);
            return;
        }
        try {
            const request:IScrapeRequest = req.query as unknown as IScrapeRequest;
            const data = await scrapeDao.findRequest(request);
            if (data) {
                const results = await postDao.getRequestData('' + data._id);
                res.json({
                    ...data,
                    data: results
                });
            } else {
                res.json(data);
            }
        } catch (ex) {
            console.error(ex);
            res.status(500);
        }
        res.status(404);
    }
);

/**
 * GET /v1/data/search/
 * @summary Pulls stored request and post data
 * @tags data
 * @param {string} keywords.query.required - Search Keywords
 * @return {IPostData[]} 200 - success response - application/json
 * @return {Result<object>} 400 - validation response - application/json
 */
DataRouter.get('/search',
    check('keywords', 'keywords are required to search for posts').exists().not().isEmpty(),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json(errors);
        }

        const query: ISearchQuery = req.query as unknown as ISearchQuery;
        const results = await postDao.searchStoredData(query);

        res.json(results);
    }
);
