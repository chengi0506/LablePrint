const fs = require('fs');
const path = require('path');

// 讀取字體文件並轉換為base64
const fontPath = path.join(__dirname, '../fonts/NotoSansTC-Regular.ttf');
const font = fs.readFileSync(fontPath);
const fontBase64 = font.toString('base64');

// 創建font.js文件
const content = `export const font = '${fontBase64}';`;
fs.writeFileSync(path.join(__dirname, '../src/font.js'), content); 