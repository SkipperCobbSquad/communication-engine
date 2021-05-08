import { createInterface } from 'readline';
import { io } from 'socket.io-client';
import { CoMaster } from './classes/CoMaster';

const socket = io('http://localhost:3000')

let coMaster: CoMaster = null;

socket.on('connect', () => {
    socket.emit('setUsername', 'skipper')
    console.log(socket.id);
})

socket.on('error', console.log)
socket.emit('registerRoom', 'POL', 1, response => {
    if (response.status === 'ok') {
        coMaster = new CoMaster({ socket: socket, roomName: 'POL', maxClientConnections: 1, username: 'skipper' })
        console.log('here1');
    }
})

// const rl = createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// rl.question('What do you think of Node.js? ', (answer) => {
//     socket.emit('registerClient', 'POL', answer.toString())
//     // rl.close();
//     rl.question('What do you think of Node.js? ', (answer) => {
//         socket.emit('registerClient', 'POL', answer.toString())
//         rl.close();
//     });
// });