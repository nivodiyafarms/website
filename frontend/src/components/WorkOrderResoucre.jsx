import React, { useState } from "react";

export default function WorkOrderResource() {
  const [resources, setResources] = useState({
    workOrderResourceId: "",
    labour: { quantity: "", hours: "", rate: "", total: "" },
    material: { quantity: "", rate: "", total: "" },
    fuel: { quantity: "", rate: "", total: "" },
    items: [
      { name: "फावड़ा", issued: "", returned: "", remark: "" },
      { name: "तसला", issued: "", returned: "", remark: "" }
    ],
    comments: "",
    attachments: []
  });

  const handleChange = (section, field, value, index = null) => {
    if (section === "items") {
      const updated = [...resources.items];
      updated[index][field] = value;
      setResources({ ...resources, items: updated });
    } else {
      setResources({
        ...resources,
        [section]: { ...resources[section], [field]: value }
      });
    }
  };

  const handleFileUpload = (e) => {
    setResources({ ...resources, attachments: [...e.target.files] });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px" }}>
      <h2>Work Order – Resources</h2>

      {/* WORK ORDER RESOURCE ID */}
      <div style={{ marginBottom: "15px" }}>
        <label><b>Work Order Resource ID</b></label>
        <input
          type="text"
          placeholder="Enter Work Order Resource ID"
          value={resources.workOrderResourceId}
          onChange={(e) =>
            setResources({ ...resources, workOrderResourceId: e.target.value })
          }
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>

      {/* LABOUR */}
      <h4>Labour</h4>
      <div className="row">
        <input placeholder="Quantity" onChange={e => handleChange("labour", "quantity", e.target.value)} />
        <input placeholder="Total Hours" onChange={e => handleChange("labour", "hours", e.target.value)} />
        <input placeholder="Rate / Hour" onChange={e => handleChange("labour", "rate", e.target.value)} />
        <input placeholder="Total Amount" onChange={e => handleChange("labour", "total", e.target.value)} />
      </div>

      {/* MATERIAL */}
      <h4>Material</h4>
      <div className="row">
        <input placeholder="Quantity (kg)" onChange={e => handleChange("material", "quantity", e.target.value)} />
        <input placeholder="Rate / kg" onChange={e => handleChange("material", "rate", e.target.value)} />
        <input placeholder="Total Amount" onChange={e => handleChange("material", "total", e.target.value)} />
      </div>

      {/* FUEL */}
      <h4>Fuel</h4>
      <div className="row">
        <input placeholder="Quantity (Ltr)" onChange={e => handleChange("fuel", "quantity", e.target.value)} />
        <input placeholder="Rate / Ltr" onChange={e => handleChange("fuel", "rate", e.target.value)} />
        <input placeholder="Total Amount" onChange={e => handleChange("fuel", "total", e.target.value)} />
      </div>

      {/* ITEMS */}
      <h4>Items</h4>
      {resources.items.map((item, index) => (
        <div key={index} className="row">
          <input value={item.name} disabled />
          <input placeholder="Issued" onChange={e => handleChange("items", "issued", e.target.value, index)} />
          <input placeholder="Returned" onChange={e => handleChange("items", "returned", e.target.value, index)} />
          <input placeholder="Remarks" onChange={e => handleChange("items", "remark", e.target.value, index)} />
        </div>
      ))}

      {/* COMMENTS */}
      <h4>Comments</h4>
      <textarea
        rows="3"
        placeholder="Write comments related to employee / work..."
        onChange={e => setResources({ ...resources, comments: e.target.value })}
      />

      {/* ATTACHMENTS */}
      <h4>Attachments (Photos / Audio / Docs)</h4>
      <input type="file" multiple onChange={handleFileUpload} />

      <br /><br />
      <button style={{ padding: "10px 20px" }}>Save Work Order</button>
    </div>
  );
}
