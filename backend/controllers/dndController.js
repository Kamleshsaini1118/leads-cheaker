  import axios from "axios";
import { db } from "../config/db.js";          // MySQL only

// -----------------------------------------------
// RANDOM SUBJECTS & ENDPOINTS
// -----------------------------------------------
const SUBJECTS = [
  "For Fund Support",
  "seed funding(grant)",
  "seed funding",
  "Need grant funding",
  "Seed Funding"
];

const ENDPOINTS = [
  "/enquiry",
  "/tax-calculator",
  "/post/top-government-msme-schemes-for-small-businesses-in-2025",
  "/post/ngo-grants-in-india",
  "/success",
  "/seed-funding-consultancy",
  "/business-suchna"
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// -----------------------------------------------
// Generate random backdated date (7–30 days)
// -----------------------------------------------
function getRandomPastDate() {
  const today = new Date();
  const minDays = 7;
  const maxDays = 30;
  const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  today.setDate(today.getDate() - randomDays);
  return today;
}

// -----------------------------------------------
// MAIN CONTROLLER
// -----------------------------------------------
export const searchNumber = async (req, res) => {
  try {
    const { mobile } = req. query;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // SQL search fields
    const searchFields = [
      "mobile",
      "phone",
      "phone_number",
      "contact_number",
      "mobile_number",
      "contact"
    ];

    // MySQL tables - prioritize `director_profiles` first so we stop searching other tables when found
    const tables = [
      "director_profiles",
      "tax_enquiries",
      "social_enquiries",
      "mailmodo",
      "incubation_enquiries",
      "grievances",
      "fb_leads_campaign",
      "enquiries",
      "aisensy_records",
    ];

    let finalRecord = null; // 🔥 This will store ONLY ONE unified record

    // -----------------------------------------------------
    // Helper function: maps any SQL row into final format
    // -----------------------------------------------------
    const mapSqlToUnified = (row) => ({
      name:
        row.full_name ||
        row.name ||
        row.contact_name ||
        null,

      company_name:
        row.company ||
        row.company_name ||
        row.organisation ||
        null,

      email:
        row.email ||
        row.mail ||
        row.contact_email ||
        null,

      phone_number:
        row.mobile ||
        row.phone ||
        row.phone_number ||
        row.contact_number ||
        row.mobile_number ||
        mobile,

      state:
        row.state ||
        row.location ||
        row.region ||
        null,

      subject: pickRandom(SUBJECTS),
      endpoint: pickRandom(ENDPOINTS),
      created_at: getRandomPastDate()
    });

    // =====================================================
    // 1️⃣ SEARCH ALL SQL TABLES (Stop at FIRST match)
    // =====================================================
    for (const table of tables) {
      try {
        if (finalRecord) break;

        const [columns] = await db.query(`SHOW COLUMNS FROM ${table}`);
        const availableColumns = columns.map((c) => c.Field);

        const conditions = [];
        const values = [];

        for (const field of searchFields) {
          if (availableColumns.includes(field)) {
            conditions.push(`${field} = ?`);
            values.push(mobile);
          }
        }

        if (conditions.length === 0) continue;

        const query = `
          SELECT * FROM ${table}
          WHERE ${conditions.join(" OR ")}
          LIMIT 1
        `;

        const [rows] = await db.query(query, values);

        if (rows.length > 0) {
          finalRecord = mapSqlToUnified(rows[0]);
          // tag which table produced the result (helpful for UI/debugging)
          finalRecord.source_table = table;
        }

      } catch (err) {
        console.log(`Error in table ${table}:`, err);
      }
    }

    // MongoDB search removed - using MySQL only

    // =====================================================
    // 3️⃣ FINAL RESPONSE - ALWAYS SINGLE OBJECT
    // =====================================================
    return res.json({
      success: true,
      mobile,
      record: finalRecord || null
    });

  } catch (error) {
    console.log("❌ Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};




import { getSmartfloToken } from "../utils/smartflo.js";

export const addToDnd = async (req, res) => {
  try {
    const { mobile, note } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }
   if(mobile){
      let existing = await db.query(
        "SELECT * FROM dnd_numbers WHERE mobile = ?",
        [mobile]
      );

        if(existing[0].length > 0){
      return  res.status(400).json({
        success: false,
        message: "Mobile number already in DND list",
      })
   }
    
   }
 // SAVE INTO LOCAL DB
    await db.query(
      "INSERT INTO dnd_numbers (mobile, note) VALUES (?, ?)",
      [mobile, note || null] // note optional
    );

    // GET TATA SMARTFLO TOKEN
    const token = await getSmartfloToken();

    // YOUR STATIC DND LIST ID
    const DND_LIST_ID = "3855"; // MUST be string

    let sfResponse;

    try {
      // CALL SMARTFLO BULK DND ADD API
      sfResponse = await axios.post(
        `https://api-smartflo.tatateleservices.com/v1/broadcast/dnd/leads/${DND_LIST_ID}`,
        {
          data: [mobile], // REQUIRED ARRAY — even for one number
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("❌ Smartflo DND Error Response:", err.response?.data || err.message);

      return res.status(500).json({
        success: false,
        message: "Failed to sync with Smartflo DND API",
        smartflo_error: err.response?.data || err.message,
      });
    }

    // SUCCESS RESPONSE
    return res.json({
      success: true,
      message: "Number added to DND successfully",
      mobile,
      note: note || null,
      smartflo: sfResponse?.data || "No response from Smartflo",
    });

  } catch (err) {
    console.error("❌ Backend Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while adding DND",
    });
  }
};







// ----------------------------------------------------
// GET LOCAL DND LIST (MySQL)
// ----------------------------------------------------
export const getDndList = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM dnd_numbers ORDER BY id DESC"
    );

    return res.json({
      success: true,
      total: rows.length,
      data: rows,
    });

  } catch (err) {
    console.error("❌ ERROR FETCHING LOCAL DND LIST:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch local DND list",
    });
  }
};
