import mongoose, { Schema, model, Model, connect, Types } from 'mongoose';
import { IPostData, IVendorMetadata, IPostDataIndex, IRunMetric, IPostDataSearchRequest } from '..';
import { injectAll, singleton, inject } from 'tsyringe';
import PostData from '../entity/PostData';

@singleton()
export class MongoConnection {
    connected: boolean;
    clientUrl: string;

    constructor(@inject('db_clientUrl') db_clientUrl: string) {
        this.init();
        this.connected = false;
        this.clientUrl = db_clientUrl;
    }
    private setConnectedListener(state: boolean) {
        return () => {
            this.connected = state;
        };
    }
    init() {
        mongoose.connection.on('error', console.log);
        mongoose.connection.on('disconnected', console.log);
        mongoose.connection.on('connected', this.setConnectedListener(true));
        mongoose.connection.on('open', this.setConnectedListener(true));
        mongoose.connection.on('disconnecting', this.setConnectedListener(false));
        mongoose.connection.on('disconnected', this.setConnectedListener(false));
        mongoose.connection.once('open', console.log);
    }

    async connect(): Promise<void> {
        await mongoose.connect(this.clientUrl, {
            user: 'root',
            pass: 'example',
            dbName: 'WIP',
        });
    }
    isConnected(): boolean {
        return this.connected;
    }
    async disconnect(): Promise<void> {
        await mongoose.disconnect();
    }
}
