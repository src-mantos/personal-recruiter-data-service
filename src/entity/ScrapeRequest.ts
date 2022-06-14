//# sourceMappingURL=dist/src/entity/ScrapeRequest.js.map
import type { IPostDataScrapeRequest, IRunState, IRunMetric } from '../types';
import { Entity, Property, PrimaryKey, SerializedPrimaryKey, OneToMany, Collection } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { v4 } from 'uuid';
import PostData from './PostData';

@Entity()
export default class ScrapeRequest implements IPostDataScrapeRequest, IRunState {
    @PrimaryKey()
    _id: ObjectId;

    @SerializedPrimaryKey()
    id: string;

    @Property()
    uuid: string = v4();
    @Property()
    requestTime?: Date;
    @Property()
    keyword: string;
    @Property()
    location?: string;
    @Property()
    pageDepth: number;

    @OneToMany({ entity: () => PostData, mappedBy: 'request' })
    results: Collection<PostData> = new Collection<PostData>(this);

    @Property()
    complete: boolean;
    @Property()
    metrics: IRunMetric[];

    constructor(opts?: IPostDataScrapeRequest) {
        this.requestTime = new Date();
        this.complete = false;
        this.metrics = [];
        if (opts) {
            this.keyword = opts.keyword;
            this.location = opts.location;
            this.pageDepth = opts.pageDepth;
        }
    }
}
