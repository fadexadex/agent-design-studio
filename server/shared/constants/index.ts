/**
 * Application Constants
 */

export const APP_CONSTANTS = {
    // Server
    DEFAULT_PORT: 3001,

    // API
    API_VERSION: 'v1',

    // Video
    MAX_VIDEO_DURATION: 300, // 5 minutes in seconds
    DEFAULT_FPS: 30,

    // Iteration
    MAX_ITERATIONS: 3,

    // Timeouts
    REQUEST_TIMEOUT: 30000, // 30 seconds
    RENDER_TIMEOUT: 300000, // 5 minutes
} as const;

export const PATHS = {
    OUTPUT_DIR: './output',
    PREVIEW_DIR: './output/previews',
    TEMP_DIR: './output/temp',
    EDITOR_STATES_DIR: './output/editor-states',
} as const;
