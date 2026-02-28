// frontend/src/utils/apiTransformers.js
/**
 * API Transformation Utilities
 * Frontend: Hindi
 * Backend: English (STRICT, lowercase enums)
 */

// ================= ENUM MAPPINGS =================

// Crop Cycle Status (Hindi → English lowercase)
const STATUS_MAPPING = {
  "खोलना": "open",
  "समाधान किया": "resolved",
  "पुन: खोला गया": "reopened",
  "पुनः खोला गया": "reopened",
  "बंद": "closed",
  "रद्द किया गया": "cancelled",
};

// Crop Cycle Stage (Hindi → English lowercase)
const STAGE_MAPPING = {
  "बुआई": "sowing",
  "अंकुरण": "germination",
  "वृद्धि": "vegetative",
  "फूल पर": "flowering",
  "फल पर": "fruiting",
  "कटाई": "harvest",
  "भंडार": "storage",
  "बिक्री": "sale",
  "भुगतान": "payment",
};

// Season (Hindi → English lowercase)
const SEASON_MAPPING = {
  "रबी": "rabi",
  "खरीफ": "kharif",
  "जायद": "zaid",
};

// ================= HELPERS =================

const hasValue = (v) => v !== undefined && v !== null && v !== "";

function getCurrentUser() {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === "string" && value.includes("T")) {
    return value.split("T")[0]; // YYYY-MM-DD
  }
  return value;
}

// ================= CROP CYCLE (FINAL FIX) =================

/**
 * Hindi frontend → English backend
 * MATCHES FastAPI schema EXACTLY
 */
export function transformCropCycleRequest(data) {
  if (!data || typeof data !== "object") return data;

  const user = getCurrentUser();
  const out = {};

  // -------- REQUIRED --------

  // khet / field_id → field_code
  if (hasValue(data.khet)) out.field_code = data.khet;
  if (hasValue(data.field_id)) out.field_code = data.field_id;

  // supervisor_id → created_by
  if (hasValue(data.supervisor_id)) {
    out.created_by = data.supervisor_id;
  } else if (user?.id) {
    out.created_by = user.id;
  } else if (user?.user_id) {
    out.created_by = user.user_id;
  }

  // -------- CORE --------

  if (hasValue(data.fasal)) out.crop_name = data.fasal;
  if (hasValue(data.crop_name)) out.crop_name = data.crop_name;

  if (hasValue(data.beej_category)) out.seed_category = data.beej_category;
  if (hasValue(data.crop_variety)) out.seed_category = data.crop_variety;

  if (hasValue(data.buwaiDate))
    out.sowing_date = toDateOnly(data.buwaiDate);
  if (hasValue(data.sowing_date))
    out.sowing_date = toDateOnly(data.sowing_date);

  if (hasValue(data.katayiDate))
    out.expected_harvest_date = toDateOnly(data.katayiDate);
  if (hasValue(data.expected_harvest_date))
    out.expected_harvest_date = toDateOnly(data.expected_harvest_date);

  if (hasValue(data.rakba)) {
    const area = Number(data.rakba);
    if (!isNaN(area)) out.cultivated_area = area;
  }
  
  // ✅ Added seed_quantity mapping
  if (hasValue(data.seed_quantity)) {
    const quantity = Number(data.seed_quantity);
    if (!isNaN(quantity)) out.seed_quantity = quantity;
  }

  // -------- ENUMS (LOWERCASE ONLY) --------

  if (hasValue(data.vartman_charan)) {
    out.current_stage =
      STAGE_MAPPING[data.vartman_charan] ||
      String(data.vartman_charan).toLowerCase();
  }

  if (hasValue(data.sthiti)) {
    out.status =
      STATUS_MAPPING[data.sthiti] ||
      String(data.sthiti).toLowerCase();
  }

  if (hasValue(data.season)) {
    out.season =
      SEASON_MAPPING[data.season] ||
      String(data.season).toLowerCase();
  }

  // -------- DEFAULTS (SAFE) --------

  if (!out.current_stage) out.current_stage = "sowing";
  if (!out.status) out.status = "open";

  // -------- TEXT --------

  if (hasValue(data.varnan)) out.short_description = data.varnan;
  if (hasValue(data.tipanni)) out.description = data.tipanni;

  // Full description
  if (hasValue(data.varnan)) {
    out.description = data.varnan;
  }

  // Short description
  if (hasValue(data.short_description)) {
    out.short_description = data.short_description;
  }

  if (hasValue(data.description)) {
    out.description = data.description;
  }

  // Resolution fields
  if (hasValue(data.resolutionComments)) {
    out.resolution_comments = data.resolutionComments;
  }

  if (hasValue(data.resolvedDate)) {
    // Convert datetime to pure date (YYYY-MM-DD)
    const dateOnly = String(data.resolvedDate).split("T")[0];
    out.resolved_date = dateOnly;
  }

  if (hasValue(data.totalExpense)) {
    out.total_expense = Number(data.totalExpense);
  }

  if (hasValue(data.totalRevenue)) {
    out.total_revenue = Number(data.totalRevenue);
  }

  if (hasValue(data.observation)) {
    out.observation = data.observation;
  }

  console.log("✅ FINAL CropCycle Payload:", out);
  return out;
}

// ================= RESPONSE HELPERS =================

export function transformCropCycleResponse(data) {
  if (!data) return data;
  return {
    ...data,
    incident_id: data.crop_cycle_id || data.id,  // ✅ Map crop_cycle_id to incident_id
    field_id: data.field_code,
    crop_variety: data.seed_category,
    supervisor_id: data.created_by,
  };
}

export function transformResponseArray(data, fn) {
  return Array.isArray(data) ? data.map(fn) : data;
}
// ================= TASK MAPPINGS =================

// Task Category (Hindi → English enum)
const TASK_CATEGORY_MAPPING = {
  "बुआई": "sowing",
  "सिंचाई": "irrigation",
  "खाद": "fertilizer",
  "कटाई": "harvest",
  "ईंधन": "fuel",
  "बिक्री": "sale",
  "भंडार": "storage",
};

// Task Subcategory (Hindi → English enum)
const TASK_SUBCATEGORY_MAPPING = {
  // बुआई (Sowing)
  "खरार": "khurar",
  "रोटावेटर": "rotavator",
  "मल्चर": "mulching",
  "पस्टार": "leveling",
  "बोइनी": "seeding",
  "प्लाउ": "ploughing",
  
  // सिंचाई (Irrigation)
  "पलेवा (बीज बोने से पहले)": "paleva",
  "पहली पानी": "first_irrigation",
  "दूसरी पानी": "second_irrigation",
  "तीसरी पानी": "third_irrigation",
  "चौथी पानी": "fourth_irrigation",
  "पाँचवीं पानी": "fifth_irrigation",
  "ठेका सिंचाई": "contract_irrigation",
  
  // खाद (Fertilizer)
  "बीज उपचार": "seed_treatment",
  "डीएपी": "dap",
  "यूरिया": "urea",
  "दवाई": "pesticide",
  "पोटाश": "potash",
  "जिंक": "zinc",
  "सल्फर": "sulfur",
  "सुपर": "super_phosphate",
  
  // कटाई (Harvest)
  "कटाई": "manual_cutting",
  "थ्रेसर": "thresher",
  "हार्वेस्टर": "harvester",
  "पंखा": "winnowing",
  "ठेका कटाई": "contract_harvest",
  
  // ईंधन (Fuel)
  "डीज़ल": "diesel",
  "पेट्रोल": "petrol",
  
  // बिक्री (Sale)
  "मंडी बिक्री": "mandi_sale",
  "सोसाइटी बिक्री": "society_sale",
  
  // भंडार (Storage)
  "खेत क्रमांक": "farm_id",
  "वेयरहाउस": "warehouse",
  "अन्य (इनपुट परीक्षण)": "other",
};

// ================= TASK TRANSFORMER =================

/**
 * Transform Task form data (Hindi) → Backend API (English enums)
 * Matches TaskCreate schema exactly:
 * - category: Optional[TaskCategory]
 * - subcategory: Optional[TaskSubcategory]
 * - short_description: str
 * - description: Optional[str]
 * - assigned_to_id: UUID
 * - severity: Optional[SeverityLevel]
 */
export function transformTaskRequest(data) {
  if (!data || typeof data !== "object") return data;

  const user = getCurrentUser();
  const out = {};

  // Map Hindi category → English enum
  if (hasValue(data.category)) {
    const mappedCategory = TASK_CATEGORY_MAPPING[data.category] || 
                          String(data.category).toLowerCase();
    if (mappedCategory) out.category = mappedCategory;
  }

  // Map Hindi subcategory → English enum
  if (hasValue(data.subcategory)) {
    const mappedSubcategory = TASK_SUBCATEGORY_MAPPING[data.subcategory] || 
                             String(data.subcategory).toLowerCase();
    if (mappedSubcategory) out.subcategory = mappedSubcategory;
  }

  // Required: short_description
  if (hasValue(data.short_description)) {
    out.short_description = data.short_description;
  }

  // Optional: description
  if (hasValue(data.description)) {
    out.description = data.description;
  }

  // Required: assigned_to_id (UUID)
  // Priority: opened_by (if UUID) → current user → fallback
  if (hasValue(data.opened_by)) {
    // Check if opened_by is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(data.opened_by)) {
      out.assigned_to_id = data.opened_by;
    }
  }
  
  // Fallback to current user if assigned_to_id not set
  if (!out.assigned_to_id) {
    if (user?.user_id) {
      out.assigned_to_id = user.user_id;
    } else if (user?.id) {
      out.assigned_to_id = user.id;
    }
  }

  // Optional: severity (if provided, keep as-is or map if needed)
  if (hasValue(data.severity)) {
    out.severity = String(data.severity).toLowerCase();
  }

  // Remove fields NOT in TaskCreate schema:
  // - task_id (auto-generated)
  // - opened_by (already mapped to assigned_to_id)
  // - opened_date (not in schema)
  // - notes (not in schema)
  // - expected_resolution_date (not in schema)
  // - resolution_notes (not in schema)
  // - update_notes (not in schema)
  // - status (handled in TaskUpdate, not TaskCreate)

  console.log("✅ Task Payload (Hindi → English):", out);
  return out;
}

// Modal status (display) -> backend WorkOrderStatus enum
const WORK_ORDER_STATUS_TO_API = {
  New: "open",
  "In Progress": "in_progress",
  "On Hold": "on_hold",
  Resolved: "completed",
  Reopen: "open",
  Closed: "closed",
  Cancelled: "cancelled",
  current: "open",
};

export function transformWorkOrderRequest(data) {
  const transformed = {
    short_description: data.short_description,
    assigned_to: data.assigned_to,
    description: data.description || null,
    due_date: data.due_date || null,
  };
  if (data.status != null && data.status !== "" && WORK_ORDER_STATUS_TO_API[data.status] != null) {
    transformed.status = WORK_ORDER_STATUS_TO_API[data.status];
  }
  if (!transformed.description) delete transformed.description;
  if (!transformed.due_date) delete transformed.due_date;
  return transformed;
}
