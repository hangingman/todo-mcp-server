export class Logger {
    private static instance: Logger;
    private verbose: boolean = false;
    
    private constructor() {}
    
    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    
    setVerbose(verbose: boolean): void {
        this.verbose = verbose;
    }
    
    debug(message: string, ...args: any[]): void {
        if (this.verbose) {
            if (args.length > 0) {
                console.log(`[DEBUG] ${message}`, ...args);
            } else {
                console.log(`[DEBUG] ${message}`);
            }
        }
    }
    
    info(message: string): void {
        console.log(message);
    }
    
    error(message: string): void {
        console.error(`[ERROR] ${message}`);
    }
}