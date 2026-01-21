/**
 * API Transformation Utilities
 * Transforms between frontend Hindi field names and backend English field names
 * Ensures compatibility without changing any display text
 */

// ============ Enum Mappings ============

/**
 * Status mapping (Hindi → English lowercase)
 */
const STATUS_MAPPING = {
  "खोलना": "open",
  "समाधान किया": "closed",
  "पुन: खोला गया": "open",
  "पुनः खोला गया": "open",
  "बंद": "closed",
  "रद्द किया गया": "closed",
};

/**
 * Stage mapping (Hindi → English lowercase - CropStage enum)
 */
const STAGE_MAPPING = {
  "बुआई": "sowing",
  "वृद्धि": "vegetative",
  "फूल पर": "flowering",
  "फल पर": "fruiting",
  "कटाई": "harvest",
  "भंडार": "storage",
  "बिक्री": "sale",
  "भुगतान": "payment",
};

/**
 * Season mapping (Hindi → English)
 */
const SEASON_MAPPING = {
  "रबी": "Rabi",
  "खरीफ": "Kharif",
  "जायद": "Zaid",
};

/**
 * Task Status mapping (Hindi → English lowercase)
 */
const TASK_STATUS_MAPPING = {
  "नया": "new",
  "प्रगति पर": "in_progress",
  "रोक पर": "on_hold",
  "समाधान किया गया": "resolved",
  "बंद": "closed",
  "विलंबित": "delayed",
  "रद्द किया गया": "cancelled",
  "पुनः खोला गया": "reopened",
};

/**
 * Task Type mapping (Hindi Category + Sub Category → TaskType enum)
 * Maps category/sub_category combinations to TaskType enum values
 */
const TASK_TYPE_MAPPING = {
  // बुआई (Sowing) category
  "बुआई": "other", // Default for sowing category
  "खरार": "other",
  "रोटावेटर": "other",
  "मल्चर": "other",
  "पस्टार": "other",
  "बोइनी": "other",
  "प्लाउ": "other",
  
  // सिंचाई (Irrigation) category
  "सिंचाई": "irrigation",
  "पलेवा (बीज बोने से पहले)": "irrigation",
  "पहली पानी": "irrigation",
  "दूसरी पानी": "irrigation",
  "तीसरी पानी": "irrigation",
  "चौथी पानी": "irrigation",
  "पाँचवीं पानी": "irrigation",
  "ठेका सिंचाई": "irrigation",
  
  // खाद (Fertilizer) category
  "खाद": "fertilizer",
  "बीज उपचार": "fertilizer",
  "डीएपी": "fertilizer",
  "यूरिया": "fertilizer",
  "दवाई": "pesticide",
  "पोटाश": "fertilizer",
  "जिंक": "fertilizer",
  "सल्फर": "fertilizer",
  "सुपर": "fertilizer",
  
  // कटाई (Harvest) category
  "कटाई": "harvest",
  "थ्रेसर": "harvest",
  "हार्वेस्टर": "harvest",
  "पंखा": "harvest",
  "ठेका कटाई": "harvest",
  
  // ईंधन (Fuel) category
  "ईंधन": "transport",
  "डीज़ल": "transport",
  "पेट्रोल": "transport",
  
  // बिक्री (Sale) category
  "बिक्री": "sale",
  "मंडी बिक्री": "sale",
  "सोसाइटी बिक्री": "sale",
  
  // भंडार (Storage) category
  "भंडार": "storage_in",
  "खेत क्रमांक": "storage_in",
  "वेयरहाउस": "storage_in",
  "अन्य (इनपुट परीक्षण)": "storage_in",
  
  // Default fallback
  "": "other",
};

/**
 * Map category and sub_category to task_type
 */
function mapCategoryToTaskType(category, subCategory) {
  if (subCategory && TASK_TYPE_MAPPING[subCategory]) {
    return TASK_TYPE_MAPPING[subCategory];
  }
  if (category && TASK_TYPE_MAPPING[category]) {
    return TASK_TYPE_MAPPING[category];
  }
  return "other"; // Default fallback
}

/**
 * Work Order Status mapping (English → English lowercase)
 */
const WORK_ORDER_STATUS_MAPPING = {
  "New": "open",
  "In Progress": "in_progress",
  "On Hold": "open", // Map to open
  "Resolved": "completed",
  "Reopen": "open",
  "Closed": "completed",
  "Cancelled": "cancelled",
};

// ============ Helper Functions ============

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
  }
  return null;
}

/**
 * Format date to ISO string
 */
function formatDate(dateValue) {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return dateValue.toISOString();
  }
  if (typeof dateValue === 'string') {
    // If it's already in ISO format, return as-is
    if (dateValue.includes('T') || dateValue.includes('Z')) {
      return dateValue;
    }
    // If it's a date-only string (YYYY-MM-DD), convert to ISO
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return dateValue;
}

/**
 * Calculate total cost from resources array
 */
function calculateTotalCost(resources) {
  if (!Array.isArray(resources)) return 0;
  return resources.reduce((sum, r) => {
    const cost = Number(r.total_cost) || 0;
    return sum + cost;
  }, 0);
}

// ============ Request Transformers ============

/**
 * Transform crop cycle request from Hindi field names to English
 */
export function transformCropCycleRequest(data) {
  if (!data || typeof data !== 'object') return data;

  const currentUser = getCurrentUser();
  const transformed = {};

  // Helper function to check if value is not empty
  const hasValue = (val) => val !== undefined && val !== null && val !== '';

  // Field name mappings - only include if not empty
  // Map khet → field_id
  if (hasValue(data.khet)) transformed.field_id = data.khet;
  
  // Map buwaiDate → sowing_date (convert to ISO datetime)
  if (hasValue(data.buwaiDate)) {
    const formattedDate = formatDate(data.buwaiDate);
    if (formattedDate) transformed.sowing_date = formattedDate;
  }
  
  // Map katayiDate → expected_harvest_date (convert to ISO datetime)
  if (hasValue(data.katayiDate)) {
    const formattedDate = formatDate(data.katayiDate);
    if (formattedDate) transformed.expected_harvest_date = formattedDate;
  }
  
  // Map vartman_charan → current_stage (map Hindi to CropStage enum)
  if (hasValue(data.vartman_charan)) {
    transformed.current_stage = STAGE_MAPPING[data.vartman_charan] || data.vartman_charan;
  }
  
  // Map varnan → short_description
  if (hasValue(data.varnan)) transformed.short_description = data.varnan;
  
  // Map tipanni → description
  if (hasValue(data.tipanni)) transformed.description = data.tipanni;
  
  // Map season (Hindi to English: रबी→Rabi, खरीफ→Kharif, जायद→Zaid)
  if (hasValue(data.season)) {
    transformed.season = SEASON_MAPPING[data.season] || data.season;
  }
  
  // Map fasal → crop_name
  if (hasValue(data.fasal)) transformed.crop_name = data.fasal;
  if (hasValue(data.fasal_naam)) transformed.crop_name = data.fasal_naam; // Also handle fasal_naam for compatibility
  
  // Map beej_category → crop_variety
  if (hasValue(data.beej_category)) transformed.crop_variety = data.beej_category;
  
  // Map rakba → cultivated_area (if needed)
  if (hasValue(data.rakba)) {
    const area = parseFloat(data.rakba);
    if (!isNaN(area)) transformed.cultivated_area = area;
  }
  
  // Map sthiti → status (map Hindi to CropCycleStatus enum)
  if (hasValue(data.sthiti)) {
    transformed.status = STATUS_MAPPING[data.sthiti] || data.sthiti;
  }
  
  // Map notes → notes (will be merged into description by backend)
  if (hasValue(data.notes)) transformed.notes = data.notes;
  
  // Transform resolution fields
  if (hasValue(data.totalExpense)) {
    const expense = parseFloat(data.totalExpense);
    if (!isNaN(expense)) transformed.total_expense = expense;
  }
  if (hasValue(data.totalRevenue)) {
    const revenue = parseFloat(data.totalRevenue);
    if (!isNaN(revenue)) transformed.total_revenue = revenue;
  }
  if (hasValue(data.actualHarvestDate)) {
    const formattedDate = formatDate(data.actualHarvestDate);
    if (formattedDate) transformed.actual_harvest_date = formattedDate;
  }
  if (hasValue(data.resolutionComments)) transformed.resolution_comments = data.resolutionComments;
  if (hasValue(data.observation)) transformed.observation = data.observation;

  // Handle English field names (for updates or direct API calls)
  if (hasValue(data.field_id)) transformed.field_id = data.field_id;
  if (hasValue(data.sowing_date)) {
    const formattedDate = formatDate(data.sowing_date);
    if (formattedDate) transformed.sowing_date = formattedDate;
  }
  if (hasValue(data.expected_harvest_date)) {
    const formattedDate = formatDate(data.expected_harvest_date);
    if (formattedDate) transformed.expected_harvest_date = formattedDate;
  }
  if (hasValue(data.current_stage)) {
    // If it's already English, check if it needs mapping
    transformed.current_stage = STAGE_MAPPING[data.current_stage] || data.current_stage;
  }
  if (hasValue(data.description)) transformed.description = data.description;
  if (hasValue(data.notes)) transformed.notes = data.notes;
  if (hasValue(data.season)) transformed.season = data.season;
  if (hasValue(data.crop_name)) transformed.crop_name = data.crop_name;
  if (hasValue(data.crop_variety)) transformed.crop_variety = data.crop_variety;
  if (hasValue(data.status)) {
    transformed.status = STATUS_MAPPING[data.status] || data.status;
  }

  // Set supervisor_id from current user - REQUIRED FIELD
  if (hasValue(data.supervisor_id)) {
    transformed.supervisor_id = data.supervisor_id;
  } else if (currentUser?.id) {
    transformed.supervisor_id = currentUser.id;
  } else if (currentUser?.user_id) {
    // Check for user_id as fallback (some APIs return user_id instead of id)
    transformed.supervisor_id = currentUser.user_id;
  } else {
    console.warn('⚠️ No supervisor_id available - user may not be logged in');
  }

  // Copy other fields that might be present
  if (hasValue(data.short_description)) transformed.short_description = data.short_description;
  if (data.incident_id !== undefined) transformed.incident_id = data.incident_id; // For updates

  // Log transformation result for debugging
  console.log('🔄 Transformation result:', transformed);
  console.log('🔄 Required fields check:', {
    field_id: !!transformed.field_id,
    crop_name: !!transformed.crop_name,
    sowing_date: !!transformed.sowing_date,
    supervisor_id: !!transformed.supervisor_id
  });

  return transformed;
}

/**
 * Transform task request from frontend format to backend format
 */
export function transformTaskRequest(data) {
  if (!data || typeof data !== 'object') return data;

  console.log('🔄 Task transformer - Input data:', data);

  const currentUser = getCurrentUser();
  const transformed = {};

  // Helper function to check if string is a valid UUID
  const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // CRITICAL: task_type is required by database (task_type NOT NULL)
  // Map category + sub_category → task_type (TaskType enum)
  if (data.category !== undefined || data.sub_category !== undefined) {
    transformed.task_type = mapCategoryToTaskType(data.category, data.sub_category);
  } else if (data.task_type !== undefined && data.task_type) {
    transformed.task_type = TASK_TYPE_MAPPING[data.task_type] || data.task_type;
  } else if (data.type !== undefined && data.type) {
    transformed.task_type = TASK_TYPE_MAPPING[data.type] || data.type;
  } else {
    // Always ensure task_type is set - required by database
    transformed.task_type = 'other';
  }
  
  console.log('🔄 Task transformer - task_type set to:', transformed.task_type);
  
  // CRITICAL: short_description is required by database (NOT NULL)
  if (data.short_description !== undefined && data.short_description) {
    transformed.short_description = data.short_description;
  } else {
    // Provide default if missing
    transformed.short_description = 'Task';
  }
  
  if (data.description !== undefined) transformed.description = data.description;
  
  // CRITICAL: status is required by database (NOT NULL) - default to 'new'
  if (data.status !== undefined) {
    // Handle both Hindi and English status values
    const statusValue = data.status;
    if (TASK_STATUS_MAPPING[statusValue]) {
      transformed.status = TASK_STATUS_MAPPING[statusValue];
    } else if (typeof statusValue === 'string') {
      // If already in lowercase English, use as-is
      transformed.status = statusValue.toLowerCase();
    } else {
      transformed.status = statusValue;
    }
  } else {
    // Default to 'new' if not provided
    transformed.status = 'new';
  }
  
  // CRITICAL: assigned_to_id is required by database (NOT NULL)
  if (data.assigned_to_id !== undefined && isValidUUID(data.assigned_to_id)) {
    transformed.assigned_to_id = data.assigned_to_id;
  } else if (data.opened_by !== undefined && isValidUUID(data.opened_by)) {
    transformed.assigned_to_id = data.opened_by;
  } else if (currentUser?.id && isValidUUID(currentUser.id)) {
    transformed.assigned_to_id = currentUser.id;
  } else if (currentUser?.user_id && isValidUUID(currentUser.user_id)) {
    transformed.assigned_to_id = currentUser.user_id;
  } else {
    // Fallback - use current user or raise error
    console.warn('⚠️ No valid assigned_to_id - using current user as fallback');
    if (currentUser?.id) {
      transformed.assigned_to_id = currentUser.id;
    } else if (currentUser?.user_id) {
      transformed.assigned_to_id = currentUser.user_id;
    }
  }
  
  // Map opened_date → occurred_at (convert to ISO datetime)
  if (data.opened_date !== undefined) transformed.occurred_at = formatDate(data.opened_date);
  if (data.occurred_at !== undefined) transformed.occurred_at = formatDate(data.occurred_at);
  
  // Additional fields that exist in database
  if (data.labor_count !== undefined) transformed.labor_count = data.labor_count;
  if (data.labor_hours !== undefined) transformed.labor_hours = data.labor_hours;
  if (data.outcome_observation !== undefined) transformed.outcome_observation = data.outcome_observation;
  if (data.gps_lat !== undefined) transformed.gps_lat = data.gps_lat;
  if (data.gps_lng !== undefined) transformed.gps_lng = data.gps_lng;
  
  // Map resolution_notes → description (append to description)
  if (data.resolution_notes !== undefined && data.resolution_notes) {
    if (transformed.description) {
      transformed.description = `${transformed.description}\n\nResolution Notes: ${data.resolution_notes}`;
    } else {
      transformed.description = `Resolution Notes: ${data.resolution_notes}`;
    }
  }
  
  // Handle update_notes for task updates
  if (data.update_notes !== undefined) transformed.update_notes = data.update_notes;

  // Calculate total_cost from resources array (database uses total_cost, not cost)
  if (data.resources && Array.isArray(data.resources)) {
    transformed.total_cost = calculateTotalCost(data.resources);
    // Keep resources array for backend to process
    transformed.resources = data.resources;
  } else if (data.total_cost !== undefined) {
    transformed.total_cost = data.total_cost;
  } else if (data.cost !== undefined) {
    transformed.total_cost = data.cost;
  } else {
    transformed.total_cost = 0;
  }

  // crop_cycle_id comes from URL path parameter, NOT request body
  // DO NOT include it in transformed data - backend gets it from URL

  console.log('🔄 Task transformer - Output data:', transformed);
  console.log('🔄 Task transformer - Required fields check:', {
    task_type: !!transformed.task_type,
    short_description: !!transformed.short_description,
    assigned_to_id: !!transformed.assigned_to_id,
    status: !!transformed.status
  });

  return transformed;
}

/**
 * Transform work order request from frontend format to backend format
 */
export function transformWorkOrderRequest(data) {
  if (!data || typeof data !== 'object') return data;

  const currentUser = getCurrentUser();
  const transformed = {};

  // CRITICAL: title is required by database (NOT NULL)
  // Map shortDesc → title
  if (data.shortDesc !== undefined && data.shortDesc) {
    transformed.title = data.shortDesc;
  } else if (data.title !== undefined && data.title) {
    transformed.title = data.title;
  } else {
    // Provide default if missing
    transformed.title = 'Work Order';
  }
  
  // Map description → description
  if (data.description !== undefined) {
    transformed.description = data.description;
  }
  
  // Map instructions → description (if description is empty)
  // Instructions are not stored in database, merge into description
  if (data.instructions !== undefined && data.instructions && !transformed.description) {
    transformed.description = data.instructions;
  }
  
  // Map assigned_to_id → assigned_to_id (maps to assigned_to in database)
  if (data.assigned_to_id !== undefined) {
    transformed.assigned_to_id = data.assigned_to_id;
  }
  
  // Map due_date → due_date (convert to ISO datetime, then backend converts to DATE)
  if (data.due_date !== undefined) {
    transformed.due_date = formatDate(data.due_date);
  }
  
  // Map status → status (WorkOrderStatus enum)
  if (data.status !== undefined) {
    transformed.status = WORK_ORDER_STATUS_MAPPING[data.status] || data.status;
  }
  
  // Handle closed_at if provided
  if (data.actualResolvedDate !== undefined) {
    transformed.closed_at = formatDate(data.actualResolvedDate);
  }
  if (data.closed_at !== undefined) {
    transformed.closed_at = formatDate(data.closed_at);
  }

  // Copy task_id if present (for linking work order to task)
  // Database uses task_id to link to tasks.task_id
  if (data.task_id !== undefined) {
    transformed.task_id = data.task_id;
  }

  // crop_cycle_id is for frontend convenience (from URL path)
  // Backend uses it to find/create task, then links work order via task_id
  if (data.crop_cycle_id !== undefined) {
    transformed.crop_cycle_id = data.crop_cycle_id;
  }

  // Remove fields not in backend schema
  // workOrderId, holdReason, expectedDate, actualResolvedDate, resolutionComments, 
  // observation, comments, attachments are removed (these belong to tasks, not work orders)

  return transformed;
}

// ============ Response Transformers ============

/**
 * Transform crop cycle response from backend format to frontend format
 */
export function transformCropCycleResponse(data) {
  if (!data || typeof data !== 'object') return data;

  const transformed = { ...data };

  // Map backend field names to frontend expected names
  if (data.id !== undefined) transformed.incident_id = data.id;
  if (data.field_code !== undefined) transformed.field_id = data.field_code;
  if (data.seed_category !== undefined) transformed.crop_variety = data.seed_category;
  if (data.created_at !== undefined) transformed.opened_at = data.created_at;
  if (data.resolved_date !== undefined) transformed.closed_at = data.resolved_date;
  
  // Also map supervisor_id if created_by is present
  if (data.created_by !== undefined && !data.supervisor_id) {
    transformed.supervisor_id = data.created_by;
  }

  // Keep original fields for backward compatibility
  // Frontend might access both field_code and field_id

  return transformed;
}

/**
 * Transform task response from backend format to frontend format
 */
export function transformTaskResponse(data) {
  if (!data || typeof data !== 'object') return data;

  const transformed = { ...data };

  // Database uses task_id as PK - backend response should already have task_id
  // Map id to task_id if backend returns id instead
  if (data.task_id !== undefined) {
    transformed.task_id = data.task_id;
  } else if (data.id !== undefined) {
    transformed.task_id = data.id;
  }
  
  // Database uses task_type, not type
  if (data.task_type !== undefined) {
    transformed.task_type = data.task_type;
  } else if (data.type !== undefined) {
    transformed.task_type = data.type;
  }
  
  // Database uses total_cost, not cost
  if (data.total_cost !== undefined) {
    transformed.total_cost = data.total_cost;
  } else if (data.cost !== undefined) {
    transformed.total_cost = data.cost;
  }
  
  // Database uses assigned_to_id
  if (data.assigned_to_id !== undefined) {
    transformed.assigned_to_id = data.assigned_to_id;
  } else if (data.assigned_to !== undefined) {
    transformed.assigned_to_id = data.assigned_to;
  }
  
  // Database uses created_by_id
  if (data.created_by_id !== undefined) {
    transformed.created_by_id = data.created_by_id;
  } else if (data.created_by !== undefined) {
    transformed.created_by_id = data.created_by;
  }
  
  // Database uses approved_by_id
  if (data.approved_by_id !== undefined) {
    transformed.approved_by_id = data.approved_by_id;
  } else if (data.approved_by !== undefined) {
    transformed.approved_by_id = data.approved_by;
  }
  
  // Database uses closed_at, not resolved_at
  if (data.closed_at !== undefined) {
    transformed.closed_at = data.closed_at;
    transformed.resolved_at = data.closed_at; // For backward compatibility
  } else if (data.resolved_at !== undefined) {
    transformed.closed_at = data.resolved_at;
    transformed.resolved_at = data.resolved_at;
  }

  // Keep original fields
  return transformed;
}

/**
 * Transform work order response from backend format to frontend format
 */
export function transformWorkOrderResponse(data) {
  if (!data || typeof data !== 'object') return data;

  const transformed = { ...data };

  // Map backend field names to frontend expected names
  // Backend returns work_order_id, but also check for id as fallback
  if (data.work_order_id !== undefined) {
    transformed.work_order_id = data.work_order_id;
  } else if (data.id !== undefined) {
    transformed.work_order_id = data.id;
  }
  
  // Map title to shortDesc for frontend compatibility
  if (data.title !== undefined) transformed.shortDesc = data.title;
  
  // Map created_by to created_by_id if needed
  if (data.created_by !== undefined && !data.created_by_id) {
    transformed.created_by_id = data.created_by;
  }
  
  // Map assigned_to to assigned_to_id if needed (model uses assigned_to, schema expects assigned_to_id)
  if (data.assigned_to !== undefined && !data.assigned_to_id) {
    transformed.assigned_to_id = data.assigned_to;
  }

  // Keep original fields for backward compatibility
  return transformed;
}

/**
 * Transform array of responses
 */
export function transformResponseArray(data, transformer) {
  if (!Array.isArray(data)) return data;
  return data.map(item => transformer(item));
}

// ============ URL Detection Helpers ============

/**
 * Check if URL is for crop cycle incidents
 */
export function isCropCycleIncidentUrl(url) {
  return url && url.includes('/crop-cycle-incidents/');
}

/**
 * Check if URL is for tasks
 */
export function isTaskUrl(url) {
  return url && url.includes('/tasks') && !url.includes('/voice/upload');
}

/**
 * Check if URL is for work orders
 */
export function isWorkOrderUrl(url) {
  return url && url.includes('/work-orders');
}

/**
 * Check if request is create or update
 */
export function isCreateOrUpdate(method) {
  return method === 'post' || method === 'put';
}

// ============ Export Helper Functions ============

/**
 * Map Hindi status strings to enum values
 */
export function mapHindiStatusToEnum(status) {
  return TASK_STATUS_MAPPING[status] || status;
}

/**
 * Map Hindi stage strings to CropStage enum
 */
export function mapHindiStageToEnum(stage) {
  return STAGE_MAPPING[stage] || stage;
}

/**
 * Map category/sub_category to TaskType enum
 */
export { mapCategoryToTaskType };

