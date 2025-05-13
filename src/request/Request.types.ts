import { Socket } from 'net';
import type { Route } from '../route';

export type RequestMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD'
  | 'ALL';

export type RequestConfig = {
  socket: Socket;
  data: Buffer;
};

export type AddRouteBindingsParams = {
  route: Route;
};
