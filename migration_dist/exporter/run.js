"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const firestore_1 = require("./firestore");
const collections_1 = require("./collections");
const BATCHES_DIR = path_1.default.join(__dirname, '../batches');
const LOGS_DIR = path_1.default.join(__dirname, '../logs');
async function main() {
    console.log('--- Starting Firestore Data Export ---');
    // Ensure directories exist
    await fs_extra_1.default.ensureDir(BATCHES_DIR);
    await fs_extra_1.default.ensureDir(LOGS_DIR);
    // Clear previous batch and log files
    await fs_extra_1.default.emptyDir(BATCHES_DIR);
    await fs_extra_1.default.emptyDir(LOGS_DIR);
    const logStream = fs_extra_1.default.createWriteStream(path_1.default.join(LOGS_DIR, 'export.log'), { flags: 'a' });
    const log = (message) => {
        console.log(message);
        logStream.write(`${new Date().toISOString()} - ${message}\n`);
    };
    log('Export process started.');
    for (const collectionConfig of collections_1.collectionsToExport) {
        log(`\nExporting collection: ${collectionConfig.collectionId}`);
        try {
            await (0, firestore_1.streamFirestoreCollection)(collectionConfig, BATCHES_DIR, log);
            log(`Successfully exported collection: ${collectionConfig.collectionId}`);
        }
        catch (error) {
            log(`!!!!!!!!!! ERROR exporting collection ${collectionConfig.collectionId} !!!!!!!!!!!`);
            log(String(error));
            if (error instanceof Error && error.stack) {
                log(error.stack);
            }
            log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        }
    }
    log('\n--- Firestore Data Export Complete ---');
    log(`SQL batch files are located in: ${BATCHES_DIR}`);
    logStream.end();
}
main().catch(error => {
    console.error("A critical error occurred during the export process:", error);
    process.exit(1);
});
