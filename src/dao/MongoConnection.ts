import mongoose, { Mongoose, ObjectId, HydratedDocument } from 'mongoose';
import { singleton, inject } from 'tsyringe';

/** basic config definition TODO: refactor */
type config = {
    user?:string;
    password?:string;
    dbName?:string;
    clientUrl?:string;
};
/** a short cut type for hackery TODO: deprecate */
export type MongoID = string | ObjectId;
/**
 * @class a data access interface. TODO: deprecate & remove
 */
export interface Dao<T> {
    upsert( entity:T ) :Promise<any>;
    delete( entity:T ) :Promise<any>;
}
/** TODO: refactor */
export type mongoDoc<T> = ( mongoose.Document<unknown, any, T> & T & {
    _id: mongoose.Types.ObjectId;
}) | null;

/**
 * @class A java style database connection object.
 * all of the DAO's require a connection be established for the query interface.
 */
@singleton()
export class MongoConnection implements config {
    conn: Mongoose;
    connected: boolean;
    clientUrl: string;
    user: string;
    password: string;
    dbName: string;

    constructor (
        @inject( 'db_clientUrl' ) clientUrl: string,
        @inject( 'db_user' ) dbUser: string,
        @inject( 'db_pass' ) dbPass: string,
        @inject( 'db_name' ) dbName: string
    ) {
        this.init();
        this.connected = false;
        this.clientUrl = clientUrl;
        this.user = dbUser;
        this.password = dbPass;
        this.dbName = dbName;
    }

    private setConnectedListener ( state: boolean ) {
        return () => {
            this.connected = state;
        };
    }

    reconfig ( opts:config ) {
        const { clientUrl, user, password, dbName } = opts;
        if ( clientUrl !== undefined )
            this.clientUrl = clientUrl;

        if ( user !== undefined )
            this.user = user;

        if ( password !== undefined )
            this.password = password;

        if ( dbName !== undefined )
            this.dbName = dbName;
    }

    protected init () {
        mongoose.connection.on( 'error', console.error );
        mongoose.connection.on( 'connected', this.setConnectedListener( true ) );
        mongoose.connection.on( 'open', this.setConnectedListener( true ) );
        mongoose.connection.on( 'disconnecting', this.setConnectedListener( false ) );
        mongoose.connection.on( 'disconnected', this.setConnectedListener( false ) );
    }

    async connect ( onConnected?:{():Promise<void>}): Promise<void> {
        const connectionOpts:mongoose.ConnectOptions = {
            user  : this.user,
            pass  : this.password,
            dbName: this.dbName
        };
        if ( this.conn !== undefined )
            await this.conn.connect( this.clientUrl, connectionOpts );
        else
            this.conn = await mongoose.connect( this.clientUrl, connectionOpts );

        if ( onConnected !== undefined )
            await onConnected();
    }

    isConnected (): boolean {
        return this.connected;
    }

    disconnect (): Promise<void> {
        this.connected = false;
        return mongoose.disconnect();
    }
}


