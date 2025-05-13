import { Socket } from 'net';

import type {
  RequestConfig,
  RequestMethod,
  AddRouteBindingsParams,
} from './Request.types';

export class Request {
  socket: Socket;
  rawData: string;
  protocol: string;
  method: RequestMethod;
  path: string;
  headers: Record<string, string>;
  urlParameters: Record<string, string>;
  pathParameters: Record<string, string>;
  body: string | null = null; // body is null by default

  // custom properties
  props: Record<string, unknown> = {};

  constructor(config: RequestConfig) {
    const {
      rawData,
      protocol,
      method,
      path,
      headers,
      urlParameters,
      pathParameters,
      body,
    } = this.parseRequest(config.data);

    this.socket = config.socket;
    this.rawData = rawData;
    this.protocol = protocol;
    this.method = method;
    this.path = path;
    this.headers = headers;
    this.urlParameters = urlParameters;
    this.pathParameters = pathParameters;
    this.body = body;
  }

  private parseRequest(data: Buffer) {
    const request = data.toString();
    const [method, fullPath, protocol] = request.split(' ');

    // Extract headers from the request
    const headers: Record<string, string> = {};
    const headerLines = request.split('\r\n').slice(1);
    headerLines.forEach(line => {
      const [key, value] = line.split(': ');
      if (key && value) {
        headers[key] = value.trim();
      }
    });

    // Break the full path into uri and url parameters
    const [path, ...urlParametersString] = fullPath.split('?');

    // Resolve URL parameters if any
    const urlParameters: Record<string, string> = {};
    if (urlParametersString.length > 0) {
      const urlParams = urlParametersString.join('&').split('&');
      urlParams.forEach(param => {
        const [key, value] = param.split('=');
        urlParameters[key] = decodeURIComponent(value);
      });
    }

    // Path parameters will only be parsed once the route is identified
    const pathParameters: Record<string, string> = {};

    // Extract the body if present
    let body = null;
    const bodyStartIndex = request.indexOf('\r\n\r\n');
    if (bodyStartIndex !== -1) body = request.slice(bodyStartIndex + 4);

    return {
      rawData: request,
      protocol,
      method: method as RequestMethod,
      path,
      headers,
      urlParameters,
      pathParameters,
      body,
    };
  }

  /**
   * Adds route bindings to the request object
   * @param route The matching route
   */
  addRouteBindings(params: AddRouteBindingsParams): void {
    // Find the path parameters using the route
    const routeSegments = params.route.fullPath.split('/');
    const requestSegments = this.path.split('/');

    const pathParameters: Record<string, string> = {};

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const requestSegment = requestSegments[i];

      // Check if the segment is a path parameter
      if (routeSegment.startsWith('{') && routeSegment.endsWith('}')) {
        const paramName = routeSegment.slice(1, -1);
        pathParameters[paramName] = requestSegment;
      }
    }

    this.pathParameters = pathParameters;
  }
}
