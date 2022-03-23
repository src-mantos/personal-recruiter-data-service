import { EntityManager, MongoDriver } from '@mikro-orm/mongodb';
import { MikroORM, EntityRepository, IDatabaseDriver, Connection } from '@mikro-orm/core';
import ormOpts from '../mikro-orm.config';
import { PostData } from '../types';

export abstract class BaseDao {
    protected orm: MikroORM<IDatabaseDriver<Connection>>;
    async connect() {
        this.orm = await MikroORM.init(ormOpts);
    }
    async isConnected(): Promise<boolean> {
        return this.orm.isConnected();
    }
    async disconnect() {
        await this.orm.close();
    }
}
