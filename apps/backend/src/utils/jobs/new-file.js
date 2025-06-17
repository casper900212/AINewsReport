/* eslint-disable @typescript-eslint/no-require-imports */
// jobs/hello.js（CommonJS 語法）
const fs = require('fs')
const path = require('path')

// 建立 output 資料夾（若尚未存在）
const outputDir = path.join(__dirname, '.', 'output')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 時間格式化
const now = new Date()
const pad = (n) => n.toString().padStart(2, '0')
const yyyy = now.getFullYear()
const MM = pad(now.getMonth() + 1)
const dd = pad(now.getDate())
const hh = pad(now.getHours())
const mm = pad(now.getMinutes())
const ss = pad(now.getSeconds())

const filename = `${yyyy}${MM}${dd}-${hh}${mm}${ss}.txt`
const filePath = path.join(outputDir, filename)

const content = `Job executed at ${now.toISOString()}\n`
fs.writeFileSync(filePath, content)

console.log(`[new-file.js] Created file: ${filename}`)
