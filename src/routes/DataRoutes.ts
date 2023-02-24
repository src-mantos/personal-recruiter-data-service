import express, { Request, Response } from 'express';
import expressWS from 'express-ws';
import { check, ValidationError, validationResult } from 'express-validator';

import container from '../util/DIBindings';
import { ScrapeQueueRunner } from '../scrape/ScrapeQueueRunner';

import { IScrapeRequest, ISearchQuery, IPostData, IPostMetaData } from '../types';
import { PostDao } from '../dao/PostDao';
import { ScrapeDao } from '../dao/ScrapeDao';
import ScrapeRequest from '../entity/ScrapeRequest';
import PostData from '../entity/PostData';


export const DataPath = '/data';
export const PostPath = '/post';

export const DataRouter = express.Router();
export const PostRouter = express.Router();

const postDao: PostDao = container.resolve( PostDao );
const scrapeDao: ScrapeDao = container.resolve( ScrapeDao );

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
    check( 'keywords', 'keywords are required to search for posts' ).exists(),
    async ( req: Request, res: Response ) => {
        const errors = validationResult( req );
        if ( !errors.isEmpty() )
            res.status( 400 ).json( errors );


        const query: ISearchQuery = req.body as unknown as ISearchQuery;
        let results:PostData[];
        if ( query.keywords !== undefined && query.keywords !== '' )
            results = await postDao.textSearch( query );
        else
            results = await postDao.getAllPosts( query );


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
 * @return {object} 200 - success response - application/json
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
 * @param {string} id.path.required
 * @return {PostData} 200
 */
PostRouter.get( '/:id', async ( req: Request, res: Response ) => {
    const result = await postDao.getPostById( req.params.id );
    res.json( result );
});
