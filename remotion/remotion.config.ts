import { Config } from '@remotion/cli/config';
import path from 'path';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

// The CLI changes to the remotion root before running this config,
// so process.cwd() gives us the correct base path
const getRemotionRoot = () => process.cwd();

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

Config.overrideWebpackConfig((currentConfiguration) => {
    const remotionRoot = getRemotionRoot();
    
    // Debug: Log the resolved paths
    console.log('[remotion.config] Webpack override called');
    console.log('[remotion.config] remotionRoot:', remotionRoot);
    console.log('[remotion.config] @/components alias:', path.join(remotionRoot, 'src', 'components'));
    
    // Get existing aliases but remove any conflicting @/components alias
    const existingAliases = currentConfiguration.resolve?.alias ?? {};
    const filteredAliases = Object.fromEntries(
        Object.entries(existingAliases).filter(([key]) => !key.startsWith('@/components'))
    );
    
    // Get existing plugins or create empty array
    const existingPlugins = currentConfiguration.resolve?.plugins ?? [];
    
    return {
        ...currentConfiguration,
        resolve: {
            ...currentConfiguration.resolve,
            alias: {
                ...filteredAliases,
                // Explicit alias for @/components - this takes precedence
                '@/components': path.join(remotionRoot, 'src', 'components'),
            },
            plugins: [
                ...existingPlugins,
                // Use tsconfig-paths-webpack-plugin to properly resolve tsconfig paths
                new TsconfigPathsPlugin({
                    configFile: path.join(remotionRoot, 'tsconfig.json'),
                }),
            ],
        },
    };
});
