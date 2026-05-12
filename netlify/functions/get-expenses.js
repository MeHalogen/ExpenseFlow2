// /.netlify/functions/get-expenses
// Reads SBI Expense format: A=Date, B=Debit, C=Credit, D=Salary, E=Purpose, F=Balance
// Also handles app-native format (A1 = "id")

const { google } = require('googleapis')
const SHEET_ID = process.env.SHEET_ID

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
}

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT env variable is not set')
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

const MONTH_MAP = {
  jan:0, feb:1, mar:2, march:2, apr:3, may:4, jun:5, june:5,
  jul:6, july:6, aug:7, sep:8, sept:8, september:8, oct:9, nov:10, dec:11,
}

function tabMonthYear(title) {
  const parts = title.toLowerCase().split(/[\s_-]+/)
  const mon = MONTH_MAP[parts[0]] ?? 0
  const yr  = parseInt(parts[1]) || new Date().getFullYear()
  return { mon, yr }
}

// Parse Google Sheets date — could be serial number or string
function parseSheetDate(val, fallbackYr, fallbackMon) {
  if (!val) return null
  const str = String(val).trim()
  if (!str) return null
  // Sheets serial number (days since 30 Dec 1899)
  const num = parseFloat(str)
  if (!isNaN(num) && num > 1000 && num < 100000) {
    const d = new Date(Math.round((num - 25569) * 86400 * 1000))
    return d.toISOString().slice(0, 10)
  }
  // Try standard string parse
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

// Read SBI format: 2 header rows, data from row 3
// A=Date, B=Debit, C=Credit, D=Salary, E=Purpose, F=Balance,
// G=Carryover, H=Savings, I=Incentive saving, J=Total savings, K=Grand total
function readSBIFormat(rows, tab) {
  const { mon, yr } = tabMonthYear(tab.title)
  const expenses = []
  let lastDate = null
  // Monthly summary values — constant for the whole tab; use first non-zero found
  let carryover      = 0
  let savings        = 0
  let incentiveSaving= 0
  let totalSavings   = 0
  let grandTotal     = 0

  rows.slice(2).forEach((row, i) => {
    const rowIndex = i + 3 // 1-based sheet row number

    const dateVal = String(row[0] ?? '').trim()
    const debit   = parseFloat(String(row[1] ?? '').replace(/,/g, '')) || 0
    const credit  = parseFloat(String(row[2] ?? '').replace(/,/g, '')) || 0
    // A=Date(0), B=Debit(1), C=Credit(2), D=Purpose(3), E=Balance(4),
    // F=Carryover(5), G=Savings(6), H=Incentive saving(7), I=Total savings(8), J=Grand total(9)
    const purpose = String(row[3] ?? '').trim()
    const balance = parseFloat(String(row[4] ?? '').replace(/,/g, '')) || 0

    // Collect monthly summary columns
    const rowCarryover       = parseFloat(String(row[5]  ?? '').replace(/,/g, '')) || 0
    const rowSavings         = parseFloat(String(row[6]  ?? '').replace(/,/g, '')) || 0
    const rowIncentive       = parseFloat(String(row[7]  ?? '').replace(/,/g, '')) || 0
    const rowTotalSavings    = parseFloat(String(row[8]  ?? '').replace(/,/g, '')) || 0
    const rowGrandTotal      = parseFloat(String(row[9]  ?? '').replace(/,/g, '')) || 0

    if (!carryover && rowCarryover)        carryover       = rowCarryover
    if (!savings && rowSavings)            savings         = rowSavings
    if (!incentiveSaving && rowIncentive)  incentiveSaving = rowIncentive
    if (!totalSavings && rowTotalSavings)  totalSavings    = rowTotalSavings
    // Grand total updates per-row (balance + totalSavings) — keep latest
    if (rowGrandTotal) grandTotal = rowGrandTotal

    if (!debit && !credit) return

    if (dateVal) {
      const parsed = parseSheetDate(dateVal, yr, mon)
      if (parsed) lastDate = parsed
    }

    const date = lastDate || `${yr}-${String(mon + 1).padStart(2, '0')}-01`

    const summary = { carryover, savings, incentiveSaving, totalSavings, grandTotal }

    if (debit > 0) {
      expenses.push({
        id:         `${tab.title}::${rowIndex}::debit`,
        amount:     debit,
        category:   purpose || 'Other',
        mode:       '',
        bank:       '',
        note:       purpose,
        date,
        created_at: date,
        isIncome:   false,
        balance,
        ...summary,
      })
    }

    if (credit > 0) {
      expenses.push({
        id:         `${tab.title}::${rowIndex}::credit`,
        amount:     credit,
        category:   purpose || 'Income',
        mode:       '',
        bank:       '',
        note:       purpose || 'Income',
        date,
        created_at: date,
        isIncome:   true,
        balance,
        ...summary,
      })
    }
  })

  return expenses
}

// Read app-native format: 1 header row, columns: id,amount,category,mode,bank,note,date,created_at
const INCOME_CATS = new Set(['Salary','Freelance','Investment','Gift','Other Income'])
function readNativeFormat(rows) {
  return rows.slice(1)
    .filter(r => r[0])
    .map(row => ({
      id:         String(row[0] ?? ''),
      amount:     parseFloat(row[1]) || 0,
      category:   String(row[2] ?? ''),
      mode:       String(row[3] ?? ''),
      bank:       String(row[4] ?? ''),
      note:       String(row[5] ?? ''),
      date:       String(row[6] ?? ''),
      created_at: String(row[7] ?? ''),
      isIncome:   INCOME_CATS.has(String(row[2] ?? '')),
      balance:    0,
    }))
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }

  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })

    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
    const tabs = meta.data.sheets.map(s => ({
      title:   s.properties.title,
      sheetId: s.properties.sheetId,
    }))

    const allExpenses = []

    for (const tab of tabs) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range:         `${tab.title}!A1:J`,
      })
      const rows = res.data.values || []
      if (rows.length < 2) continue

      // Detect format by A1 content
      const a1 = String(rows[0]?.[0] ?? '').toLowerCase().trim()
      const tabExpenses = a1 === 'id'
        ? readNativeFormat(rows)
        : readSBIFormat(rows, tab)

      allExpenses.push(...tabExpenses)
    }

    allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date))

    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ expenses: allExpenses }),
    }
  } catch (err) {
    console.error('[get-expenses]', err.message)
    return {
      statusCode: 500,
      headers:    CORS,
      body:       JSON.stringify({ error: err.message }),
    }
  }
}
