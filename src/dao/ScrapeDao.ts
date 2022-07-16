//# sourceMappingURL=dist/src/dao/ScrapeDao.js.map
import { MongoConnection } from './MongoConnection';
import mongoose, { Schema, model, Model, connect, Types } from 'mongoose';
import { inject, injectable } from 'tsyringe';

import type { IPostDataScrapeRequest, IPostData, IVendorMetadata, IPostDataSearchRequest } from '../types';

import ScrapeRequest from '../entity/ScrapeRequest';
import type { ScrapeSchema } from '../entity/ScrapeRequest';

const ScrapeDataSchema = new Schema<ScrapeSchema>(
    {
        _id: Schema.Types.ObjectId,
        uuid: { type: String, required: true, index: true },
        requestTime: { type: Date, required: true },
        keyword: { type: String, required: true },
        location: { type: String, required: false },
        pageDepth: { type: Number, required: true },
        complete: { type: Boolean, required: true },
        metrics: Schema.Types.Mixed,
        data: [{ type: Schema.Types.ObjectId, ref: 'post-data' }],

        /**[
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

@injectable()
export class ScrapeDao {
    connection: MongoConnection;
    constructor(@inject('MongoConnection') connection: MongoConnection) {
        this.connection = connection;
    }

    async upsert(entity: ScrapeSchema | IPostDataScrapeRequest): Promise<void> {
        const req = await ScrapeDataModel.findOne({ uuid: entity.uuid });
        if (req) {
            req.markModified('metrics');
            return req.update(entity);
        }
        return Promise.resolve();
    }

    async insert(entity: ScrapeSchema | IPostDataScrapeRequest): Promise<void> {
        const cast = entity as ScrapeSchema;
        if (!cast._id) {
            cast._id = new mongoose.Types.ObjectId();
        }
        await new ScrapeDataModel(cast).save();
    }
    async update(entity: ScrapeSchema | IPostDataScrapeRequest): Promise<void> {
        await ScrapeDataModel.findOneAndUpdate({ uuid: entity.uuid }, entity).exec();
    }

    async findRequest(entity: ScrapeSchema | IPostDataScrapeRequest | string): Promise<ScrapeRequest | null> {
        if (typeof entity === 'string') {
            const refId = entity;
            return ScrapeDataModel.findOne({ uuid: refId }).populate('metrics');
        } else {
            return ScrapeDataModel.findOne({ uuid: entity.uuid }).populate('metrics');
        }
        // return results;
    }
}
