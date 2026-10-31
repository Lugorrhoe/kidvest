import path from 'path';
import { Config } from '@remotion/cli/config';
import { enableTailwind } from '@remotion/tailwind';

// Product components are imported from ../src; alias React (and Recharts, which peer-depends on it)
// to this package's copies so there is exactly one React in the bundle.
const filmRoot = process.cwd();
const own = (pkg: string) => path.resolve(filmRoot, 'node_modules', pkg);

Config.overrideWebpackConfig((current) => {
  const withTailwind = enableTailwind(current);
  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      modules: [path.resolve(filmRoot, 'node_modules'), 'node_modules', ...(withTailwind.resolve?.modules ?? [])],
      alias: {
        ...(withTailwind.resolve?.alias ?? {}),
        react: own('react'),
        'react-dom': own('react-dom'),
        recharts: own('recharts'),
      },
    },
  };
});

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(6);
