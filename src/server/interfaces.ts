import { Socket } from 'socket.io';

export enum ServerErrors {
    NOROOM = 'This room dosen`t exist',
    ROOMEXIST = 'Room alerady exist',
    NOUSERNAME = 'You can`t connect without username', //also for safety
    USERNAMETAKEN = 'Username alerady exist'
}

export enum Role {
    COMASTER = 'COMASTER',
    CLIENT = 'CLIENT'
}

export interface CustomSocket extends Socket {
    username?: string
}

export interface RoomCoMaster{
    socketId: string,
    username: string,
    connections: number,
    //Minimum 6 conn; 5 for clients + 1 for slave
    maxConnections: number,
}

export interface User{
    socketId: string,
    username: string,
}

export interface Joiner {
    role: Role,
    connectTo: string;
}

export interface Pending {
    role: Role;
    userId: string;
}


export interface Hand {
    who: string; //who is sending ice package
    ice: string;
}