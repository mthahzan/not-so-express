import { Request, RequestMethod } from '../request';
import { Response } from '../response';

export type { RequestMethod };

export type RouteHandlerParams = {
  request: Request;
  response: Response;
};
export type RouteHandlerReturnValue = boolean | null | undefined;
export type RouteHandler = (
  params: RouteHandlerParams
) => Promise<RouteHandlerReturnValue> | RouteHandlerReturnValue;

export type RouteConfig = {
  path: string;
  method: RequestMethod;
  handlers?: RouteHandler[];
  parentPath?: string;
};

export type ChildRouteConfig = {
  path: string;
  method: RequestMethod;
  handlers?: RouteHandler[];
};

export type GetMatchingRouteParams = {
  request: Request;
};
