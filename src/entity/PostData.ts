//# sourceMappingURL=dist/entity/PostData.js.map
import type {
    IPostDataScrapeRequest,
    IPostData,
    IVendorMetadata,
    IPostDataIndex,
    IPostDataSearchRequest,
} from '../types';
import { Entity, Property, PrimaryKey, SerializedPrimaryKey, ManyToOne } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { PropDefaults } from '../mikro-orm.config';
import ScrapeRequest from './ScrapeRequest';

@Entity()
export default class PostData implements IPostData {
    @PrimaryKey()
    _id: ObjectId;

    @SerializedPrimaryKey()
    id: string;

    @ManyToOne({ entity: () => ScrapeRequest })
    request: ScrapeRequest;

    @Property()
    directURL!: string;
    @Property()
    vendorMetadata: IVendorMetadata;
    @Property()
    indexMetadata: IPostDataIndex;
    @Property()
    captureTime: Date;

    @Property()
    title: string;
    @Property()
    organization: string;
    @Property()
    location: string;
    @Property()
    description: string;
    @Property()
    salary: string;
    @Property()
    postedTime: string;

    constructor(opts?: IPostData) {
        if (opts) {
            this.directURL = opts.directURL;
            this.captureTime = opts.captureTime;
            this.title = opts.title;
            this.organization = opts.organization;
            this.location = opts.location;
            this.description = opts.description;
            this.postedTime = opts.postedTime;
            if (opts.salary) this.salary = opts.salary;
            if (opts.vendorMetadata) this.vendorMetadata = opts.vendorMetadata;
            if (opts.indexMetadata) this.indexMetadata = opts.indexMetadata;
        } else {
            this.captureTime = new Date();
            this.vendorMetadata = {
                metadata: {},
                rawdata: {},
            };
            this.indexMetadata = {
                pageIndex: 0,
                pageSize: 0,
                postIndex: 0,
                completed: false,
            };
        }
    }

    public update(newValue: IPostData): boolean {
        if (this.directURL === newValue.directURL) {
            for (const key in newValue) {
                (<any>this)[key] = (<any>newValue)[key];
            }
            return true;
        } else {
            console.warn("attempting to update a post that failed 'unique' check");
        }
        return false;
    }
}
