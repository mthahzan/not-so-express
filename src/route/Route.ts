import type {
  RouteHandler,
  RouteHandlerParams,
  RequestMethod,
  RouteConfig,
  ChildRouteConfig,
  GetMatchingRouteParams,
} from './Route.types';

export class Route {
  method: RequestMethod;
  fullPath: string;
  relativePath: string;
  private matcher: RegExp;
  private partialMatcher: RegExp;
  private handlers: RouteHandler[];
  private children: Route[];

  constructor(config: RouteConfig) {
    this.method = config.method;
    this.relativePath = config.path;
    this.handlers = config.handlers ?? [];
    this.children = [];

    // If the route has a parent path, use it to create the full path
    this.fullPath = this.getFullPath(config);

    // Create a regex matcher for the path
    this.matcher = this.createMatcher(this.fullPath);
    this.partialMatcher = this.createPartialMatcher(this.fullPath);
  }

  private getFullPath(config: RouteConfig): string {
    // If parent path is not set, return the path
    if (!config.parentPath) return config.path;

    // If the parent path is set to /, return the path
    // This is useful for the root route
    if (config.parentPath === '/') return config.path;

    return `${config.parentPath}${config.path}`;
  }

  // Creates a regex matcher for the path
  // /api/{anything}/test -> /api/(\w+)/test
  // /api/{anything}/{anything} -> /api/(\w+)/(\w+)
  private createMatcher(path: string): RegExp {
    const regex = path.replace(/{(\w+)}/g, '([^/]+)');

    return new RegExp(`^${regex}$`);
  }

  private createPartialMatcher(path: string): RegExp {
    const regex = path.replace(/{(\w+)}/g, '([^/]+)');

    return new RegExp(`^${regex}`);
  }

  private createChildRoute(config: ChildRouteConfig): Route {
    const childRoute = new Route({
      ...config,
      parentPath: this.fullPath,

      // Child routes inherit all the handlers from the parent route
      // and can add their own handlers
      handlers: [...this.handlers, ...(config.handlers ?? [])],
    });

    return childRoute;
  }

  handler(handler: RouteHandler): void {
    this.handlers.push(handler);
  }

  // Adds a child route to the current route
  child(config: ChildRouteConfig): Route {
    const childRoute = this.createChildRoute(config);
    this.children.push(childRoute);

    return childRoute;
  }

  private isRouteMatch(path: string, method: RequestMethod): boolean {
    // Check if the method matches
    if (this.method !== method && this.method !== 'ALL') return false;

    // Check if the path matches
    const match = this.matcher.exec(path);
    if (!match) return false;

    return true;
  }

  private isPartialRouteMatch(path: string): boolean {
    // Check if the path matches
    const match = this.partialMatcher.exec(path);
    if (!match) return false;

    return true;
  }

  getMatchingRoute(params: GetMatchingRouteParams): Route | null {
    const {
      request: { path, method },
    } = params;

    // Check if the route matches
    if (this.isRouteMatch(path, method)) {
      return this;
    }

    // If this route is a partial match, check if any of the child routes match
    if (this.isPartialRouteMatch(path)) {
      // Check if any of the child routes match
      for (const child of this.children) {
        const matchingChild = child.getMatchingRoute(params);
        if (matchingChild) return matchingChild;
      }
    }

    return null;
  }

  hasHandlers(): boolean {
    return this.handlers.length > 0;
  }

  async runHandlers(params: RouteHandlerParams): Promise<void> {
    for (const handler of this.handlers) {
      const keepGoing = await handler(params);
      if (!keepGoing) break;
    }
  }
}
