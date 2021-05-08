import { io } from 'socket.io-client';
import SimplePeer = require('simple-peer');
import { CoMaster } from './classes/CoMaster';
import { SimplePeer as Peer } from 'simple-peer';
const wrtc = require('wrtc')
import { Hand } from './interfaces';
import { Joiner, Role } from '../server/interfaces';

const socket = io('http://localhost:3000')
let CPeer: any = null;
let comaster: CoMaster = null

socket.on('connect', () => {
    socket.emit('setUsername', 'pantal')
    console.log(socket.id);
})
socket.on('error', (e) => { console.log(e); })

socket.emit('joinRoom', 'POL')

// socket.on('JoinConInfo',(preset)=>{
//     const set = JSON.parse(preset)
//     console.log(set);
//     CPeer = new SimplePeer({initiator: true, trickle: false, wrtc: wrtc})
//     CPeer.on('signal',(data)=>{

//         socket.emit('handshake', set.connectTo, JSON.stringify(data))
//     })
// })

// socket.on('handshake', (prehand: string)=>{
//     const hand : Hand = JSON.parse(prehand)
//     CPeer.signal(hand.ice);
//     CPeer.on('connect', ()=>{
//         console.log('Fuck yyeee');
//     })
// })

socket.on('JoinConInfo', (preset) => {
    const set: Joiner = JSON.parse(preset)
    console.log(set);
    if (set.role === Role.COMASTER) {
        comaster = new CoMaster({ maxClientConnections: 3, roomName: 'POL', username: 'pantal', socket: socket, prevCoMaster: set.connectTo })
    }
})