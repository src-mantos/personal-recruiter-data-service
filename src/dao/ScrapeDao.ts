import { MongoConnection, Dao, mongoDoc } from './MongoConnection';
import mongoose, { Schema, model, Model, connect, Types, FilterQuery } from 'mongoose';
import { inject, injectable } from 'tsyringe';

import type { IScrapeRequest, IPostData, IVendorMetadata, ISearchQuery } from '../types';

import ScrapeRequest from '../entity/ScrapeRequest';

const ScrapeDataSchema = new Schema<ScrapeRequest>(
    {
        _id: Schema.Types.ObjectId,
        uuid: { type: String, required: true, index: true },
        requestTime: { type: Date, required: true },
        keyword: { type: String, required: true },
        location: { type: String, required: false },
        pageDepth: { type: Number, required: true },
        complete: { type: Boolean, required: true },
        metrics: Schema.Types.Mixed,
        posts: [{ type: Schema.Types.ObjectId, ref: 'post-data' }]

        /** [
            {
                vendorDesc: { type: String, required: true },
                numTotal: { type: Number, required: true },
                numComplete: { type: Number, required: true },
                pageSize: { type: Number, required: true },
            },
        ] */
    },
    { collection: 'post-request' }
);
export const ScrapeDataModel = model('post-request', ScrapeDataSchema);

export type aggrigateData = {
    _id: mongoose.Types.ObjectId;
    count: number;
    post:IPostData;
}

/**
 * Under the current implementation we assume the database has been connected too, elsewhere.
 */
@injectable()
export class ScrapeDao implements Dao<ScrapeRequest> {
    connection: MongoConnection;
    constructor (@inject('MongoConnection') connection: MongoConnection) {
        this.connection = connection;
    }

    // async insert (entity: ScrapeRequest | IScrapeRequest): Promise<void> {
    //     const shell = new ScrapeRequest(entity);
    //     if (!shell._id) {
    //         shell._id = new mongoose.Types.ObjectId();
    //     }
    //     await new ScrapeDataModel(shell).save();
    // }

    async update (entity: ScrapeRequest): Promise<mongoDoc<ScrapeRequest>> {
        return ScrapeDataModel.findByIdAndUpdate(entity._id, entity).exec();
    }

    async upsert (entity: ScrapeRequest): Promise<mongoDoc<ScrapeRequest>> {
        const doc = await ScrapeDataModel.findOneAndUpdate({ uuid: entity.uuid }, entity, { upsert: true, new: true, lean: true }).exec();
        entity._id = doc._id;
        return doc;
    }

    async delete (entity: ScrapeRequest): Promise<mongoDoc<ScrapeRequest>> {
        if (entity._id !== undefined) {
            return ScrapeDataModel.findByIdAndDelete(entity._id).exec();
        } else {
            return ScrapeDataModel.findOneAndDelete({ uuid: entity.uuid }).exec();
        }
    }

    /**
     * Retrieves scrape request from db
     * @param entity - uuid required
     * @returns {ScrapeRequest | null}
     */
    async findRequest (entity: ScrapeRequest | IScrapeRequest | string): Promise<ScrapeRequest | null> {
        if (typeof entity === 'string') {
            const refId = entity;
            return ScrapeDataModel.findOne({ uuid: refId }).lean().populate('metrics').exec();
        } else {
            return ScrapeDataModel.findOne({ uuid: entity.uuid }).lean().populate('metrics').exec();
        }
        // return results;
    }

    /**
     * Aggrigates the Post data across Requests.
     * @param matchQuery - optional match expression
     * @returns {aggrigateData}
     */
    async findCommonPosts (matchQuery?:mongoose.Expression | Record<string, mongoose.Expression>) : Promise<aggrigateData[]> {
        const aggFunc = ScrapeDataModel.aggregate()
            .unwind('$posts')
            .project({
                _id: '$posts',
                req_id: '$_id',
                post_id: '$posts'
            })
            .group({
                _id: '$post_id',
                count: { $sum: 1 }
            });

        if (matchQuery) {
            aggFunc.match(matchQuery);
        }

        aggFunc.lookup({
            from: 'post-data',
            localField: '_id',
            foreignField: '_id',
            as: 'post'
        }).unwind('$post');

        // { $replaceRoot: { newRoot: { $mergeObjects: [ { _id: "$_id", first: "", last: "" }, "$name" ] } } }
        aggFunc.replaceRoot({ $mergeObjects: [{ count: '$count' }, '$post'] });

        return aggFunc.exec();
    }
}
