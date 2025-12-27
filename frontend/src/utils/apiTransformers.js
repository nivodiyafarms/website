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
 * Stage mapping (Hindi → English lowercase)
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
 * Task Type mapping (Hindi Category → English lowercase)
 */
const TASK_TYPE_MAPPING = {
  "सिंचाई": "irrigation",
  "विद्युत": "electrical",
  "सड़क": "road",
  // Default fallback
  "": "other",
};

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

  // Field name mappings
  if (data.khet !== undefined) transformed.field_id = data.khet;
  if (data.buwaiDate !== undefined) transformed.sowing_date = formatDate(data.buwaiDate);
  if (data.katayiDate !== undefined) transformed.expected_harvest_date = formatDate(data.katayiDate);
  if (data.vartman_charan !== undefined) {
    transformed.current_stage = STAGE_MAPPING[data.vartman_charan] || data.vartman_charan;
  }
  if (data.varnan !== undefined) transformed.description = data.varnan;
  if (data.tipanni !== undefined) transformed.notes = data.tipanni;
  if (data.season !== undefined) transformed.season = data.season;
  if (data.fasal_naam !== undefined) transformed.crop_name = data.fasal_naam;
  if (data.beej_category !== undefined) transformed.crop_variety = data.beej_category;
  if (data.sthiti !== undefined) {
    transformed.status = STATUS_MAPPING[data.sthiti] || data.sthiti;
  }

  // Handle English field names (for updates or direct API calls)
  if (data.field_id !== undefined) transformed.field_id = data.field_id;
  if (data.sowing_date !== undefined) transformed.sowing_date = formatDate(data.sowing_date);
  if (data.expected_harvest_date !== undefined) transformed.expected_harvest_date = formatDate(data.expected_harvest_date);
  if (data.current_stage !== undefined) {
    // If it's already English, check if it needs mapping
    transformed.current_stage = STAGE_MAPPING[data.current_stage] || data.current_stage;
  }
  if (data.description !== undefined) transformed.description = data.description;
  if (data.notes !== undefined) transformed.notes = data.notes;
  if (data.season !== undefined) transformed.season = data.season;
  if (data.crop_name !== undefined) transformed.crop_name = data.crop_name;
  if (data.crop_variety !== undefined) transformed.crop_variety = data.crop_variety;
  if (data.status !== undefined) {
    transformed.status = STATUS_MAPPING[data.status] || data.status;
  }

  // Set supervisor_id from current user
  if (data.supervisor_id !== undefined) {
    transformed.supervisor_id = data.supervisor_id;
  } else if (currentUser?.id) {
    transformed.supervisor_id = currentUser.id;
  }

  // Copy other fields that might be present
  if (data.short_description !== undefined) transformed.short_description = data.short_description;
  if (data.incident_id !== undefined) transformed.incident_id = data.incident_id; // For updates

  // Ensure season is included (required field)
  if (!transformed.season && data.season === undefined) {
    // Try to infer from other fields or set default
    transformed.season = data.season || null;
  }

  return transformed;
}

/**
 * Transform task request from frontend format to backend format
 */
export function transformTaskRequest(data) {
  if (!data || typeof data !== 'object') return data;

  const currentUser = getCurrentUser();
  const transformed = {};

  // Field name mappings
  if (data.category !== undefined) {
    transformed.task_type = TASK_TYPE_MAPPING[data.category] || data.category || 'other';
  }
  if (data.sub_category !== undefined) transformed.sub_type = data.sub_category;
  if (data.short_description !== undefined) transformed.short_description = data.short_description;
  if (data.description !== undefined) transformed.description = data.description;
  if (data.status !== undefined) {
    transformed.status = TASK_STATUS_MAPPING[data.status] || data.status;
  }
  if (data.opened_date !== undefined) transformed.occurred_at = formatDate(data.opened_date);
  if (data.expected_resolution_date !== undefined) transformed.resolved_at = formatDate(data.expected_resolution_date);

  // Handle English field names (for updates)
  if (data.task_type !== undefined) {
    transformed.task_type = TASK_TYPE_MAPPING[data.task_type] || data.task_type;
  }
  if (data.type !== undefined) {
    // Backend schema expects task_type, but some code might send type
    transformed.task_type = TASK_TYPE_MAPPING[data.type] || data.type;
  }
  if (data.sub_type !== undefined) transformed.sub_type = data.sub_type;
  if (data.occurred_at !== undefined) transformed.occurred_at = formatDate(data.occurred_at);
  if (data.resolved_at !== undefined) transformed.resolved_at = formatDate(data.resolved_at);

  // Calculate cost from resources array
  if (data.resources && Array.isArray(data.resources)) {
    transformed.cost = calculateTotalCost(data.resources);
    // Keep resources array for backend to process (backend calculates cost from it)
    transformed.resources = data.resources;
  } else if (data.cost !== undefined) {
    transformed.cost = data.cost;
  } else {
    transformed.cost = 0;
  }

  // Handle assigned_to_id (schema requires it)
  if (data.assigned_to_id !== undefined) {
    transformed.assigned_to_id = data.assigned_to_id;
  } else if (data.opened_by !== undefined) {
    // Map opened_by to assigned_to_id if present
    transformed.assigned_to_id = data.opened_by;
  } else if (currentUser?.id) {
    // Use current user as fallback (required by schema)
    transformed.assigned_to_id = currentUser.id;
  }

  // Set created_by from current user (backend will override with current_user.id)
  // But include it in case backend needs it
  if (data.created_by !== undefined) {
    transformed.created_by = data.created_by;
  } else if (currentUser?.id) {
    transformed.created_by = currentUser.id;
  }

  // Copy crop_cycle_id if present
  if (data.crop_cycle_id !== undefined) transformed.crop_cycle_id = data.crop_cycle_id;

  // Remove fields not in backend schema
  // hold_reason, cancel_reason, resolution_comments, observation are removed
  // resources is kept for backend to process

  return transformed;
}

/**
 * Transform work order request from frontend format to backend format
 */
export function transformWorkOrderRequest(data) {
  if (!data || typeof data !== 'object') return data;

  const currentUser = getCurrentUser();
  const transformed = {};

  // Field name mappings
  if (data.shortDesc !== undefined) transformed.title = data.shortDesc;
  if (data.description !== undefined) {
    transformed.description = data.description;
  }
  // Handle instructions - schema accepts it as optional
  if (data.instructions !== undefined) {
    transformed.instructions = data.instructions;
  }
  if (data.assigned_to_id !== undefined) transformed.assigned_to_id = data.assigned_to_id;
  if (data.status !== undefined) {
    transformed.status = WORK_ORDER_STATUS_MAPPING[data.status] || data.status;
  }
  if (data.due_date !== undefined) transformed.due_date = formatDate(data.due_date);
  if (data.actualResolvedDate !== undefined) transformed.closed_at = formatDate(data.actualResolvedDate);

  // Handle English field names (for updates)
  if (data.title !== undefined) transformed.title = data.title;
  if (data.instructions !== undefined) transformed.instructions = data.instructions;
  if (data.closed_at !== undefined) transformed.closed_at = formatDate(data.closed_at);

  // Set created_by from current user
  if (data.created_by !== undefined) {
    transformed.created_by = data.created_by;
  } else if (currentUser?.id) {
    transformed.created_by = currentUser.id;
  }

  // Copy crop_cycle_id if present
  if (data.crop_cycle_id !== undefined) transformed.crop_cycle_id = data.crop_cycle_id;

  // Remove fields not in backend schema
  // holdReason, expectedDate, resolutionComments, observation, comments, attachments are removed

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

  // Map backend field names to frontend expected names
  if (data.id !== undefined) transformed.task_id = data.id;
  if (data.type !== undefined) transformed.task_type = data.type; // For frontend compatibility
  if (data.cost !== undefined) transformed.total_cost = data.cost; // For frontend compatibility
  
  // Map created_by to created_by_id if needed
  if (data.created_by !== undefined && !data.created_by_id) {
    transformed.created_by_id = data.created_by;
  }
  
  // Map approved_by to approved_by_id if needed
  if (data.approved_by !== undefined && !data.approved_by_id) {
    transformed.approved_by_id = data.approved_by;
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
  if (data.id !== undefined) transformed.work_order_id = data.id;
  if (data.title !== undefined) transformed.shortDesc = data.title; // For frontend compatibility
  
  // Map created_by to created_by_id if needed
  if (data.created_by !== undefined && !data.created_by_id) {
    transformed.created_by_id = data.created_by;
  }
  
  // Map assigned_to to assigned_to_id if needed (model uses assigned_to, schema expects assigned_to_id)
  if (data.assigned_to !== undefined && !data.assigned_to_id) {
    transformed.assigned_to_id = data.assigned_to;
  }

  // Keep original fields
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

