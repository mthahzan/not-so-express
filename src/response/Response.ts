import { Socket } from 'net';

import type {
  ResponseConfig,
  SendResponseConfig,
  SendConfig,
} from './Response.types';

const statusCodeMessages: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error',
};

export class Response {
  private socket: Socket;
  private headers: Record<string, string>;

  constructor(config: ResponseConfig) {
    this.socket = config.socket;
    this.headers = {};
  }

  private getContentType(body: string | Record<string, unknown> | undefined) {
    switch (typeof body) {
      case 'string':
        return 'text/plain';
      case 'object':
        if (body instanceof Buffer) {
          return 'application/octet-stream';
        }
        return 'application/json';
      default:
        return 'text/plain';
    }
  }

  private getContentLength(body: string | Record<string, unknown> | undefined) {
    if (!body) return 0;

    switch (typeof body) {
      case 'string':
        return Buffer.byteLength(body);
      case 'object':
        if (body instanceof Buffer) {
          return body.length;
        }
        return Buffer.byteLength(JSON.stringify(body));
      default:
        return 0;
    }
  }

  private getFormattedBody(body: string | Record<string, unknown> | undefined) {
    switch (typeof body) {
      case 'string':
        return body;
      case 'object':
        if (body instanceof Buffer) {
          return body.toString();
        }
        return JSON.stringify(body);
      default:
        return '';
    }
  }

  private sendResponse(config: SendResponseConfig) {
    const { statusCode, body } = config;
    const statusMessage = statusCodeMessages[statusCode] || 'Unknown Status';

    // Set the response headers
    this.headers = {
      ...this.headers,
      'Content-Type': this.getContentType(body),
      'Content-Length': this.getContentLength(body).toString(),
    };

    // Send the response
    this.socket.write(`HTTP/1.1 ${statusCode} ${statusMessage}\r\n`);

    // Write headers
    Object.entries(this.headers).forEach(([key, value]) => {
      this.socket.write(`${key}: ${value}\r\n`);
    });
    this.socket.write('\r\n');

    // Write body
    if (body) this.socket.write(this.getFormattedBody(body));

    // End the response
    this.socket.end();
  }

  addHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  removeHeader(key: string): void {
    delete this.headers[key];
  }

  resetHeaders(): void {
    this.headers = {};
  }

  ok(body?: string | Record<string, unknown>): void {
    this.sendResponse({ statusCode: 200, body });
  }

  notFound(body?: string | Record<string, unknown>): void {
    this.sendResponse({ statusCode: 404, body });
  }

  send(config: SendConfig): void {
    const { statusCode, body, headers } = config;

    // Set the response headers
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        this.addHeader(key, value);
      });
    }

    // Send the response
    this.sendResponse({ statusCode, body });
  }
}
