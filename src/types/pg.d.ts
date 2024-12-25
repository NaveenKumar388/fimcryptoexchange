declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    query(text: string, params?: any[]): Promise<QueryResult>;
  }

  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    end(): Promise<void>;
    query(text: string, params?: any[]): Promise<QueryResult>;
  }

  export interface QueryResult {
    rows: any[];
    rowCount: number;
    command: string;
    oid: number;
    fields: FieldDef[];
  }

  export interface FieldDef {
    name: string;
    tableID: number;
    columnID: number;
    dataTypeID: number;
    dataTypeSize: number;
    dataTypeModifier: number;
    format: string;
  }

  export interface PoolClient extends Client {
    release(err?: Error): void;
  }
}

