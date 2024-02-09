import {
  Application,
  Request,
  Response,
  RequestHandler,
  Router,
} from 'express';
import NDK from '@nostr-dev-kit/ndk';

describe('Entrypoint', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('@src/app', () => {
      return {
        use: jest.fn(),
        listen: jest.fn((_port, fn: () => void) => {
          fn();
        }),
      };
    });
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
  });

  it('should start normally', async () => {
    const { setUpRoutes, setUpSubscriptions } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@lib/utils') as typeof import('@lib/utils');
    const { mockedNDK } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@mocks/@nostr-dev-kit/ndk') as typeof import('@mocks/@nostr-dev-kit/ndk');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const app: Application = require('@src/app') as Application;
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

    require('../src/index');
    await Promise.resolve();

    expect(connectFn).not.toThrow();
    expect(setUpSubscriptions).toHaveBeenCalled();
    expect(setUpRoutes).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalled();
  });

  it('should throw error when setting up subscriptions failed', async () => {
    const { setUpRoutes, setUpSubscriptions } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@lib/utils') as typeof import('@lib/utils');
    const { mockedNDK } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@mocks/@nostr-dev-kit/ndk') as typeof import('@mocks/@nostr-dev-kit/ndk');
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

    require('../src/index');
    await Promise.resolve();

    await expect(connectFn).rejects.toEqual(
      new Error('Error setting up subscriptions'),
    );
    expect(setUpSubscriptions).toHaveBeenCalled();
  });

  it('should not start express if routes are empty', async () => {
    const { setUpRoutes, setUpSubscriptions, EmptyRoutesError } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@lib/utils') as typeof import('@lib/utils');
    const { mockedNDK } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@mocks/@nostr-dev-kit/ndk') as typeof import('@mocks/@nostr-dev-kit/ndk');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const app: Application = require('@src/app') as Application;
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

    require('../src/index');
    await Promise.resolve();

    expect(connectFn).not.toThrow();
    expect(setUpSubscriptions).toHaveBeenCalled();
    expect(setUpRoutes).toHaveBeenCalled();
    expect(app.listen).not.toHaveBeenCalled();
  });

  it('should throw error when setting up routes failed forn unknown reasons', () => {
    const { setUpRoutes, setUpSubscriptions } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@lib/utils') as typeof import('@lib/utils');
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(new NDK());
    jest.mocked(setUpRoutes).mockImplementation(() => {
      throw new Error();
    });

    expect(() => {
      require('../src/index');
    }).toThrow(Error);
  });

  it('should catch uncaught exeptions', () => {
    const { setUpRoutes, setUpSubscriptions } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@lib/utils') as typeof import('@lib/utils');
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(new NDK());
    const mockRouter = {
      use: jest.fn().mockImplementation((fn: RequestHandler) => {
        fn({} as Request, null as unknown as Response, () => {});
        return mockRouter;
      }),
    } as unknown as Router;
    const handler = (
      _event: string | symbol,
      listener: NodeJS.UncaughtExceptionListener,
    ) => {
      listener(new Error(), {} as NodeJS.UncaughtExceptionOrigin);
      return process;
    };
    jest.mocked(setUpRoutes).mockReturnValue(mockRouter);
    jest.spyOn(process, 'on').mockImplementation(handler);
    jest.spyOn(process, 'exit').mockImplementation();

    require('../src/index');

    expect(process.exit).toHaveBeenCalled();
  });
});
