import { Server, Socket, ServerOptions } from 'socket.io';
import { CustomSocket, Hand, Joiner, RoomCoMaster, ServerErrors, User, Pending } from '../interfaces';
import { Collector } from './Collector';
import { Room } from './Room';

export class IOServer extends Server {
    roomCollector: Collector;
    users: Array<User>
    count: number

    constructor(IoOptions?: ServerOptions) {
        super(IoOptions);
        this.roomCollector = null;
        this.users = [];
        this.count = 0;
        this.on('connection', (socket: CustomSocket) => {
            socket.on('setUsername', (username: string) => {
                //TODO: Username chceck
                if (this.users.find(u => u.username === username)) {
                    socket.emit('error', ServerErrors.USERNAMETAKEN)
                } else {
                    this.users.push({ socketId: socket.id, username: username })
                    socket.username = username;
                    console.log(socket.username);
                }
            });
            //TODO: check if user has username set and don't have any connection opened
            socket.on('registerRoom', (name: string, maxConnections: number, callback) => {
                if (this.userExist(socket.username, socket.id) || !(this.roomExist(name))) {
                    //Max connections +2 <=> for CoMasterToonel prev + next
                    //For iniciator +1 for connections <=> prevCoMaster dosen`t exist
                    const coMaster: RoomCoMaster = { username: socket.username, socketId: socket.id, connections: 1, maxConnections: maxConnections + 2 };
                    this.roomCollector.addRoom(name, coMaster, socket);
                    callback({ status: 'ok' })
                } else {
                    socket.emit('error', ServerErrors.NOUSERNAME)
                    callback({ status: 'error', reason: ServerErrors.NOUSERNAME })
                }
            });

            socket.on('joinRoom', (roomName: string) => {
                if (this.userExist(socket.username, socket.id)) {
                    this.roomCollector.joinRoom(roomName, socket.id)
                } else {
                    socket.emit('error', ServerErrors.NOUSERNAME)
                }
            })

            socket.on('registerClient', (roomName, who) => {
                this.roomCollector.registerClientConnection(roomName, who, socket.id)
            })

            socket.on('registerCoMasterTunel', (roomName: string, maxClients: number, username: string, who: string) => {
                const coMaster: RoomCoMaster = { username: username, connections: 1, maxConnections: maxClients + 2, socketId: who }
                this.roomCollector.registerNewTunel(roomName, coMaster, socket.id)
            })

            socket.on('handshake', (toWhom: string, ice: string) => {
                const hand: Hand = { who: socket.id, ice }
                console.log(`Kto: ${hand.who}; Do: ${toWhom}`);
                socket.to(toWhom).emit('handshake', JSON.stringify(hand))
            })

            // this.roomCollector.on('JoinInfoC', (res: Joiner, userId: string) => {
            //     const pneding: Pending = {role: res.role, userId: userId}
            //     socket.to(res.connectTo).emit('pendingVerify',JSON.stringify(pneding))
            //     socket.to(userId).emit('JoinConInfo', JSON.stringify(res))
            // })
            //TODO: socket on get room
        });

    }

    init(port: number) {
        this.roomCollector = new Collector();
        this.listen(port);
        console.log(`Server listen on ${port}`);
    }

    private userExist(username: string, userId: string): boolean {
        return this.users.find(u => (u.username === username) && (u.socketId === userId)) ? true : false;
    }

    private roomExist(roomName: string): boolean {
        return this.roomCollector.shortRooms.find(r => r === roomName) ? true : false;
    }

}
