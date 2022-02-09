"use strict";

const mysql = require("mysql2/promise");
const excel = require("exceljs");
const { createWriteStream } = require("fs");

async function main() {
    const stream = createWriteStream("pages.xlsx");
    const workbook = new excel.stream.xlsx.WorkbookWriter({ stream });
    const sheet = createWorkSheet(workbook);

    const connection = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "babelino",
        database: "builder",
    });

    const count = await getCountOfRecords(connection);

    let offset = 0;

    while (count - offset > 0) {
        let [rows] = await connection.execute(
            "SELECT * FROM `pages` LIMIT ? OFFSET ?",
            [8, offset]
        );

        offset += 8;

        for (const row of rows) {
            sheet.addRow(row).commit();
        }
    }

    sheet.commit();
    await workbook.commit();

    connection.end();
}

function createWorkSheet(workbook) {
    const sheet = workbook.addWorksheet("Pages");
    sheet.columns = [
        { header: "Id", key: "id", width: 10 },
        { header: "Name", key: "name_version_a", width: 10 },
        { header: "Alias", key: "alias", width: 10 },
        { header: "Created", key: "created_at", width: 10 },
    ];

    return sheet;
}

async function getCountOfRecords(connection) {
    const [rows] = await connection.query(
        "SELECT COUNT(id) AS count FROM pages"
    );
    const { count } = rows[0];

    return count;
}

main();
