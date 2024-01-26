import { Router } from 'express';
import NDK from '@nostr-dev-kit/ndk';

describe('Entrypoint', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('../src/app', () => {
      return {
        use: jest.fn(),
        listen: jest.fn((_port, fn) => {
          fn();
        }),
      };
    });
    jest.mock('@lib/utils', () => {
      const ogModule = jest.requireActual('@lib/utils');
      return {
        __esModule: true,
        ...ogModule,
        setUpRoutes: jest.fn(),
        setUpSubscriptions: jest.fn(),
      };
    });
  });

  it('should start normally', async () => {
    const { setUpRoutes, setUpSubscriptions } = require('@lib/utils');
    const { mockedNDK } = require('../__mocks__/@nostr-dev-kit/ndk');
    const app = require('../src/app');
    const mockRouter = {
      use: jest.fn().mockImplementation((fn) => {
        fn({}, null, () => {});
      }),
    } as unknown as Router;
    jest.mocked(setUpRoutes).mockReturnValue(mockRouter);
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(new NDK());
    let connectFn;
    mockedNDK.pool.on.mockImplementation(
      (event: string, fn: (arg0: { url: string }) => void) => {
        if ('relay:connect' === event) {
          connectFn = () => fn({ url: '' });
        } else {
          fn({ url: '' });
        }
      },
    );
    mockedNDK.on.mockImplementation(
      (event: string, fn: (arg0: { url: string }) => void) => {
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
    const { setUpRoutes, setUpSubscriptions } = require('@lib/utils');
    const { mockedNDK } = require('../__mocks__/@nostr-dev-kit/ndk');
    const mockRouter = {
      use: jest.fn().mockImplementation((fn) => {
        fn({}, null, () => {});
      }),
    } as unknown as Router;
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(null);
    jest.mocked(setUpRoutes).mockReturnValue(mockRouter);
    let connectFn;
    mockedNDK.pool.on.mockImplementation(
      (event: string, fn: (arg0: { url: string }) => void) => {
        if ('relay:connect' === event) {
          connectFn = fn({ url: '' });
        } else {
          fn({ url: '' });
        }
      },
    );
    mockedNDK.connect.mockRejectedValue('');

    require('../src/index');
    await Promise.resolve();

    expect(connectFn).rejects.toEqual(
      new Error('Error setting up subscriptions'),
    );
    expect(setUpSubscriptions).toHaveBeenCalled();
  });

  it('should not start express if routes are empty', async () => {
    const {
      setUpRoutes,
      setUpSubscriptions,
      EmptyRoutesError,
    } = require('@lib/utils');
    const { mockedNDK } = require('../__mocks__/@nostr-dev-kit/ndk');
    const app = require('../src/app');
    jest.mocked(setUpRoutes).mockImplementation(() => {
      throw new EmptyRoutesError();
    });
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(new NDK());
    let connectFn;
    mockedNDK.pool.on.mockImplementation(
      (event: string, fn: (arg0: { url: string }) => void) => {
        if ('relay:connect' === event) {
          connectFn = () => fn({ url: '' });
        } else {
          fn({ url: '' });
        }
      },
    );
    mockedNDK.on.mockImplementation(
      (event: string, fn: (arg0: { url: string }) => void) => {
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

  it('should throw error when setting up routes failed forn unknown reasons', async () => {
    const { setUpRoutes, setUpSubscriptions } = require('@lib/utils');
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(new NDK());
    jest.mocked(setUpRoutes).mockImplementation(() => {
      throw new Error();
    });

    expect(() => {
      require('../src/index');
    }).toThrow();
  });

  it('should catch uncaught exeptions', async () => {
    const { setUpRoutes, setUpSubscriptions } = require('@lib/utils');
    jest.mocked(setUpSubscriptions).mockResolvedValueOnce(new NDK());
    const mockRouter = {
      use: jest.fn().mockImplementation((fn) => {
        fn({}, null, () => {});
      }),
    } as unknown as Router;
    jest.mocked(setUpRoutes).mockReturnValue(mockRouter);
    const a: any = (_event: string, listener: (arg0: string) => void) => {
      listener('');
    };
    jest.spyOn(process, 'on').mockImplementation(a);
    jest.spyOn(process, 'exit').mockImplementation();

    require('../src/index');

    expect(process.exit).toHaveBeenCalled();
  });
});
