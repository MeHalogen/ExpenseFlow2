// /.netlify/functions/delete-expense
// SBI format IDs: "tabName::rowIndex::type"  (e.g. "Jan::5::debit")
// Native format IDs: plain UUID — searches column A

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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'DELETE')  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }

  try {
    const { id } = JSON.parse(event.body || '{}')
    if (!id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id is required' }) }

    const sheets      = google.sheets({ version: 'v4', auth: getAuth() })
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
    const tabs        = spreadsheet.data.sheets.map(s => ({
      title:   s.properties.title,
      sheetId: s.properties.sheetId,
    }))

    // ── SBI format ID: "tabName::rowIndex::type" ──
    if (id.includes('::')) {
      const [tabName, rowStr] = id.split('::')
      const rowIndex = parseInt(rowStr) // 1-based row number in sheet

      const tab = tabs.find(t => t.title === tabName)
      if (!tab) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: `Tab "${tabName}" not found` }) }

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId:    tab.sheetId,
                dimension:  'ROWS',
                startIndex: rowIndex - 1, // convert to 0-based
                endIndex:   rowIndex,
              },
            },
          }],
        },
      })

      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
    }

    // ── Native format ID: search column A ──
    for (const tab of tabs) {
      const colA = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range:         `${tab.title}!A:A`,
      })
      const rows     = colA.data.values || []
      const rowIndex = rows.findIndex(r => r[0] === String(id))

      if (rowIndex !== -1) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId:    tab.sheetId,
                  dimension:  'ROWS',
                  startIndex: rowIndex,
                  endIndex:   rowIndex + 1,
                },
              },
            }],
          },
        })
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
      }
    }

    return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Row not found' }) }
  } catch (err) {
    console.error('[delete-expense]', err.message)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
