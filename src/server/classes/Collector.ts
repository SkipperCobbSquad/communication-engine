import { EventEmitter } from 'events';
import { Room } from './Room';
import { RoomCoMaster, CustomSocket, ServerErrors, Joiner } from '../interfaces';
import { Pending } from '../../client/interfaces';
import { ClientRequest } from 'http';

export class Collector extends EventEmitter {
    rooms: Map<String, Room>
    shortRooms: Array<String>

    constructor() {
        super()
        this.rooms = new Map()
        this.shortRooms = []
    }

    joinRoom(name: string, who: string) {
        const room: Room = this.findRoom(name)
        if (room) {
            room.emit('joinRequest', who)
        } else {
            this.emit('error', ServerErrors.NOROOM)
        }
    }
    //who => socked.id
    registerClientConnection(roomName: string, who: string, coMasterID: string) {
        const room: Room = this.findRoom(roomName)
        if (room) {
            room.registerClientConnection(who, coMasterID)
        } else {
            this.emit('error', ServerErrors.NOROOM)
        }
    }

    registerNewTunel(roomName: string, coMaster: RoomCoMaster, coMasterID: string){
        const room: Room = this.findRoom(roomName)
        if (room) {
            // const coMaster: RoomCoMaster = {}
            room.registerCoMaster(coMaster, coMasterID)
        } else {
            this.emit('error', ServerErrors.NOROOM)
        }
    }

    getAllRooms() {
        return this.shortRooms
    }

    addRoom(name: string, master: RoomCoMaster, socket: CustomSocket) {
        if (this.findRoom(name)) {
            this.emit('error', ServerErrors.ROOMEXIST)
        } else {
            const room = new Room(name, master)
            room.on('JoinInfo', (res: Joiner, userId: string) => {
                //Send JoinInfo to CoMaster to verify connection
                const pneding: Pending = {role: res.role, userId: userId}
                console.log(socket.id);
                if(socket.id === res.connectTo){    
                    socket.emit('pendingVerify', JSON.stringify(pneding)) //HOW????????
                }else{
                    socket.to(res.connectTo).emit('pendingVerify', JSON.stringify(pneding)) //HOW????????
                }

                //Send JoinInfo to client
                socket.to(userId).emit('JoinConInfo', JSON.stringify(res))
            })
            this.rooms.set(name, room)
            this.shortRooms.push(name)
            this.emit('RoomUpdate')
        }
    }

    deleteRoom(name: string) {
        this.rooms.delete(name)
        const findKey = this.shortRooms.findIndex(r => r == name)
        this.shortRooms.splice(findKey, 1)
        this.emit('RoomUpdate')
    }

    private findRoom(name: string) {
        return this.rooms.get(name)
    }
}