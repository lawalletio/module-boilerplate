import { Request, Response, RequestHandler, Router } from 'express';
import NDK from '@nostr-dev-kit/ndk';
import { Module } from '@src/index';
import { EmptyRoutesError, setUpRoutes, setUpSubscriptions } from '@lib/utils';
import { mockedNDK } from '@mocks/@nostr-dev-kit/ndk';
import { mockAppListen } from '@mocks/express';
import { Outbox } from '@services/outbox';

jest.mock('@lib/utils', () => {
  const ogModule =
    jest.requireActual<typeof import('@lib/utils')>('@lib/utils');
  return {
    __esModule: true,
    ...ogModule,
    setUpRoutes: jest.fn(),
    setUpSubscriptions: jest.fn(),
  };
});
describe('Module', () => {
  beforeEach(() => {
    jest.mocked(setUpRoutes).mockReset();
    jest.mocked(setUpSubscriptions).mockReset();
    mockAppListen.mockReset();
  });

  it('should handle stop if it was never started', async () => {
    const module = Module.build({
      context: { outbox: jest.fn() as unknown as Outbox },
      port: 1234,
    });

    await expect(module.stop()).resolves.not.toThrow();
  });

  it('should use provided configuration', () => {
    const module = Module.build({
      context: { outbox: jest.fn() as unknown as Outbox },
      port: 1234,
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
    jest.mocked(setUpRoutes).mockReturnValue(mockRouter);
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(new NDK());
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

    const module = Module.build();
    module.start();
    await Promise.resolve();

    expect(connectFn).not.toThrow();
    expect(setUpSubscriptions).toHaveBeenCalled();
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

    module.start();
    await Promise.resolve();
    await expect(module.stop()).rejects.toEqual(new Error());
  });

  it('should throw error when setting up subscriptions failed', async () => {
    const mockRouter = {
      use: jest.fn().mockImplementation((fn: RequestHandler) => {
        fn({} as Request, null as unknown as Response, () => {});
        return mockRouter;
      }),
    } as unknown as Router;
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(null);
    jest.mocked(setUpRoutes).mockReturnValue(mockRouter);
    let connectFn: Promise<void> | undefined;
    mockedNDK.pool.on.mockImplementation(
      (event: string, fn: (arg0: { url: string }) => Promise<void>) => {
        if ('relay:connect' === event) {
          connectFn = fn({ url: '' });
        } else {
          void fn({ url: '' });
        }
      },
    );
    mockedNDK.connect.mockRejectedValue('');

    Module.build().start();
    await Promise.resolve();

    await expect(connectFn).rejects.toEqual(
      new Error('Error setting up subscriptions'),
    );
    expect(setUpSubscriptions).toHaveBeenCalled();
  });

  it('should not start express if routes are empty', async () => {
    jest.mocked(setUpRoutes).mockImplementation(() => {
      throw new EmptyRoutesError();
    });
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(new NDK());
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

    Module.build().start();
    await Promise.resolve();

    expect(connectFn).not.toThrow();
    expect(setUpSubscriptions).toHaveBeenCalled();
    expect(setUpRoutes).toHaveBeenCalled();
    expect(mockAppListen).not.toHaveBeenCalled();
  });

  it('should throw error when setting up routes failed forn unknown reasons', () => {
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(new NDK());
    jest.mocked(setUpRoutes).mockImplementation(() => {
      throw new Error();
    });

    expect(() => {
      Module.build().start();
    }).toThrow(Error);
  });
});
