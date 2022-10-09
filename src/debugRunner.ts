/* eslint-disable no-undef */
import 'reflect-metadata';
import { IPC, ISearchQuery } from '.';

import { spawn, fork } from 'child_process';
import container from './DIBindings';
import { MongoConnection } from './dao/MongoConnection';

process.on('SIGINT', () => {
    // attempt graceful close of the search/scrape
    (async () => {
        console.log('shutting down IPC');
    })();
});

(async () => {
    const args = ['1', 'Senior Springboot React', 'Seattle, WA'];
    const execProcess = fork('./dist/src/runScrapeProcess.js', args); // 'node', ['-r', 'source-map-support/register',

    execProcess.on('spawn', () => {
        console.log('spawn on spawn');
    });
    execProcess.on('data', (data) => {
        console.log(`spawn data message: ${data}`);
    });
    execProcess.on('message', (data:IPC<any>) => {
        // 'userRequest'|'processMetrics'|'error'|'exit'
        if (data.operation === 'exit') {
            execProcess.kill('SIGINT');
        }
        console.log(`message: ${data}`);
    });

    execProcess.on('exit', (code, signal) => {
        console.log(`spawn on exit code: ${code} signal: ${signal}`);
        const connection = container.resolve(MongoConnection);
        connection.disconnect();
    });
    execProcess.on('close', (code: number, args: any[]) => {
        console.log(`spawn on close code: ${code} args: ${args}`);
    });
})();
