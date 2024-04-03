import { Request, Response, RequestHandler, Router } from 'express';
import NDK from '@nostr-dev-kit/ndk';
import { Module, DirectOutbox } from '../src/index';
import {
  EmptyRoutesError,
  getAllHandlers,
  setUpRoutes,
  subscribeToAll,
} from '../src/lib/utils';
import { mockAppListen, mockedNDK } from './utils';

jest.mock('../src/lib/utils', () => {
  const ogModule =
    jest.requireActual<typeof import('../src/lib/utils')>('../src/lib/utils');
  return {
    __esModule: true,
    ...ogModule,
    setUpRoutes: jest.fn(),
    getAllHandlers: jest.fn(),
    subscribeToAll: jest.fn(),
  };
});
describe('Module', () => {
  beforeEach(() => {
    jest.mocked(setUpRoutes).mockReset();
    jest.mocked(getAllHandlers).mockReset();
    jest.mocked(subscribeToAll).mockReset();
    mockAppListen.mockReset();
  });

  it('should handle stop if it was never started', async () => {
    const module = Module.build({
      context: { outbox: jest.fn() as unknown as DirectOutbox },
      nostrPath: '',
      port: 1234,
      restPath: '',
    });

    await expect(module.stop()).resolves.not.toThrow();
  });

  it('should use provided configuration', () => {
    const module = Module.build({
      context: { outbox: jest.fn() as unknown as DirectOutbox },
      nostrPath: '',
      port: 1234,
      restPath: '',
    });

    expect(module.port).toBe(1234);
  });

  it('should start and stop normally', async () => {
    const mockRouter = {
      use: jest.fn().mockImplementation((fn: RequestHandler) => {
        fn({} as Request, null as unknown as Response, () => {});
        return mockRouter;
      }),
    } as unknown as Router;
    jest.mocked(setUpRoutes).mockResolvedValue(mockRouter);
    jest.mocked(getAllHandlers).mockResolvedValue({});
    jest.mocked(subscribeToAll).mockReturnValue(new NDK());
    let connectFn;
    mockedNDK.pool.on.mockImplementation(
      (event: string, fn: (arg0: { url: string }) => void) => {
        if ('relay:connect' === event) {
          connectFn = () => {
            fn({ url: '' });
          };
        } else {
          fn({ url: '' });
        }
      },
    );
    mockedNDK.on.mockImplementation(
      (_event: string, fn: (arg0: { url: string }) => void) => {
        fn({ url: '' });
      },
    );
    const serverMock = {
      close: jest.fn((fn: (err?: Error) => void) => {
        fn();
      }),
    };
    mockAppListen.mockImplementation((_port, fn) => {
      fn();
      return serverMock;
    });

    const module = Module.build({
      nostrPath: '',
      restPath: '',
    });
    await module.start();

    expect(connectFn).not.toThrow();
    expect(getAllHandlers).toHaveBeenCalled();
    expect(subscribeToAll).toHaveBeenCalled();
    expect(setUpRoutes).toHaveBeenCalled();
    expect(mockAppListen).toHaveBeenCalled();

    await module.stop();

    const serverMockFail = {
      close: jest.fn((fn: (err?: Error) => void) => {
        fn(new Error());
      }),
    };
    mockAppListen.mockImplementation((_port, fn) => {
      fn();
      return serverMockFail;
    });

    await module.start();
    await expect(module.stop()).rejects.toEqual(new Error());
  });

  it('should throw error when setting up subscriptions failed', async () => {
    const mockRouter = {
      use: jest.fn().mockImplementation((fn: RequestHandler) => {
        fn({} as Request, null as unknown as Response, () => {});
        return mockRouter;
      }),
    } as unknown as Router;
    jest.mocked(setUpRoutes).mockResolvedValueOnce(mockRouter);
    jest.mocked(getAllHandlers).mockResolvedValue(null);

    const module = Module.build({
      nostrPath: '',
      restPath: '',
    });

    await expect(() => module.start()).rejects.toEqual(
      new Error('Error setting up subscriptions'),
    );
    expect(getAllHandlers).toHaveBeenCalled();
  });

  it('should not start express if routes are empty', async () => {
    jest.mocked(setUpRoutes).mockRejectedValue(new EmptyRoutesError());
    jest.mocked(getAllHandlers).mockResolvedValue({});
    jest.mocked(subscribeToAll).mockReturnValue(new NDK());
    let connectFn;
    mockedNDK.pool.on.mockImplementation(
      (event: string, fn: (arg0: { url: string }) => void) => {
        if ('relay:connect' === event) {
          connectFn = () => {
            fn({ url: '' });
          };
        } else {
          fn({ url: '' });
        }
      },
    );
    mockedNDK.on.mockImplementation(
      (_event: string, fn: (arg0: { url: string }) => void) => {
        fn({ url: '' });
      },
    );

    await Module.build({
      nostrPath: '',
      restPath: '',
    }).start();

    expect(connectFn).not.toThrow();
    expect(getAllHandlers).toHaveBeenCalled();
    expect(subscribeToAll).toHaveBeenCalled();
    expect(setUpRoutes).toHaveBeenCalled();
    expect(mockAppListen).not.toHaveBeenCalled();
  });

  it('should throw error when setting up routes failed for unknown reasons', async () => {
    jest.mocked(getAllHandlers).mockResolvedValue({});
    jest.mocked(subscribeToAll).mockReturnValue(new NDK());
    jest.mocked(setUpRoutes).mockRejectedValue(new Error());

    await expect(
      Module.build({
        nostrPath: '',
        restPath: '',
      }).start(),
    ).rejects.toEqual(expect.any(Error));
  });
});
