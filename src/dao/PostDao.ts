import { IScrapeRequest, IPostData, IVendorMetadata, ISearchQuery, IPostDataIndex, IScrapePostDataRequest, ComponentError } from '../types';
import PostData from '../entity/PostData';
import { MongoConnection, MongoID, Dao, mongoDoc } from './MongoConnection';
import mongoose, { Schema, model, FilterQuery, Document, PreSaveMiddlewareFunction, CallbackWithoutResultAndOptionalError, SaveOptions } from 'mongoose';
import { inject, injectable } from 'tsyringe';
import { ScrapeDataModel } from './ScrapeDao';
import ScrapeRequest from '../entity/ScrapeRequest';

export const postCollectionName = 'post-data';
/** subdoc for raw data */
const VendorMetadataSchema = new Schema<IVendorMetadata>({
    metadata: Schema.Types.Mixed,
    rawdata: Schema.Types.Mixed
});
/** subdocs for metric data */
const IndexMetadataSchema = new Schema<IPostDataIndex>({
    pageSize: { type: Number, required: true },
    postIndex: { type: Number, required: true },
    pageIndex: { type: Number, required: true },
    completed: { type: Boolean, required: true }
});
/** primary data document that stores all of the Raw & Metric data, as well as high level properties */
const PostDataSchema = new Schema<PostData>(
    {
        _id: Schema.Types.ObjectId,
        directURL: {
            type: String,
            required: true,
            index: true,
            validate: {
                validator: function (obj:string) {
                    return obj !== undefined && obj !== null && obj.match(/^http.*/);
                },
                message: props => `${props.value} directURL is required`
            }
        },
        vendorMetadata: VendorMetadataSchema,
        indexMetadata: IndexMetadataSchema,
        captureTime: { type: Date, required: true },
        postedTime: { type: String, required: false },

        title: { type: String, required: true },
        organization: { type: String, required: true, index: true },
        description: { type: String, required: true },
        location: { type: String, required: true, index: true },
        salary: { type: String, required: false, index: true }
    },
    { collection: postCollectionName }
);
/** Text Search Index */
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
const refDataHook: PreSaveMiddlewareFunction<PostData> = async function (this: PostData, next: CallbackWithoutResultAndOptionalError, opts: SaveOptions) {
    if (!this._id) {
        this._id = new mongoose.Types.ObjectId();
    }
    next();
};
PostDataSchema.pre<PostData>('save', refDataHook);
export const PostDataModel = model(postCollectionName, PostDataSchema);

/**
 * Under the current implementation we assume the database has been connected too, elsewhere.
 */
@injectable()
export class PostDao implements Dao<PostData> {
    // @deprecated - mongoose maintains internal state
    connection: MongoConnection;
    constructor (@inject('MongoConnection') connection: MongoConnection) {
        this.connection = connection;
    }

    async findOne (entity: PostData): Promise<mongoDoc<PostData>> {
        return PostDataModel.findOne({ directURL: entity.directURL }).exec();
    }

    async update (entity: PostData): Promise<mongoDoc<PostData>> {
        return this.upsert(entity);
        // if (entity._id) {
        //     return PostDataModel.findByIdAndUpdate(entity._id, entity).exec();
        // } else {
        //     throw new ComponentError('trying to update a document without _id. use upsert when in doubt.');
        // }
    }

    async upsert (entity: PostData): Promise<mongoDoc<PostData>> {
        const existing = await PostDataModel.findOne({ directURL: entity.directURL }).exec();
        if (existing === null) {
            const newDoc = new PostDataModel(entity);
            await newDoc.save();
            return newDoc;
        } else {
            PostData.apply(existing, entity);
            await existing.save();
            return existing;
        }
        // const doc = await PostDataModel.findOneAndUpdate({ directURL: entity.directURL }, entity, { upsert: true, new: true, lean: true }).exec();
        // entity._id = doc._id;
        // return doc;
    }

    async delete (entity: PostData): Promise<mongoDoc<PostData>> {
        if (entity._id !== undefined) {
            return PostDataModel.findByIdAndDelete(entity._id).exec();
        } else {
            return PostDataModel.findOneAndDelete({ directURL: entity.directURL }).exec();
        }
    }

    /**
     * Primary Text Search
     * @param searchQuery
     */
    async textSearch (searchQuery: ISearchQuery): Promise<PostData[]> {
        // const fullTextQuery:mongoose.FilterQuery<PostData> = {
        //     $text: { $search: searchQuery.keywords }
        // };

        return PostDataModel.find({ $text: { $search: searchQuery.keywords } }, { score: { $meta: 'textScore' } })
            .sort({
                score: { $meta: 'textScore' }
            }).exec();
    }

    /**
     * Retrieve post data by request
     * @param request - uuid required
     * @returns {PostData[]|null}
     */
    async getRequestData (request: IScrapeRequest): Promise<PostData[]|null> {
        const userReq = await ScrapeDataModel.findOne({ uuid: request.uuid }).exec();
        if (userReq !== null) {
            const postIDs = userReq.posts.map((obj) => { return obj._id; });
            return PostDataModel.find({ _id: { $in: postIDs } }).exec();
        }
        return null;
    }

    async getPostDataFacets ():Promise<any> {
        return PostDataModel.aggregate().facet({
            title: [{ $group: { _id: '$title' } }],
            organization: [{ $group: { _id: '$organization' } }],
            location: [{ $group: { _id: '$location' } }]
        }).exec();
    }
}
