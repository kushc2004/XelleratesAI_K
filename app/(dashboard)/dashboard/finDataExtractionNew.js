const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

class Extract {
    constructor(misFilePath) {
        this.misFilePath = misFilePath;
    }

    unmergeCells(sheet) {
        const range = xlsx.utils.decode_range(sheet['!ref']);
        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cell = sheet[xlsx.utils.encode_cell({ r: row, c: col })];
                if (cell && cell.v !== undefined) {
                    for (let i = row + 1; i <= range.e.r; i++) {
                        const nextCell = sheet[xlsx.utils.encode_cell({ r: i, c: col })];
                        if (nextCell && nextCell.v === undefined) {
                            nextCell.v = cell.v;
                        } else {
                            break;
                        }
                    }
                    for (let j = col + 1; j <= range.e.c; j++) {
                        const nextCell = sheet[xlsx.utils.encode_cell({ r: row, c: j })];
                        if (nextCell && nextCell.v === undefined) {
                            nextCell.v = cell.v;
                        } else {
                            break;
                        }
                    }
                }
            }
        }
    }

    extractData(sheet, rowLabel, quarterlyMonths, typeMap, monthMap) {
        const data = {};
        const headers = [];
    
        // Extract headers from the first row (e.g., row 1 or row 2 depending on your sheet)
        const range = xlsx.utils.decode_range(sheet['!ref']);
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cell = sheet[xlsx.utils.encode_cell({ r: 1, c: col })];  // Assuming headers are in row 2
            headers.push(cell ? { v: cell.v, c: col } : null);
        }
    
        const yearlyColumns = headers.filter(header => header && header.v && header.v.includes('Yearly')).map(header => header.c);
        let yearColumn = Math.min(...yearlyColumns);
    
        data['Yearly'] = [];
        for (const year of yearlyColumns) {
            const yearlyData = sheet[xlsx.utils.encode_cell({ r: typeMap[rowLabel], c: year })].v;
            const t = {
                'month': headers[year].v.split(' ')[1],
                'value': yearlyData
            };
            data['Yearly'].push(t);
            yearColumn += 1;
        }
    
        const monthlyColumns = headers.filter(header => header && header.v && header.v.includes('Monthly')).map(header => header.c);
        let monthColumn = Math.min(...monthlyColumns);
    
        for (const [quarter, months] of Object.entries(quarterlyMonths)) {
            const quarterData = [];
            for (let month of months) {
                month = month.split("'")[0];
                const value = sheet[xlsx.utils.encode_cell({ r: typeMap[rowLabel], c: monthColumn })].v;
                quarterData.push({
                    'month': monthMap[month],
                    'value': value
                });
                monthColumn += 1;
            }
            data[quarter] = quarterData;
        }
    
        return data;
    }
    
}

function main() {
    const quarters = {
        'Q1': ["Apr'23", "May'23", "Jun'23"],
        'Q2': ["Jul'23", "Aug'23", "Sep'23"],
        'Q3': ["Oct'23", "Nov'23", "Dec'23"],
        'Q4': ["Jan'24", "Feb'24", "Mar'24"]
    };

    const typeMap = {
        'Sales': 3,
        'Purchase': 4,
        'CM 1 - Gross Profit (A)': 5
    };

    const monthMap = {
        "Jan": "01",
        "Feb": "02",
        "Mar": "03",
        "Apr": "04",
        "May": "05",
        "Jun": "06",
        "Jul": "07",
        "Aug": "08",
        "Sep": "09",
        "Oct": "10",
        "Nov": "11",
        "Dec": "12"
    };

    const misFilePath = ("/Users/kush/Downloads/MIS - Fy24.xlsx");
    const workbook = xlsx.readFile(misFilePath);
    const extractor = new Extract(misFilePath);

    const sheetName = 'Financial MIS';
    const sheet = workbook.Sheets[sheetName];
    extractor.unmergeCells(sheet);

    const revenue = extractor.extractData(sheet, 'Sales', quarters, typeMap, monthMap);
    const expense = extractor.extractData(sheet, 'Purchase', quarters, typeMap, monthMap);
    const profit = extractor.extractData(sheet, 'CM 1 - Gross Profit (A)', quarters, typeMap, monthMap);

    const financialData = {
        'revenue': revenue,
        'expense': expense,
        'profit': profit
    };

    const jsonData = JSON.stringify(financialData, null, 4);
    console.log(jsonData);
}

main();
