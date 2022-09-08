#!/usr/bin/env ts-node
import 'reflect-metadata';
import { ISearchQuery, IPostData } from './index';
import PostData from './entity/PostData';
import { PostScrapeManager } from './scrape/PostScrapeManager';

import container from './DIBindings';
import fs from 'fs';
import path from 'path';

import mongoose, { Schema, model } from 'mongoose';
import { MongoConnection } from './dao/MongoConnection';
import { PostDao } from './dao/PostDao';
// import { PostDataModel, PostDataSchema } from './dao/MongoConnection';

/**
 * This is where we want to validate the new additions.
 * the ts-node integration is great for jest integration but debugging is problematic
 * this is the primary debug entry point for vs code
 */
console.log('Starting!!');
(async () => {
    const connection = container.resolve(MongoConnection);
    const postDao = container.resolve(PostDao);
    await connection.connect();

    const query: ISearchQuery = {
        keywords: 'Senior'
    };
    const data: IPostData[] = await postDao.searchStoredData(query);
    const filePath = path.join(__dirname, 'debugQuery.json');

    fs.writeFile(filePath, JSON.stringify(data, null, 4), function (err) {
        let msg = filePath + ' Completed.';
        if (err) msg = err.message;
        console.log(msg);
    });
    console.log('done.');
    return 0;
})();
