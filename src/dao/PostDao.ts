import { IScrapeRequest, IPostData, IVendorMetadata, ISearchQuery, IPostDataIndex, IScrapePostDataRequest, ComponentError, ISearchFilter, FilterOperation } from '../types';
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
    rawdata : Schema.Types.Mixed
});
/** subdocs for metric data */
const IndexMetadataSchema = new Schema<IPostDataIndex>({
    pageSize : { type: Number, required: true },
    postIndex: { type: Number, required: true },
    pageIndex: { type: Number, required: true },
    completed: { type: Boolean, required: true }
});
/** primary data document that stores all of the Raw & Metric data, as well as high level properties */
const PostDataSchema = new Schema<PostData>(
    {
        _id      : Schema.Types.ObjectId,
        directURL: {
            type    : String,
            required: true,
            index   : true,
            validate: {
                validator: function ( obj:string ) {
                    return obj !== undefined && obj !== null && obj.match( /^http.*/ );
                },
                message: props => `${props.value} directURL is required`
            }
        },
        userModified  : { type: Boolean, required: true, default: false },
        vendorMetadata: VendorMetadataSchema,
        indexMetadata : IndexMetadataSchema,
        captureTime   : { type: Date, required: true },
        postedTime    : { type: String, required: false },

        title       : { type: String, required: false },
        organization: { type: String, required: false, index: true },
        description : { type: String, required: false },
        location    : { type: String, required: false, index: true },
        salary      : { type: String, required: false, index: true }
    },
    { collection: postCollectionName }
);
/** Text Search Index */
PostDataSchema.index(
    {
        title      : 'text',
        description: 'text'
    },
    {
        name   : 'main',
        weights: {
            title      : 5,
            description: 10
        },
        sparse: true
    }
);
const refDataHook: PreSaveMiddlewareFunction<PostData> = async function ( this: PostData, next: CallbackWithoutResultAndOptionalError, opts: SaveOptions ) {
    if ( !this._id )
        this._id = new mongoose.Types.ObjectId();

    next();
};
PostDataSchema.pre<PostData>( 'save', refDataHook );
export const PostDataModel = model( postCollectionName, PostDataSchema );

/**
 * Under the current implementation we assume the database has been connected too, elsewhere.
 */
@injectable()
export class PostDao implements Dao<PostData> {
    // @deprecated - mongoose maintains internal state
    connection: MongoConnection;
    constructor ( @inject( 'MongoConnection' ) connection: MongoConnection ) {
        this.connection = connection;
    }

    async findOne ( entity: PostData ): Promise<mongoDoc<PostData>> {
        return PostDataModel.findOne({ directURL: entity.directURL }).exec();
    }


    /**
     * general purpose post update/insert method to be used in conjunction with scrape operations.
     * Updates for post data won't update "normalized" fields
     * @param entity 
     * @returns 
     */
    async upsert ( entity: PostData ): Promise<mongoDoc<PostData>> {
        const existing = await PostDataModel.findOne({ directURL: entity.directURL }).exec();
        if ( existing === null ) {
            const newDoc = new PostDataModel( entity );
            await newDoc.save();
            entity._id = newDoc._id;
            return newDoc;
        } else {
            PostData.apply( existing, entity ); //accounts for userModified flag
            entity._id = existing._id;
            await existing.save();
            return existing;
        }
    }
    /**
     * hard update for post data
     * @param entity 
     * @returns 
     */
    async update ( entity: PostData ): Promise<mongoDoc<PostData>> {
        return PostDataModel.findOneAndUpdate({ directURL: entity.directURL }, entity).exec();
    }

    async delete ( entity: PostData ): Promise<mongoDoc<PostData>> {
        if ( entity._id !== undefined )
            return PostDataModel.findByIdAndDelete( entity._id ).exec();
        else
            return PostDataModel.findOneAndDelete({ directURL: entity.directURL }).exec();
    }

    /**
     * Primary Text Search + filtering post data
     * @param searchQuery
     * @returns {PostData[]}
     */
    async textSearch ( searchQuery: ISearchQuery ): Promise<PostData[]> {
        const filterQuery = this.generateFilterCriteria(searchQuery.filters);
        filterQuery.$text = { $search: searchQuery.keywords };
        return PostDataModel.find(filterQuery, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .exec();
    }

    /**
     * Filtered lookup of post data
     * @param filters - ISearchFilter[]
     * @returns {PostData[]}
     */
    async getAllPosts (filters?:ISearchFilter[]): Promise<PostData[]> {
        return PostDataModel.find(this.generateFilterCriteria(filters)).exec();
    }

    /**
     * generates the and/or filters that get passed into 
     * @param filters 
     * @returns {mongoose.FilterQuery<PostData>}
     */
    generateFilterCriteria(filters?:ISearchFilter[]):mongoose.FilterQuery<PostData>{
        let queryObj:mongoose.FilterQuery<PostData> = {};
        if(filters !== undefined && filters?.length){
            const keyedFilters: Record<string,ISearchFilter[]> = {};
            const andKeys:string[] = [];
            for(let filter of filters){
                const fset = keyedFilters[filter.dataKey];
                if(fset == undefined){
                    keyedFilters[filter.dataKey] = [filter];
                }else{
                    keyedFilters[filter.dataKey].push(filter);
                }
                if(andKeys.indexOf(filter.dataKey) == -1){
                    andKeys.push(filter.dataKey);
                }
            }
            
            queryObj = {$and:[]};
            for(let keyField of andKeys){
                const multiFilter:mongoose.FilterQuery<PostData> = {$or:[]};
                for(let orField of keyedFilters[keyField]){
                    const value = orField.value as string;
                    let condition:any={};
                    if(orField.operation == FilterOperation.REGEX){
                        condition[orField.dataKey] = { $regex: '.*'+value+'.*', $options: 'i' };
                    }else if(orField.operation == FilterOperation.BOOL){
                        condition[orField.dataKey] = { $eq: value };
                    }else if(orField.operation == FilterOperation.IN){
                        const ids = value.split(",");
                        condition[orField.dataKey] = { $in: ids };
                    }
                    multiFilter.$or?.push(condition);
                }
                queryObj.$and?.push(multiFilter);
            }
        }
        return queryObj;
    }
    

    /**
     * Retrieve post data by request
     * @param request - uuid required
     * @returns {PostData[]|null}
     */
    async getRequestData ( request: IScrapeRequest ): Promise<PostData[]|null> {
        const userReq = await ScrapeDataModel.findOne({ uuid: request.uuid }).exec();
        if ( userReq !== null ) {
            const postIDs = userReq.posts.map( ( obj ) => obj._id );
            return PostDataModel.find({ _id: { $in: postIDs } }).exec();
        }
        return null;
    }

    async getPostDataFacets ():Promise<any> {
        return PostDataModel.aggregate().facet({
            title       : [{ $group: { _id: '$title' } }],
            organization: [{ $group: { _id: '$organization' } }],
            location    : [{ $group: { _id: '$location' } }]
        }).exec();
    }

    /**
     * Retrieve a single Post entity by id
     * @param mongoID - entity id
     * @returns {PostData|null}
     */
    async getPostById ( mongoID:any ):Promise<PostData|null> {
        return PostDataModel.findOne({ _id: mongoID }).exec();
    }

    /**
     * Set Post entity data
     * @param update - PostData
     * @returns {PostData|null}
     */
    async setPostById ( update:PostData ):Promise<PostData|null> {
        const { _id, directURL } = update;
        return PostDataModel.findOneAndUpdate({ _id, directURL }, update ).exec();
    }
}
