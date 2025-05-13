import { Socket } from 'net';

export type ResponseConfig = {
  socket: Socket;
};

export type SendResponseConfig = {
  statusCode: number;
  body?: string | Record<string, unknown>;
};

export type SendConfig = {
  statusCode: number;
  body?: string | Record<string, unknown>;
  headers?: Record<string, string>;
};
