import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fieldAPI, cropCycleAPI } from "../services/api";

// Facility / infrastructure field IDs (frontend-only; brown marker)
const facilityIds = ["NID013", "NID014", "NID015", "HQ0001"];

function createMarkerIcon(color) {
  return L.divIcon({
    className: "custom-marker",
    html: `<span style="background-color:${color};width:20px;height:20px;border-radius:50%;display:inline-block;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const GREEN_ICON = createMarkerIcon("#22c55e");   // field with crop cycle
const AMBER_ICON = createMarkerIcon("#f59e0b");  // field, no crop cycle
const BROWN_ICON = createMarkerIcon("#92400e");  // facility

function MapZoomTracker({ setZoom }) {
  useMapEvents({
    zoomend: (e) => {
      setZoom(e.target.getZoom());
    },
  });
  return null;
}

export default function FarmMap() {
  const [fields, setFields] = useState([]);
  const [cropCycles, setCropCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(16);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [fieldsRes, cropRes] = await Promise.all([
        fieldAPI.getAll(),
        cropCycleAPI.getAllCycles(),
      ]);
      setFields(fieldsRes.data || []);
      setCropCycles(cropRes.data || []);
    } catch (err) {
      console.error("Farm Map data load error", err);
      setError(err.response?.data?.detail || "Failed to load map data");
    } finally {
      setLoading(false);
    }
  }

  function getFieldCycles(field) {
    const fieldId = field.field_id || field.field_code;
    if (!fieldId) return [];
    return cropCycles.filter(
      (c) => (c.field_code || c.field_id) === fieldId
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[23.21, 78.24]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution="Satellite"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <MapZoomTracker setZoom={setZoom} />

        {fields.map((field) => {
          const cycles = getFieldCycles(field);
          const activeCycles = cycles.filter(
            (c) => c.status === "open" || c.status === "reopened"
          );

          if (!field.gps_centroid_lat || !field.gps_centroid_lng) {
            return null;
          }

          const lat = Number(field.gps_centroid_lat);
          const lng = Number(field.gps_centroid_lng);
          const fieldId = field.field_id || field.field_code;
          const fieldName = field.name || fieldId;
          const isFacility = facilityIds.includes(fieldId);

          // CASE 1: Facility → single brown marker
          if (isFacility) {
            return (
              <Marker key={fieldId} position={[lat, lng]} icon={BROWN_ICON}>
                {zoom >= 17 && (
                  <Tooltip permanent direction="top" offset={[0, -10]} className="farm-label">
                    {fieldName} ({fieldId})
                  </Tooltip>
                )}
                <Popup>
                  <b>{fieldName}</b>
                  <br />
                  Field ID: {fieldId}
                  <br />
                  Type: Farm Facility
                </Popup>
              </Marker>
            );
          }

          // CASE 2: No active crop cycle → amber marker
          if (activeCycles.length === 0) {
            return (
              <Marker key={fieldId} position={[lat, lng]} icon={AMBER_ICON}>
                {zoom >= 17 && (
                  <Tooltip permanent direction="top" offset={[0, -10]} className="farm-label">
                    {fieldName} ({fieldId})
                  </Tooltip>
                )}
                <Popup>
                  <b>{fieldName}</b>
                  <br />
                  Field ID: {fieldId}
                  <br />
                  Area: {field.area_acre != null ? field.area_acre : "—"} Acre
                  <br />
                  No active crop cycle
                  <br />
                  वर्तमान चरण: —
                </Popup>
              </Marker>
            );
          }

          // CASE 3: Active crop cycles exist → green marker(s) spread horizontally
          const total = activeCycles.length;
          const spacing = 0.00006;
          return activeCycles.map((cycle, index) => {
            const offsetIndex = index - (total - 1) / 2;
            const offsetLat = lat;
            const offsetLng =
              lng + (offsetIndex * spacing) / Math.cos((lat * Math.PI) / 180);
            const area = cycle.cultivated_area != null ? cycle.cultivated_area : cycle.area;
            const stage = cycle.current_stage != null ? String(cycle.current_stage) : "—";

            return (
              <Marker
                key={`${fieldId}_${cycle.id || cycle.crop_cycle_id}_${index}`}
                position={[offsetLat, offsetLng]}
                icon={GREEN_ICON}
              >
                {zoom >= 17 && (
                  <Tooltip permanent direction="top" offset={[0, -10]} className="farm-label">
                    {fieldName} ({fieldId})
                  </Tooltip>
                )}
                <Popup>
                  <b>{fieldName}</b>
                  <br />
                  Field ID: {fieldId}
                  <br />
                  Crop: {cycle.crop_name || "—"}
                  <br />
                  Beej Category: {cycle.seed_category || cycle.beej_category || "N/A"}
                  <br />
                  Area: {area != null ? area : "—"} Acre
                  <br />
                  वर्तमान चरण: {stage}
                </Popup>
              </Marker>
            );
          });
        })}
      </MapContainer>
    </div>
  );
}
