import { Socket } from 'socket.io-client';

export enum Role {
    COMASTER = 'COMASTER',
    CLIENT = 'CLIENT'
}

export interface CoMasterConstructor{
    socket: Socket;
    username: string;
    roomName: string;
    maxClientConnections: number;
    prevCoMaster?: string;
}

export interface Pending {
    role: Role;
    userId: string;
}

export interface Hand {
    who: string; //who is sending ice package
    ice: string;
}