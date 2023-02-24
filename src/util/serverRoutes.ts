/** @Deprecated This file will be deleted */

import express, { Request, Response } from 'express';
import expressWS from 'express-ws';
import { check, ValidationError, validationResult } from 'express-validator';

import container from './DIBindings';
import { ScrapeQueueRunner } from '../scrape/ScrapeQueueRunner';

import { IScrapeRequest, ISearchQuery, IPostData, IPostMetaData } from '../types';
import { PostDao } from '../dao/PostDao';
import { ScrapeDao } from '../dao/ScrapeDao';
import ScrapeRequest from '../entity/ScrapeRequest';
import PostData from '../entity/PostData';

export const ScrapePath = '/scrape';
export const DataPath = '/data';
export const PostPath = '/post';
export const ScrapeRouter = express.Router();
export const DataRouter = express.Router();
export const PostRouter = express.Router();

const scrapeRunner: ScrapeQueueRunner = container.resolve( ScrapeQueueRunner );
const postDao: PostDao = container.resolve( PostDao );
const scrapeDao: ScrapeDao = container.resolve( ScrapeDao );

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
ScrapeRouter.get(
    '/',
    check( 'keyword', 'keywords are required to search for posts' ).exists()
        .not()
        .isEmpty(),
    check( 'pageDepth' ).isInt()
        .optional({ checkFalsy: true })
        .escape(),
    ( req: Request, res: Response ) => {
        const errors = validationResult( req );
        if ( !errors.isEmpty() )
            res.status( 400 ).json( errors );


        let query: IScrapeRequest = req.query as unknown as IScrapeRequest;
        if ( !query.pageDepth ) query.pageDepth = 1;

        query = scrapeRunner.enqueue( query );
        res.json( query );
    }
);

/**
 * GET /v1/scrape/status/
 * @summary Getting the current state of the scrape queue. if running/active the first result will contain run metrics
 * @tags scrape
 * @return {IScrapeRequest[]} 200 - success response - application/json
 * @return {object} 500 - validation response - application/json
 */
ScrapeRouter.get(
    '/status',
    ( _req: Request, res: Response ) => {
        try {
            res.json( scrapeRunner.getQueueStatus() );
            res.status( 200 );
        } catch ( ex ) {
            res.json( ex );
            res.status( 500 );
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
ScrapeRouter.delete(
    '/:uuid',
    check( 'uuid', 'Request UUID Required' ).exists()
        .not()
        .isEmpty(),
    ( req: Request, res: Response ) => {
        const errors = validationResult( req );
        if ( !errors.isEmpty() ) {
            res.status( 500 ).json( errors );
            return;
        }
        try {
            const data = req.params.uuid;
            console.log( req.params );
            if ( data ) {
                const isRemoved = scrapeRunner.removeFromQueue( data );
                res.json( isRemoved );
                res.status( 200 );
            }
        } catch ( ex ) {
            console.error( ex );
            res.status( 500 );
        }
        res.status( 404 );
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
ScrapeRouter.patch(
    '/run',
    async ( _req: Request, res: Response ) => {
        try {
            scrapeRunner.runQueue();
            res.status( 200 );
            res.json( scrapeRunner.activeRequest );
        } catch ( ex ) {
            res.json( ex );
            res.status( 500 );
        }
        res.status( 404 );
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
DataRouter.get(
    '/request',
    check( 'uuid', 'Request UUID Required' ).exists()
        .not()
        .isEmpty(),
    async ( req: Request, res: Response ) => {
        const errors = validationResult( req );
        if ( !errors.isEmpty() ) {
            res.status( 500 ).json( errors );
            return;
        }
        try {
            res.status( 202 );
            const request:IScrapeRequest = req.query as unknown as IScrapeRequest;
            const data = await scrapeDao.findRequest( request );
            if ( data ) {
                const results = await postDao.getRequestData( data );
                res.json({
                    ...data,
                    data: results
                });
            } else {
                res.json( data );
            }
            res.status( 200 );
        } catch ( ex ) {
            console.error( ex );
            res.status( 500 );
        }
        res.status( 404 );
    }
);

/**
 * POST /v1/data/search/
 * @summary Pulls stored request and post data
 * @tags data
 * @param {ISearchQuery} request.body.required //searchFilters.query.required -
 * @return {IPostData[]} 200 - success response - application/json
 * @return {Result<object>} 400 - validation response - application/json
 */
DataRouter.post(
    '/search',
    // check( 'keywords', 'keywords are required to search for posts' )
    //     .exists()
    //     .not()
    //     .isEmpty(),
    async ( req: Request, res: Response ) => {
        const errors = validationResult( req );
        if ( !errors.isEmpty() )
            res.status( 400 ).json( errors );


        const query: Partial<ISearchQuery> = req.body as unknown as Partial<ISearchQuery>;
        let results:PostData[] = [];
        if ( query.keywords !== undefined && query.keywords !== '' )
            results = await postDao.textSearch( query as ISearchQuery );
        // else
        //     results = await postDao.getAllPosts( query );


        res.json( results );
    }
);

/**
 * GET /v1/data/getCommonData/
 * @summary Pulls post data based on "commonality"
 * @tags data
 * @return {IPostData[]} 200 - success response - application/json
 * @return 500
 */
DataRouter.get(
    '/getCommonData',
    async ( req: Request, res: Response ) => {
        const results = await scrapeDao.findCommonPosts();

        res.json( results );
    }
);

/**
 * GET /v1/data/getPostFacet/
 * @summary Pulls post data based on "commonality"
 * @tags data
 * @return {tmp[]} 200 - success response - application/json
 * @return 500
 */
DataRouter.get(
    '/getPostFacet',
    async ( req: Request, res: Response ) => {
        const results = await postDao.getPostDataFacets();

        res.json( results );
    }
);


/**
 * POST /v1/post/update
 * @summary Updates post data entry records
 * @tags post
 * @param {IPostData} request.body.required
 * @return {PostData} 200
 */
PostRouter.post( '/update/', async ( req: Request, res: Response ) => {
    const update = req.body as IPostData;
    console.log( update );
    const result = await postDao.updatePostById( update );
    res.status( 200 ).json( result );
});
/**
 * GET /v1/post/{id}
 * @summary lookup post data?
 * @tags post
 * @param {string} id.query.required
 * @return {PostData} 200
 */
PostRouter.get( '/:id', async ( req: Request, res: Response ) => {
    const result = await postDao.getPostById( req.query.id );
    res.json( result );
});

/**
 * @deprecated sockets add an extra layer of complexity not required for an educational project
 * @param server
 */
export const applyWebSockets = ( server:expressWS.Instance ) => {
    server.app.ws( '/v1/scrape/status/', function ( ws, req ) {
        // ws.emit("message")
        const timer = setInterval( () => {
            ws.emit( 'message', scrapeRunner.getQueueStatus() );
        }, 1000 );

        ws.addEventListener( 'close', ( event ) => {
            clearInterval( timer );
        });
        console.log( 'Connected To Socket' );
    });
};
