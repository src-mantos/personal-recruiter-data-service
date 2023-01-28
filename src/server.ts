import 'reflect-metadata';

import express, { Request, Response } from 'express';
import expressWS from 'express-ws';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import cors from 'cors';
import container from './util/DIBindings';

import { ScrapePath, ScrapeRouter, DataPath, DataRouter, PostPath, PostRouter, applyWebSockets } from './util/serverRoutes';
import { MongoConnection } from './dao/MongoConnection';
/**
 * Main api runner
 */

const app = express();
const options = {
    info: {
        version    : '0.1.0',
        title      : 'Personal Recruiter Data Service',
        description: '',
        license    : { name: 'MIT' }
    },
    security: {
        BasicAuth: {
            type  : 'http',
            scheme: 'basic'
        }
    },
    baseDir              : __dirname,
    // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
    filesPattern         : [ './util/*.js', './types.d.ts' ],
    // URL where SwaggerUI will be rendered
    swaggerUIPath        : '/v1/docs',
    // Expose OpenAPI UI
    exposeSwaggerUI      : true,
    // Set non-required fields as nullable by default
    notRequiredAsNullable: false,
    // multiple option in case you want more that one instance
    multiple             : true
};
expressJSDocSwagger( app )( options );
const socket = expressWS( app );

const port = container.resolve( 'service_port' );
const mongo: MongoConnection = container.resolve( MongoConnection );
const basePath = '/v1';
const debugLogger = ( req: Request, res: Response, next: {():void}) => {
    const now = `${Date.now()} - `;
    console.log( `${Date.now()} - ${req.originalUrl}` );
    console.log( now + 'req.params', JSON.stringify( req.params ) );
    console.log( now + 'req.query', JSON.stringify( req.query ) );
    next();
};
const reqestLog = ( req: Request, res: Response, next: {():void}) => {
    const now = `${Date.now()} - `;
    console.log( now + [ req.method, req.originalUrl, JSON.stringify( req.params ), JSON.stringify( req.query ) ].join( ', ' ) );
    next();
};

export const init = ( async () => {
    app.use( express.json() );
    app.use( reqestLog );
    app.use( cors({ origin: 'http://localhost:8080' }) );

    app.use( basePath + ScrapePath, ScrapeRouter );
    app.use( basePath + DataPath, DataRouter );
    app.use( basePath + PostPath, PostRouter );
    applyWebSockets( socket );
    app.use( ( _req, res ) => res.status( 404 ).json({ message: "These are not the droids you're looking for." }) );

    const server = socket.app.listen( port, () => {
        console.log( `started http://localhost:${port}` );
        mongo.connect();
    });
    const shutdown = () => {
        console.log( 'SIG signal received: closing HTTP server' );
        server.close( () => {
            Promise.all( [mongo.disconnect()] ).then( () => { console.log( 'shutdown complete' ) });
        });
    };
    process.on( 'SIGTERM', shutdown );
    process.on( 'SIGINT', shutdown );
})();
