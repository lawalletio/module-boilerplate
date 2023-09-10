import WebSocket from 'ws';

declare global {
  var WebSocket: typeof import('ws');
}

global.WebSocket = WebSocket;
