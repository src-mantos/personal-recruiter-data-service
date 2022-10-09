import type { IScrapeRequest, IPostData, IVendorMetadata, ISearchQuery, IPostDataIndex } from '..';
import PostData from '../entity/PostData';
import { MongoConnection, MongoID, Dao } from './MongoConnection';
import mongoose, { Schema, model, Model, connect, Types } from 'mongoose';
import { inject, injectable } from 'tsyringe';
import { ScrapeDataModel } from './ScrapeDao';

const vendorMetadataSchema = new Schema<IVendorMetadata>({
    metadata: Schema.Types.Mixed,
    rawdata: Schema.Types.Mixed
});
const IndexMetadataSchema = new Schema<IPostDataIndex>({
    pageSize: { type: Number, required: true },
    postIndex: { type: Number, required: true },
    pageIndex: { type: Number, required: true },
    completed: { type: Boolean, required: true }
});
const PostDataSchema = new Schema<IPostData>(
    {
        _id: Schema.Types.ObjectId,
        request: { type: Schema.Types.ObjectId, ref: 'post-request' },
        directURL: { type: String, required: true, index: true },
        vendorMetadata: vendorMetadataSchema,
        // {
        //     metadata: Schema.Types.Mixed,
        //     rawdata: Schema.Types.Mixed
        // },
        indexMetadata: IndexMetadataSchema,
        // {
        //     pageSize: { type: Number, required: true },
        //     postIndex: { type: Number, required: true },
        //     pageIndex: { type: Number, required: true },
        //     completed: { type: Boolean, required: true }
        // },
        captureTime: { type: Date, required: true },
        postedTime: { type: String, required: false },

        title: { type: String, required: true },
        organization: { type: String, required: true, index: true },
        description: { type: String, required: true },
        location: { type: String, required: true, index: true },
        salary: { type: String, required: false, index: true }
    },
    { collection: 'post-data' }
);
PostDataSchema.index(
    {
        title: 'text',
        description: 'text'
    },
    {
        name: 'main',
        weights: {
            title: 5,
            description: 10
        },
        sparse: true
    }
);
const PostDataModel = model('post-data', PostDataSchema);

@injectable()
export class PostDao implements Dao<PostData> {
    connection: MongoConnection;
    constructor (@inject('MongoConnection') connection: MongoConnection) {
        this.connection = connection;
    }

    async upsert (entity: PostData | IPostData): Promise<void> {
        const val = PostDataModel.findOneAndUpdate({ directURL: entity.directURL }, entity, {
            new: true,
            upsert: true
        }).catch((err) => {
            console.log(err, val, entity);
            this.insert(entity);
        });
        await val;
    }

    async insert (entity: PostData | IPostData): Promise<void> {
        entity._id = new mongoose.Types.ObjectId();
        const dbo = new PostDataModel(entity);
        dbo.save(function (err) {
            if (err) {
                console.error(err);
            }
            // we probably need to update the scrape reference
            const request = new ScrapeDataModel(entity.request);
            request.save();
            dbo.save();
        });
    }

    async update (entity: PostData): Promise<void> {
        await PostDataModel.findOneAndUpdate({ directURL: entity.directURL }, entity).exec();
    }

    /**
     * Primary data input from scrapers/transformers
     * @param input
     */
    async importPostData (input: IPostData[]) {
        throw new Error('Method not implemented.');
    }

    /**
     * Primary Search interface for the Primary UI
     * @param searchQuery
     */
    async searchStoredData (searchQuery: ISearchQuery): Promise<PostData[]> {
        return PostDataModel.find({ $text: { $search: searchQuery.keywords } }, { score: { $meta: 'textScore' } })
            .sort({
                score: { $meta: 'textScore' }
            })
            .populate('request');
    }

    async getRequestData (requestId: MongoID) {
        return PostDataModel.find({ request: new mongoose.Types.ObjectId(requestId as any) });
    }

    /**
     * basic update post data
     * @param input
     */
    async updatePostData (input: IPostData): Promise<IPostData> {
        throw new Error('Method not implemented.');
    }

    /**
     * basic get post daa
     * @param input
     */
    async getPostData (id: any): Promise<IPostData> {
        throw new Error('Method not implemented.');
    }
}
