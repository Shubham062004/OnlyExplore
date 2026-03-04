export const logger = {
    info: (message: string, meta?: any) => {
        const log = {
            level: "INFO",
            timestamp: new Date().toISOString(),
            message,
            ...meta,
        };
        console.log(JSON.stringify(log));
    },
    warn: (message: string, meta?: any) => {
        const log = {
            level: "WARN",
            timestamp: new Date().toISOString(),
            message,
            ...meta,
        };
        console.warn(JSON.stringify(log));
    },
    error: (message: string, meta?: any) => {
        const log = {
            level: "ERROR",
            timestamp: new Date().toISOString(),
            message,
            ...meta,
        };
        console.error(JSON.stringify(log));
    }
};
