export type MediaAsset={
 id:string;relativePath:string;mimeType:'image/jpeg';byteLength:number;sha256:string;
 createdAt:string;width?:number;height?:number;metadataStripped:boolean;source:'picker'|'legacy'|'import';
};
export type LocalBackupPolicy={enabled:boolean;dailyLimit:number;versionLimit:number};
export type SnapshotSource='daily'|'version'|'preimport'|'manual';
export type SnapshotInfo={id:string;createdAt:string;appVersion:string;databaseSchema:number;source:SnapshotSource;sourceKey?:string;byteLength:number;sha256:string};
export type PrivateStorageProtection={excludedFromBackup:boolean;protected:boolean;location:'native-private'|'app-private-fallback'};
