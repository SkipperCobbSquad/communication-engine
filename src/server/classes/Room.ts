import { EventEmitter } from 'events';
import { RoomCoMaster, Joiner, Role } from '../interfaces';

export class Room extends EventEmitter {
    name: String;
    CoMasters: Array<RoomCoMaster>;
    slaveRegistration: boolean;
    joinQueue: Array<string>; //Contain users id
    connectionsMap: Map<RoomCoMaster, Array<String>>

    constructor(name: String, master: RoomCoMaster) {
        super();
        this.name = name;
        this.CoMasters = [master];
        this.slaveRegistration = false;
        this.joinQueue = [];
        this.connectionsMap = new Map()

        this.on('joinRequest', (userId: string) => {
            if (!this.joinQueue.length) {
                this.joinQueue.push(userId);
                const res: Joiner = this.join();
                this.emit('JoinInfo', res, userId);
            } else if (this.slaveRegistration) {
                this.joinQueue.push(userId);

            } else if (this.joinQueue.length) {
                this.joinQueue.push(userId);
            }
        });

        this.on('next', (userId: String) => {
            const findMe: number = this.joinQueue.findIndex(id => id === userId)
            if (findMe >= 0) {
                this.joinQueue.splice(findMe, 1)
                console.log(this.joinQueue);
            } else {
                throw new Error('Something Wrong!!!')
            }
            if (this.joinQueue.length) {
                const res: Joiner = this.join()
                this.emit('JoinInfo', res, this.joinQueue[0]);
            }
        })
    }

    join() {
        const slectSlave = this.CoMasters.findIndex(
            (s) => s.connections < s.maxConnections
        );
        if (slectSlave >= 0) {
            if (this.CoMasters[slectSlave].connections < this.CoMasters[slectSlave].maxConnections - 1) {
                const res: Joiner = {
                    role: Role.CLIENT,
                    connectTo: this.CoMasters[slectSlave].socketId,
                };
                return res;
            } else {
                const res: Joiner = {
                    role: Role.COMASTER,
                    connectTo: this.CoMasters[slectSlave].socketId,
                };
                this.slaveRegistration = true;
                return res;
            }
        } else {
            throw new Error('No CoMasters')
        }
    }
    //TODO: leave option/reconnect
    //TODO: Only CoMaster can register new CoMaster
    registerCoMaster(CoMaster: RoomCoMaster, who: string) {
        const findCoMaster = this.CoMasters.findIndex(m => m.socketId === who)
        if (findCoMaster >= 0) {
            this.CoMasters[findCoMaster].connections += 1
            this.CoMasters.push(CoMaster);
            this.slaveRegistration = false;
            this.emit('next', CoMaster.socketId); //Send userId to dequeue
        }
    }

    //Registration clinet only by CoMaster
    registerClientConnection(userId: String, coMaster: string) {
        const findCoMaster = this.CoMasters.findIndex(m => m.socketId === coMaster)
        if (findCoMaster >= 0) {
            const updateCon = this.CoMasters[findCoMaster]
            updateCon.connections += 1;
            if (this.connectionsMap.get(updateCon)) {
                this.connectionsMap.get(updateCon).push(userId)
            } else {
                this.connectionsMap.set(updateCon, [userId])
            }
            this.emit('next', userId); //Send userId to dequeue
        }
    }
}
