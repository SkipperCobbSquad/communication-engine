import { EventEmitter } from 'events';
import { Socket } from 'socket.io-client';
import Peer = require('simple-peer');
const wrtc = require('wrtc')

import { CoMasterConstructor, Hand, Pending, Role } from '../interfaces';

export class CoMaster extends EventEmitter {
    socket: Socket
    myId: string;
    private username: string;
    private myRoom: string;
    maxConn: number
    MyClients: Map<string, any>
    PrevCoMaster: any;
    NextCoMaster: any;
    pendingCache: Pending;
    isReady: boolean;

    constructor(props: CoMasterConstructor) {
        super()
        this.socket = props.socket;
        this.myId = props.socket.id;
        this.username = props.username;
        this.myRoom = props.roomName;
        this.maxConn = props.maxClientConnections;
        this.MyClients = new Map();
        this.PrevCoMaster = null;
        this.NextCoMaster = null;
        this.pendingCache = null;
        this.isReady = true;

        if (props.prevCoMaster) {
            this.StartCreatCoMasterTunel(props.prevCoMaster)
            this.isReady = false;
            this.pendingCache = { role: Role.COMASTER, userId: props.prevCoMaster }
        }

        this.socket.on('pendingVerify', (pending) => {
            console.log(pending);
            this.pendingCache = JSON.parse(pending);
        })

        this.socket.on('handshake', (RawHand) => {
            const hand: Hand = JSON.parse(RawHand);
            if (this.pendingCache.role === Role.COMASTER) {
                if (this.isReady) {
                    this.registerNextCoMasterTunel(hand.ice, hand.who)
                } else {
                    this.registerPrevCoMasterTunel(hand.ice)
                }
            } else if (this.pendingCache.role === Role.CLIENT) {
                this.createClientPeer(hand.ice, hand.who)
            }
        })
    }

    private createClientPeer(ice: string, toWhom: string) {
        let CPeer = new Peer({ trickle: false, wrtc: wrtc })
        CPeer.signal(ice);
        CPeer.on('signal', (data) => {
            this.socket.emit('handshake', toWhom, JSON.stringify(data))
        })
        CPeer.on('connect', () => {
            this.socket.emit('registerClient', this.myRoom, toWhom);
            this.MyClients.set(toWhom, CPeer)
            console.log('Client connected');
        })
    }

    private StartCreatCoMasterTunel(toWhom: string) {
        const CoPeer = new Peer({ initiator: true, trickle: false, wrtc: wrtc, objectMode: true})
        CoPeer.on('signal', data => {
            this.socket.emit('handshake', toWhom, JSON.stringify(data))
        })

        this.PrevCoMaster = CoPeer;

    }

    private registerPrevCoMasterTunel(ice: string) {
        this.PrevCoMaster.signal(ice)
        this.isReady = true;
        this.pendingCache = null;
        this.PrevCoMaster.on('connect', () => {
            console.log('PrevCoMaster Registered =>', this.PrevCoMaster);
            const reg: string = JSON.stringify({route: 'REGISTER', maxClientConnections: this.maxConn, name: this.username, socketId: this.socket.id })
            this.PrevCoMaster.send(reg)
        })
    }

    private registerNextCoMasterTunel(ice: string, toWhom: string) {
        const CoPeer = new Peer({ trickle: false, wrtc: wrtc, objectMode: true})
        CoPeer.signal(ice)
        CoPeer.on('signal', (data) => {
            this.socket.emit('handshake', toWhom, JSON.stringify(data))
        })
        CoPeer.on('connect', () => {
            this.NextCoMaster = CoPeer;
            this.NextCoMaster.on('data', (rawdata) => {
                const data = JSON.parse(rawdata);
                if(data.route === 'REGISTER'){
                    this.socket.emit('registerCoMasterTunel', this.myRoom, data.maxClientConnections, data.name, data.socketId);
                }
            })
        })
    }
}