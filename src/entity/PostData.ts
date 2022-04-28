//# sourceMappingURL=dist/entity/PostData.js.map
import type { IPostDataScrapeRequest, IPostData, IVendorMetadata, IPostDataSearchRequest } from '../types';
import { Entity, Property, PrimaryKey, SerializedPrimaryKey } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Entity()
export default class PostData implements IPostData {
    @PrimaryKey()
    _id: ObjectId;

    @SerializedPrimaryKey()
    id: string;

    @Property()
    directURL!: string;
    @Property()
    vendorMetadata: IVendorMetadata;
    @Property()
    searchIndex: number;
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
    salary?: string;
    @Property()
    postedTime: string;

    constructor() {
        this.captureTime = new Date();
        this.vendorMetadata = {
            metadata: {},
            rawdata: {},
        };
    }
}
