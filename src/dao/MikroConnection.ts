import { MikroORM, IDatabaseDriver, Connection, AnyEntity } from '@mikro-orm/core';
import { ormOpts } from '../mikro-orm.config';

export default class MikroConnection {
    private static instance: MikroConnection;
    private orm: MikroORM<IDatabaseDriver<Connection>>;
    private connection: IDatabaseDriver<Connection>;
    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() {}

    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    public static getInstance(): MikroConnection {
        if (!MikroConnection.instance) {
            MikroConnection.instance = new MikroConnection();
        }

        return MikroConnection.instance;
    }
    private async init() {
        if (!this.orm) this.orm = await MikroORM.init(ormOpts);
    }

    public getORM(): MikroORM<IDatabaseDriver<Connection>> {
        return this.orm;
    }
    public async close() {
        await this.orm.close();
    }

    public async connect(): Promise<IDatabaseDriver<Connection>> {
        await this.init();
        if (!this.connection) {
            this.connection = await this.orm.connect();
        }
        return this.connection;
    }
}
