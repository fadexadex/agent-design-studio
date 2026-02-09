/**
 * CORS Middleware Configuration
 */

import cors from 'cors';

export const corsConfig = cors({
    origin: true, // Allow any origin
    credentials: true
});
