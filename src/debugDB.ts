import 'reflect-metadata';
import * as types from './types';
import PostData from './entity/PostData';
import { PostScrapeManager } from './scrape/PostScrapeManager';

import container from './DIBindings';
import fs from 'fs';
import path from 'path';

import mongoose, { Schema, model } from 'mongoose';
// import { PostDataModel, PostDataSchema } from './dao/MongoConnection';

/**
 * This is where we want to validate the new additions.
 * the ts-node integration is great for jest integration but debugging is problematic
 * this is the primary debug entry point for vs code
 */
console.log('Starting!!');
(async () => {
    mongoose.connection.on('error', console.log).on('disconnected', console.log).once('open', console.log);
    await mongoose.connect('mongodb://localhost:27017/', {
        user: 'root',
        pass: 'example',
        dbName: 'Rando',
    });
    const PostDataSchema = new Schema(
        {
            _id: Schema.Types.ObjectId,
            captureTime: { type: Date, required: true },
            title: { type: String, required: true },
            organization: { type: String, required: true, index: true },
            description: { type: String, required: true },
            location: { type: String, required: false, index: true },
            salary: { type: String, required: false },
            request: { type: mongoose.Schema.Types.ObjectId, ref: 'keyword-model' },
        },
        { collection: 'text-search' }
    );
    PostDataSchema.index(
        {
            title: 'text',
            description: 'text',
        },
        {
            name: 'main',
            weights: {
                title: 5,
                description: 10,
            },
            sparse: true,
        }
    );
    const PostDataModel = model('data-model', PostDataSchema);
    const RequestDataSchema = new Schema(
        {
            _id: Schema.Types.ObjectId,

            keyword: { type: String, required: true, index: true },
            posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'data-model' }],
        },
        { collection: 'text-keyword' }
    );
    const RequestModel = model('keyword-model', RequestDataSchema);

    const request = new RequestModel({
        _id: new mongoose.Types.ObjectId(),
        keyword: 'funky',
    });
    request.save();

    new PostDataModel({
        _id: new mongoose.Types.ObjectId(),
        captureTime: new Date(),
        title: 'Full Stack Software Engineer',
        description:
            'About the team The Zillow Group Engineering team is innovating on the next generation of real estate. We have the ability to transform the future of the industry with unmatched consumer reach to over 200 million users across our brands like Zillow, Trulia, and StreetEasy, and industry-leading platforms for employees and partner professionals who support our customers. We believe that creativity, collaboration, and innovation lead to success. We actively encourage our teams to learn about the business and share their ideas. We value “culture add” and promote a diverse and inclusive workplace! About the role As a Software Development Engineer, you will have an opportunity to: Ship code that directly impacts our customers as they dream, shop, and connect with',
        organization: 'Zillo',
        request: request._id,
    }).save();

    new PostDataModel({
        _id: new mongoose.Types.ObjectId(),
        captureTime: new Date(),
        title: 'Java Full Stack Developer',
        description:
            'Binary Logic IT is looking for Fresher’s Post Graduate students for Java Developer, It’s about time that you reach out to us and discuss if you are serious and hard working and willing to get a job as soon as possible. The curriculum has helped a number of our students find positions with Fortune 500 clients. We gurantee placement/get you to the project within 4 to 6 weeks. The candidates who are eligible for the training and placement: - . Who has valid work authorizartion ( OPT,CPT,H4EAD, GCEAD, GC, US Citizen). We sponsor H1B, and GC for qualified candidates. .Willing to put an extra effort to gain technical expertise in a short time. Benefits: We are offering a 7 Weeks training for Full Stack Java Developer. You will be enrolled for this training; It will start from Basics of Java to Advance Java. You also need to complete your online Project of 160 Hrs. You will be given these facilities . Free Classroom Training & Live Projects Free OCJP',
        organization: 'Binary Logic IT',
        request: request._id,
    }).save();

    PostDataModel.find({ $text: { $search: 'java' } }, { score: { $meta: 'textScore' } })
        .sort({
            score: { $meta: 'textScore' },
        })
        .populate('request')
        .exec((err, data) => {
            if (err) {
                console.warn(err);
            }
            console.log(data);
            mongoose.disconnect();
        });

    return 0;
})();
