import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider
} from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ClearIcon from '@mui/icons-material/Clear';
import { formatISO } from "date-fns";

/*
  NOTE: This image path is the one you uploaded. Your environment/tooling
  will convert it to a URL. Keep the same path if you want it referenced.
*/
const screenshotUrl = "/mnt/data/Screenshot 2025-11-23 191156.png";

const statusOptions = [
  "New",
  "In Progress",
  "On Hold",
  "Resolved",
  "Reopen",
  "Closed",
  "Cancelled",
];

export default function WorkOrderForm() {
  const [form, setForm] = useState({
    shortDesc: "",
    description: "",
    assignedTo: "",
    status: "",
    reason: "",
    expectedDate: "",
    resolutionComments: "",
    remarks: "",
    actualResolvedDate: "",
    finalResolution: "",
    observation: "",
  });

  const [attachments, setAttachments] = useState([]);

  // When status becomes "Resolved" autofill actualResolvedDate if empty
  useEffect(() => {
    if (form.status === "Resolved" && !form.actualResolvedDate) {
      const todayISO = formatISO(new Date(), { representation: "date" });
      setForm(prev => ({ ...prev, actualResolvedDate: todayISO }));
    }
  }, [form.status]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      const newFiles = files.map(f => ({ name: f.name, size: f.size, file: f }));
      setAttachments(prev => [...prev, ...newFiles]);
      e.target.value = null;
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple output to console. Replace with API call as needed.
    const payload = {
      ...form,
      attachments: attachments.map(a => a.name),
    };
    console.log("Submit payload:", payload);
    alert("Form JSON logged to console. Replace console.log with API POST.");
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Top row: Title + small screenshot preview (right) */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          <Paper sx={{ bgcolor: "black", color: "white", p: 1 }}>
            <Typography variant="h6" align="center">
              Work Order Form / वर्क ऑर्डर फॉर्म
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4} sx={{ textAlign: "right" }}>
          {/* small preview of uploaded screenshot as reference */}
          <img
            src={screenshotUrl}
            alt="screenshot-ref"
            style={{ maxWidth: 220, borderRadius: 6, border: "1px solid #ddd" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} mt={1}>
        {/* LEFT COLUMN: Labels + Inputs */}
        <Grid item xs={12} md={7}>
          {/* Short Description */}
          <Paper sx={{ bgcolor: "#33CCCC", p: 1, mt: 1 }}>
            <Typography>संक्षिप्त विवरण (Short Description)</Typography>
          </Paper>
          <TextField
            fullWidth
            value={form.shortDesc}
            onChange={e => handleChange("shortDesc", e.target.value)}
            multiline rows={3} sx={{ mt: 1 }}
            placeholder="Short summary..."
          />

          {/* Description */}
          <Paper sx={{ bgcolor: "#33CCCC", p: 1, mt: 2 }}>
            <Typography>विवरण (Description)</Typography>
          </Paper>
          <TextField
            fullWidth
            value={form.description}
            onChange={e => handleChange("description", e.target.value)}
            multiline rows={4} sx={{ mt: 1 }}
            placeholder="Detailed description..."
          />

          {/* Assigned To */}
          <Paper sx={{ bgcolor: "#33CCCC", p: 1, mt: 2 }}>
            <Typography>सौंपा गया (नाम) / Assigned To</Typography>
          </Paper>
          <TextField
            fullWidth
            value={form.assignedTo}
            onChange={e => handleChange("assignedTo", e.target.value)}
            sx={{ mt: 1 }}
            placeholder="Employee name / ID"
          />

          {/* Status */}
          <Paper sx={{ bgcolor: "#33CCCC", p: 1, mt: 2 }}>
            <Typography>वर्तमान चरण (Current Status)</Typography>
          </Paper>
          <TextField
            select
            fullWidth
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
            sx={{ mt: 1 }}
          >
            {statusOptions.map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </TextField>

          {/* Reason for hold/cancel */}
          <Paper sx={{ bgcolor: "#33CCCC", p: 1, mt: 2 }}>
            <Typography>रोक का कारण / रद्द करने का कारण (Reason for Hold / Cancel)</Typography>
          </Paper>
          <TextField
            fullWidth
            value={form.reason}
            onChange={e => handleChange("reason", e.target.value)}
            sx={{ mt: 1 }}
          />

          {/* Expected Resolution Date */}
          <Paper sx={{ bgcolor: "#33CCCC", p: 1, mt: 2 }}>
            <Typography>संभावित समाधान तिथि (Expected Resolution Date)</Typography>
          </Paper>
          <TextField
            fullWidth
            type="date"
            value={form.expectedDate}
            onChange={e => handleChange("expectedDate", e.target.value)}
            sx={{ mt: 1 }}
          />

          {/* Resolution Comments */}
          <Paper sx={{ bgcolor: "#33CCCC", p: 1, mt: 2 }}>
            <Typography>समाधान टिप्पणियाँ (Resolution Comments)</Typography>
          </Paper>
          <TextField
            fullWidth
            value={form.resolutionComments}
            onChange={e => handleChange("resolutionComments", e.target.value)}
            multiline rows={3}
            sx={{ mt: 1 }}
          />

          {/* Remarks */}
          <Paper sx={{ bgcolor: "#33CCCC", p: 1, mt: 2 }}>
            <Typography>टिप्पणियाँ (Remarks)</Typography>
          </Paper>
          <TextField
            fullWidth
            value={form.remarks}
            onChange={e => handleChange("remarks", e.target.value)}
            multiline rows={3}
            sx={{ mt: 1 }}
          />
        </Grid>

        {/* RIGHT COLUMN: Pink Resolved Box + Attachments */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ bgcolor: "#F4C7D7", p: 2 }}>
            <Typography variant="subtitle1" fontWeight="600">
              जब घटना हल हो तो भरना अनिवार्य है
              <Typography component="span" sx={{ display: "block", fontWeight: 400, fontSize: 12 }}>
                (When incident is resolved, mandatory to fill)
              </Typography>
            </Typography>
            <Divider sx={{ my: 1 }} />

            <Typography sx={{ mt: 1 }}>Actual Resolved Date</Typography>
            <TextField
              fullWidth
              type="date"
              value={form.actualResolvedDate}
              onChange={e => handleChange("actualResolvedDate", e.target.value)}
              sx={{ mt: 1 }}
            />

            <Typography sx={{ mt: 2 }}>Final Resolution Comments</Typography>
            <TextField
              fullWidth
              value={form.finalResolution}
              onChange={e => handleChange("finalResolution", e.target.value)}
              multiline rows={3}
              sx={{ mt: 1 }}
            />

            <Typography sx={{ mt: 2 }}>Observation</Typography>
            <TextField
              fullWidth
              value={form.observation}
              onChange={e => handleChange("observation", e.target.value)}
              multiline rows={3}
              sx={{ mt: 1 }}
            />
          </Paper>

          {/* Attachments */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography fontWeight="600">Attachments (photos, audio, docs)</Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
              >
                Upload
                <input hidden multiple type="file" onChange={handleFileAdd} />
              </Button>
              <Typography variant="caption" sx={{ color: "#666" }}>
                you can add multiple files
              </Typography>
            </Box>

            <List dense>
              {attachments.length === 0 && (
                <ListItem>
                  <ListItemText primary="No attachments yet" />
                </ListItem>
              )}
              {attachments.map((a, i) => (
                <ListItem key={i}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => removeAttachment(i)}>
                      <ClearIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={a.name} secondary={`${(a.size/1024).toFixed(1)} KB`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Buttons */}
      <Box sx={{ mt: 3, display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button variant="outlined" color="inherit" type="reset" onClick={() => {
          setForm({
            shortDesc: "", description: "", assignedTo: "", status: "", reason: "", expectedDate: "",
            resolutionComments: "", remarks: "", actualResolvedDate: "", finalResolution: "", observation: ""
          });
          setAttachments([]);
        }}>
          Reset
        </Button>
        <Button variant="contained" type="submit">Save Work Order</Button>
      </Box>
    </form>
  );
}
