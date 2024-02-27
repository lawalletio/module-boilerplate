import { mockAppListen, mockRouteRes } from "../tests/utils";

const expressMock = () => ({
  listen: mockAppListen,
  use: jest.fn().mockReturnThis(),
});

export const Router = jest.fn(() => ({
  get: jest.fn((_route, fn) => {fn(null, mockRouteRes);}),
  post: jest.fn((_route, fn) => {fn(null, mockRouteRes);}),
  put: jest.fn((_route, fn) => {fn(null, mockRouteRes);}),
  patch: jest.fn((_route, fn) => {fn(null, mockRouteRes);}),
  delete: jest.fn((_route, fn) => {fn(null, mockRouteRes);}),
}));

expressMock.json = jest.fn();
expressMock.Router = Router;

export default expressMock;
