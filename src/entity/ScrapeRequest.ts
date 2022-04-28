//# sourceMappingURL=dist/src/entity/ScrapeRequest.js.map
import type { IPostDataScrapeRequest } from '../types';
import { Entity, Property, PrimaryKey, SerializedPrimaryKey } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { v4 } from 'uuid';

@Entity()
export class ScrapeRequest implements IPostDataScrapeRequest {
    @PrimaryKey()
    uuid: string = v4();
    @Property()
    requestTime?: Date;
    @Property()
    keyword: string;
    @Property()
    location: string;
    @Property()
    pageDepth: number;

    constructor() {
        this.requestTime = new Date();
    }
}
