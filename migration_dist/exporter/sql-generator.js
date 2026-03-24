"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSqlInsertTransform = createSqlInsertTransform;
const stream_1 = require("stream");
function escapeSqlValue(value) {
    if (value === null || typeof value === 'undefined') {
        return 'NULL';
    }
    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
    }
    if (typeof value === 'number') {
        return String(value);
    }
    if (typeof value === 'string') {
        // Escape single quotes by doubling them
        return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'object') {
        // For arrays or JSONB, stringify and then escape
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    return 'NULL';
}
function createSqlInsertTransform(tableName, transformFn) {
    let isFirstChunk = true;
    let columns = '';
    return new stream_1.Transform({
        writableObjectMode: true,
        readableObjectMode: false,
        transform(chunk, encoding, callback) {
            try {
                const transformedDoc = transformFn(chunk);
                if (!transformedDoc) {
                    // Skip this document if transform returns null/undefined
                    return callback();
                }
                const values = Object.values(transformedDoc).map(escapeSqlValue).join(', ');
                let sql = '';
                if (isFirstChunk) {
                    columns = Object.keys(transformedDoc).join(', ');
                    sql = `INSERT INTO public.${tableName} (${columns})\nVALUES\n`;
                    isFirstChunk = false;
                }
                else {
                    sql = ',\n';
                }
                sql += `(${values})`;
                this.push(sql);
                callback();
            }
            catch (error) {
                console.error("Error during SQL transformation:", error, "Original chunk:", chunk);
                callback(error instanceof Error ? error : new Error(String(error)));
            }
        },
        // Finalizer to remove the last comma and add a semicolon
        flush(callback) {
            // Only add the conflict clause if we actually processed some data
            if (!isFirstChunk) {
                // The primary key for most tables will be 'id', but some might be different.
                // Using a generic ON CONFLICT DO NOTHING is safer if primary keys differ.
                // For this specific app, 'id' is mostly the user UID, but some tables auto-increment.
                // A more robust solution might check tableName.
                const conflictTarget = tableName === 'users' ? '(id)' : '';
                this.push(`\nON CONFLICT ${conflictTarget} DO NOTHING;`);
            }
            callback();
        }
    });
}
