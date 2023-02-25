import { MongoConnection, Dao, mongoDoc } from './MongoConnection';
import mongoose, { Schema, model } from 'mongoose';
import { inject, injectable } from 'tsyringe';

import type { IScrapeRequest, IPostData, IVendorMetadata, ISearchQuery } from '../types';

import ScrapeRequest from '../entity/ScrapeRequest';

const ScrapeDataSchema = new Schema<ScrapeRequest>(
    {
        _id        : Schema.Types.ObjectId,
        uuid       : { type: String, required: true, index: true },
        requestTime: { type: Date, required: true },
        keyword    : { type: String, required: true },
        location   : { type: String, required: false },
        pageDepth  : { type: Number, required: true },
        complete   : { type: Boolean, required: true },
        metrics    : Schema.Types.Mixed,
        posts      : [{ type: Schema.Types.ObjectId, ref: 'post-data' }]

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
ScrapeDataSchema.pre( 'save', function ( this, next ) {
    next();
});

export const ScrapeDataModel = model( 'post-request', ScrapeDataSchema );

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
    constructor ( @inject( 'MongoConnection' ) connection: MongoConnection ) {
        this.connection = connection;
    }

    /**
     * -The upset method will no longer support updating it's run metrics. @see {updateMetrics}-
     * experimenting with parallelism, after an initial insert we would only update the
     * posts associated to the request and run metrics.
     * @param entity - ScrapeRequest
     * @returns {mongoDoc<ScrapeRequest>}
     */
    async upsert ( entity: ScrapeRequest ): Promise<mongoDoc<ScrapeRequest>> {
        const { _id, complete, keyword, pageDepth, posts, uuid, location, requestTime, metrics } = entity;
        const updateObject:mongoose.UpdateQuery<ScrapeRequest> = {
            $set     : { complete, keyword, pageDepth, _id, uuid, location, requestTime, metrics },
            $addToSet: { posts }
        };

        const doc = await ScrapeDataModel.findOneAndUpdate(
            { uuid: entity.uuid },
            updateObject,
            { upsert: true, new: true, lean: true }
        ).exec();
        entity._id = doc._id;

        return doc;
    }

    /**
     * @experimental
     * a one-off method to only support updates to a request's metrics.
     * [consider refactor with more practical experience in mongo]
     * @param entity - ScrapeRequest
     * @returns {mongoDoc<ScrapeRequest> | null}
     */
    async updateMetrics ( entity: ScrapeRequest ): Promise<mongoDoc<ScrapeRequest> | null> {
        const { metrics } = entity;
        const updateObject:mongoose.UpdateQuery<ScrapeRequest> = { $set: { metrics } };
        if ( metrics[0] !== undefined ) {
            const doc = await ScrapeDataModel.findOneAndUpdate(
                { uuid: entity.uuid },
                updateObject,
                { upsert: false, lean: true }
            ).exec();
            if ( doc !== null ) entity._id = doc._id;
            return doc;
        } else {
            return null;
        }
    }

    async delete ( entity: ScrapeRequest ): Promise<mongoDoc<ScrapeRequest>> {
        if ( entity._id !== undefined )
            return ScrapeDataModel.findByIdAndDelete( entity._id ).exec();
        else
            return ScrapeDataModel.findOneAndDelete({ uuid: entity.uuid }).exec();
    }

    /**
     * Retrieves scrape request from db
     * @param entity - uuid required
     * @returns {ScrapeRequest | null}
     */
    async findRequest ( entity: ScrapeRequest | IScrapeRequest | string ): Promise<ScrapeRequest | null> {
        if ( typeof entity === 'string' ) {
            const refId = entity;
            return ScrapeDataModel.findOne({ uuid: refId }).lean().populate( 'metrics' ).exec();
        } else {
            return ScrapeDataModel.findOne({ uuid: entity.uuid }).lean().populate( 'metrics' ).exec();
        }
        // return results;
    }

    /**
     * Aggrigates the Post data across Requests.
     * @param matchQuery - optional match expression
     * @returns {aggrigateData}
     */
    async findCommonPosts ( matchQuery?:mongoose.Expression | Record<string, mongoose.Expression> ) : Promise<aggrigateData[]> {
        const aggFunc = ScrapeDataModel.aggregate()
            .unwind( '$posts' )
            .project({
                _id    : '$posts',
                req_id : '$_id',
                post_id: '$posts'
            })
            .group({
                _id  : '$post_id',
                count: { $sum: 1 }
            });

        if ( matchQuery )
            aggFunc.match( matchQuery );


        aggFunc.lookup({
            from        : 'post-data',
            localField  : '_id',
            foreignField: '_id',
            as          : 'post'
        }).unwind( '$post' );

        aggFunc.replaceRoot({ $mergeObjects: [ { count: '$count' }, '$post' ] });

        return aggFunc.exec();
    }
}
