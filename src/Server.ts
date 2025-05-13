import * as net from 'net';

import type {
  ILogger,
  ServerConfig,
  RouteHandler,
  RouteHandlerParams,
  RouteConfig,
} from './Types';
import { Request } from './request';
import { Route } from './route';
import { Response } from './response';

export class Server {
  private host = 'localhost';
  private port = 4221;
  private logger: ILogger = console;
  private server: net.Server;
  private routes: Route[] = [];
  private notFoundHandler: RouteHandler;

  constructor(config?: ServerConfig) {
    const { host, port } = config ?? {};
    this.host = host ?? this.host;
    this.port = port ?? this.port;
    this.logger = config?.logger ?? this.logger;
    this.notFoundHandler =
      config?.notFoundHandler ?? this.createDefaultNotFoundHandler();

    this.server = this.createServer();
  }

  private createDefaultNotFoundHandler(): RouteHandler {
    return async ({ request, response }: RouteHandlerParams) => {
      this.logger.info(`No route found for ${request.method} ${request.path}`);

      response.notFound();

      return Promise.resolve(false);
    };
  }

  private createServer() {
    const server = net.createServer(socket => {
      socket.on('data', data => {
        const request = new Request({ socket, data });
        this.logger.info(`Received request: ${request.method} ${request.path}`);

        const response = new Response({ socket });

        let matchingRoute: Route | undefined;
        for (const route of this.routes) {
          const matchedRoute = route.getMatchingRoute({ request });
          if (matchedRoute) {
            matchingRoute = matchedRoute;
            break;
          }
        }

        if (!matchingRoute) {
          this.logger.info(
            `No matching route found for ${request.method} ${request.path}`
          );
          void this.notFoundHandler({ request, response });
          return;
        }

        // If a matching route is found, add the route bindings to the request
        request.addRouteBindings({ route: matchingRoute });

        // See if the route has handlers
        if (!matchingRoute.hasHandlers()) {
          this.logger.info(
            `No handlers found for ${request.method} ${request.path}`
          );
          void this.notFoundHandler({ request, response });
          return;
        }

        // Call the route handlers
        void matchingRoute.runHandlers({ request, response });
      });

      socket.on('close', () => {
        this.logger.info('Connection closed');
        socket.end();
      });
    });

    return server;
  }

  /**
   * Start the server
   */
  listen(): void {
    this.server.listen(this.port, this.host, () => {
      this.logger.info(`Server is listening on ${this.host}:${this.port}`);
    });
  }

  /**
   * Register a route with the server
   * @param config - The route configuration
   * @returns The created route
   */
  route(config: RouteConfig): Route {
    const route = new Route(config);
    this.routes.push(route);

    this.logger.info(`Route created: ${config.method} ${config.path}`);

    return route;
  }
}
