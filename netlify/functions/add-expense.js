// /.netlify/functions/add-expense
// Writes in SBI Expense format: A=Date, B=Debit, C=Credit, E=Purpose
// Finds the matching month tab (handles "Jan", "Jan 2026" etc.) or creates one

const { google } = require('googleapis')
const SHEET_ID = process.env.SHEET_ID

const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const FULLMONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December']

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

// Find an existing tab that matches the given date's month
async function findOrCreateTab(sheets, spreadsheetId, dateStr) {
  const d       = new Date(dateStr)
  const abbr    = MONTHS[d.getMonth()]        // "May"
  const full    = FULLMONTHS[d.getMonth()]    // "May" (same for May)
  const withYr  = `${abbr} ${d.getFullYear()}` // "May 2026"

  const meta   = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' })
  const titles = meta.data.sheets.map(s => s.properties.title)

  // Try candidates: "May 2026", "May", "May 2026", "May" (full name)
  for (const candidate of [withYr, abbr, full, `${full} ${d.getFullYear()}`]) {
    if (titles.includes(candidate)) return candidate
  }

  // Create new tab with SBI-style headers
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: withYr } } }] },
  })
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `${withYr}!A1`, values: [['Date']] },
        { range: `${withYr}!B2`, values: [['Debit']] },
        { range: `${withYr}!C2`, values: [['Credit']] },
        { range: `${withYr}!E2`, values: [['Purpose']] },
        { range: `${withYr}!F2`, values: [['Balance']] },
      ],
    },
  })

  return withYr
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }

  try {
    const body = JSON.parse(event.body || '{}')
    const { amount, purpose, date, isExpense } = body

    if (!amount || !date) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'amount and date are required' }) }
    }

    const sheets  = google.sheets({ version: 'v4', auth: getAuth() })
    const tabName = await findOrCreateTab(sheets, SHEET_ID, date)

    // SBI row: A=date, B=debit(expense), C=credit(income), D='', E=purpose, F-K=''
    const debit  = isExpense !== false ? amount : ''
    const credit = isExpense === false ? amount : ''
    const row    = [date, debit, credit, '', purpose || '', '', '', '', '', '', '']

    await sheets.spreadsheets.values.append({
      spreadsheetId:    SHEET_ID,
      range:            `${tabName}!A:K`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody:      { values: [row] },
    })

    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ success: true, tab: tabName }),
    }
  } catch (err) {
    console.error('[add-expense]', err.message)
    return {
      statusCode: 500,
      headers:    CORS,
      body:       JSON.stringify({ error: err.message }),
    }
  }
}
