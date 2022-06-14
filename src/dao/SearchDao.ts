//# sourceMappingURL=dist/src/dao/SearchDao.js.map
import { EntityRepository, EntityManager, MongoDriver } from '@mikro-orm/mongodb';
import { Loaded, wrap } from '@mikro-orm/core';
import type { IPostDataScrapeRequest, IPostData, IVendorMetadata, IPostDataSearchRequest } from '../types';

import { BaseDao } from './BaseDao';
import ScrapeRequest from '../entity/ScrapeRequest';

type DbProxy = Loaded<ScrapeRequest, never> | null;
type DbProxSet = Loaded<ScrapeRequest, never>[] | null;

export class SearchDao extends BaseDao {
    private repository: EntityRepository<ScrapeRequest>;
    constructor() {
        super();
    }

    public async connect(): Promise<any> {
        await super.connect();
        if (!this.repository) {
            this.repository = this.orm.em.getRepository(ScrapeRequest);
        }
    }

    async upsert(entity: ScrapeRequest | IPostDataScrapeRequest): Promise<void> {
        const existing: DbProxy = await this.repository.findOne({
            keyword: entity.keyword,
            location: entity.location,
            pageDepth: entity.pageDepth,
        });
        if (existing != null) {
            console.log('Existing', JSON.stringify(existing));
            console.log('Incomming', JSON.stringify(entity));
            console.log('Due to the time dilation between relevant searches most should be handled as new');
        }
        this.insert(entity);
    }

    async insert(entity: ScrapeRequest | IPostDataScrapeRequest): Promise<void> {
        this.repository.persist(entity);
    }
    async update(entity: ScrapeRequest | IPostDataScrapeRequest): Promise<void> {
        const existing: DbProxy = await this.repository.findOne({ uuid: entity.uuid });
        if (existing) {
            wrap(existing).assign(entity, { mergeObjects: true });
        } else {
            console.warn('Unable to find entity to update');
        }
    }

    async findRequest(
        entity: ScrapeRequest | IPostDataScrapeRequest | string
    ): Promise<Loaded<ScrapeRequest, never>[] | null> {
        let results: DbProxSet;
        if (entity instanceof String) {
            const refId = <string>entity;
            results = await this.repository.find({ uuid: refId });
        } else {
            results = await this.repository.find(entity);
        }
        return results;
    }
}
