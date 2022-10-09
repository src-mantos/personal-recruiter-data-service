import 'reflect-metadata';

import express, { Request, Response } from 'express';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import container from './DIBindings';

import { ScrapePath, ScrapeRouter, DataPath, DataRouter } from './serverRoutes';
import { MongoConnection } from './dao/MongoConnection';
/**
 * Main api runner
 */

const app = express();
const options = {
    info: {
        version: '0.1.0',
        title: 'Personal Recruiter Data Service',
        license: {
            name: 'MIT'
        }
    },
    security: {
        BasicAuth: {
            type: 'http',
            scheme: 'basic'
        }
    },
    baseDir: __dirname,
    // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
    filesPattern: ['./*.js', './index.d.ts'],
    // URL where SwaggerUI will be rendered
    swaggerUIPath: '/v1/docs',
    // Expose OpenAPI UI
    exposeSwaggerUI: true,
    // Set non-required fields as nullable by default
    notRequiredAsNullable: false,
    // multiple option in case you want more that one instance
    multiple: true
};
expressJSDocSwagger(app)(options);

const port = container.resolve('service_port');
const mongo: MongoConnection = container.resolve(MongoConnection);
const basePath = '/v1';
const basicLogger = (req: Request, res: Response, next: {():void}) => {
    const now = `${Date.now()} - `;
    console.log(`${Date.now()} - ${req.originalUrl}`);
    console.log(now + 'req.params', JSON.stringify(req.params));
    console.log(now + 'req.query', JSON.stringify(req.query));
    next();
};

export const init = (async () => {
    app.use(express.json());
    app.use(basicLogger);

    app.use(basePath + ScrapePath, ScrapeRouter);
    app.use(basePath + DataPath, DataRouter);
    app.use((_req, res) => res.status(404).json({ message: "These are not the droids you're looking for." }));

    const server = app.listen(port, () => {
        console.log(`started http://localhost:${port}`);
        mongo.connect();
    });
    const shutdown = () => {
        console.log('SIG signal received: closing HTTP server');
        server.close(() => {
            Promise.all([mongo.disconnect()]).then(() => { console.log('shutdown complete'); });
        });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
})();
