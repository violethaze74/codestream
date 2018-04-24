'use strict';

export interface CSEntity {
    deactivated?: boolean;
    createdAt: Date;
    modifiedAt: Date;
    id: string;
    creatorId: string;
}

export interface CSMarker {
    id: string;
    teamId: string;
    streamId: string;
    postId: string;
}

export interface CSMarkerLocations {
    teamId: string;
    streamId: string;
    commitHash: string;
    locations: { [id: string]: [number, number, number, number] };
}

export interface CSPost extends CSEntity {
    streamId: string;
    text: string;
    codeBlocks?: {
        code: string;
        markerId: string;
        file: string;
        repoId: string;
    }[];
    commitHashWhenPosted?: string;
    repoId: string;
    teamId: string;
    seqNum: number;

}

export interface CSRepository extends CSEntity {
    url: string;
    firstCommitHash: string;
    normalizedUrl: string;
    teamId: string;
    companyId: string;
}

export enum StreamType {
    Channel = 'channel',
    Direct = 'direct',
    File = 'file'
}

export interface CSChannelStream extends CSEntity {
    teamId: string;
    type: StreamType.Channel;
    name: string;
    memberIds?: string;
    sortId: string;
}

export interface CSDirectStream extends CSEntity {
    teamId: string;
    type: StreamType.Direct;
    name?: string;
    memberIds: string;
    sortId: string;
}

export interface CSFileStream extends CSEntity {
    teamId: string;
    type: StreamType.File;
    file: string;
    repoId: string;
    sortId: string;
}

export type CSStream = CSChannelStream | CSDirectStream | CSFileStream;

export interface CSTeam extends CSEntity {
    name: string;
    primaryReferral: 'internal' | 'external';
    memberIds: string[];
    creatorId: string;
    companyId: string;
}

export interface CSUser extends CSEntity {
    username: string;
    email: string;
    isRegistered: boolean;
    registeredAt: Date;
    joinMethod: string; // 'Create Team'
    primaryReferral: 'internal' | 'external';
    originTeamId: string;
    companyIds: string[];
    teamIds: string[];
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: CSUser;
    accessToken: string;
    pubnubKey: string;
    teams: CSTeam[];
    repos: CSRepository[];
}

export interface CreatePostRequest {
    teamId: string;
    streamId: string;
    parentPostId?: string;
    text: string;
    codeBlocks?: {
        code: string;
        location: [number, number, number, number];
        streamId?: string;
    }[];
    commitHashWhenPosted?: string;
}

export interface CreatePostResponse {
    post: CSPost;
}

export interface CreateRepoRequest {
    teamId: string;
    url: string;
    firstCommitHash: string;
}

export interface CreateRepoResponse {
    repo: CSRepository;
}

export interface CreateFileStreamRequest {
    teamId: string;
    repoId: string;
    type: 'file';
    file: string;
}

export interface CreateDirectStreamRequest {
    teamId: string;
    type: 'direct';
    name: string;
    memberIds: string[];
}

export interface CreateChannelStreamRequest {
    teamId: string;
    type: 'channel';
    name: string;
    memberIds?: string[];
    isTeamStream: boolean;
}

export type CreateStreamRequest = CreateFileStreamRequest | CreateDirectStreamRequest | CreateChannelStreamRequest;

export interface CreateStreamResponse {
    stream: CSStream;
}

export interface FindRepoResponse {
    repo?: CSRepository;
    usernames?: string[];
}

export interface GetMarkerLocationsResponse {
    markerLocations: CSMarkerLocations;
}

export interface GetMarkerResponse {
    marker: CSMarker;
}

export interface GetMarkersResponse {
    markers: CSMarker[];
    numMarkers: number;
}

export interface GetPostsResponse {
    posts: CSPost[];
}

export interface GetRepoResponse {
    repo: CSRepository;
}

export interface GetReposResponse {
    repos: CSRepository[];
}

export interface GetStreamResponse<T extends CSStream> {
    stream: T;
}

export interface GetStreamsResponse<T extends CSStream> {
    streams: T[];
}

export interface GetTeamResponse {
    team: CSTeam;
}

export interface GetTeamsResponse {
    teams: CSTeam[];
}

export interface GetUserResponse {
    user: CSUser;
}

export interface GetUsersResponse {
    users: CSUser[];
}