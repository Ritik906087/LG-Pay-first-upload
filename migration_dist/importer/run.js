"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const supabase_1 = require("./supabase");
const BATCHES_DIR = path_1.default.join(__dirname, '../batches');
const LOGS_DIR = path_1.default.join(__dirname, '../logs');
async function main() {
    console.log('--- Starting Supabase Data Import ---');
    await fs_extra_1.default.ensureDir(LOGS_DIR);
    const logStream = fs_extra_1.default.createWriteStream(path_1.default.join(LOGS_DIR, 'import.log'), { flags: 'a' });
    const log = (message) => {
        console.log(message);
        logStream.write(`${new Date().toISOString()} - ${message}\n`);
    };
    const client = await (0, supabase_1.getDBClient)();
    log('Successfully connected to Supabase database.');
    try {
        const batchFiles = await fs_extra_1.default.readdir(BATCHES_DIR);
        const sqlFiles = batchFiles.filter(file => file.endsWith('.sql')).sort();
        if (sqlFiles.length === 0) {
            log('No .sql batch files found to import. Please run the exporter first.');
            return;
        }
        log(`Found ${sqlFiles.length} batch files to process.`);
        for (const file of sqlFiles) {
            const filePath = path_1.default.join(BATCHES_DIR, file);
            log(`\nProcessing batch file: ${file}`);
            try {
                const sqlContent = await fs_extra_1.default.readFile(filePath, 'utf-8');
                // Execute the entire file content as a single query
                if (sqlContent.trim().length > 0) {
                    await client.query(sqlContent);
                    log(`  -> Successfully imported ${file}.`);
                }
                else {
                    log(`  -> Skipped empty file ${file}.`);
                }
            }
            catch (error) {
                log(`  !!!!!!!!!! ERROR processing ${file} !!!!!!!!!!!`);
                log(String(error));
                // Continue to the next file, but log the error.
            }
        }
    }
    catch (error) {
        log(`A critical error occurred during the import process: ${String(error)}`);
    }
    finally {
        await (0, supabase_1.closeDBClient)();
        log('\n--- Supabase Data Import Complete ---');
        logStream.end();
    }
}
main().catch(error => {
    console.error("A critical error occurred outside the main import loop:", error);
    process.exit(1);
});
