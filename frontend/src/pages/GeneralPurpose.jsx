import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import BreadcrumbNav from "../components/BreadcrumbNav";

import api from "../services/api";



export default function GeneralPurpose() {

  const navigate = useNavigate();

  const [form, setForm] = useState({

    expense_code: "",

    resource_type: "",

    resource_code: "",

    quantity: "",

    unit: "",

    rate: "",

    total_amount: "",

    expense_date: "",

    vendor_name: "",

    invoice_no: "",

    notes: "",

  });



  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((p) => ({ ...p, [name]: value }));

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await api.post("/general-expenses", {

        ...form,

        quantity: Number(form.quantity),

        rate: Number(form.rate),

        total_amount: Number(form.total_amount),

      });

      alert("Expense saved successfully");

      setForm({

        expense_code: "",

        resource_type: "",

        resource_code: "",

        quantity: "",

        unit: "",

        rate: "",

        total_amount: "",

        expense_date: "",

        vendor_name: "",

        invoice_no: "",

        notes: "",

      });

    } catch (err) {

      alert("Failed to save expense");

    }

  };



  return (

    <div className="p-6">

      {/* Breadcrumb */}

      <BreadcrumbNav

        path={[

          { name: "Dashboard", id: "/dashboard" },

          { name: "General Expenses", id: null },

        ]}

        onNavigate={(path) => path && navigate(path)}

      />



      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">

            General Expense Entry

          </h1>

          <p className="text-gray-600">

            Record and manage all non-crop operational expenses

          </p>

        </div>

      </div>



      {/* FORM CARD */}

      <div className="bg-white rounded-xl shadow p-6">

        <form

          onSubmit={handleSubmit}

          className="grid grid-cols-1 md:grid-cols-2 gap-6"

        >

          <Input label="Expense Code" name="expense_code" value={form.expense_code} onChange={handleChange} />

          <Select label="Resource Type" name="resource_type" value={form.resource_type} onChange={handleChange}

            options={["FUEL", "MATERIAL", "MACHINE", "SERVICE"]}

          />

          <Input label="Resource Code" name="resource_code" value={form.resource_code} onChange={handleChange} />

          <Input label="Quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} />

          <Input label="Unit" name="unit" value={form.unit} onChange={handleChange} />

          <Input label="Rate" name="rate" type="number" value={form.rate} onChange={handleChange} />

          <Input label="Total Amount" name="total_amount" type="number" value={form.total_amount} onChange={handleChange} />

          <Input label="Expense Date" name="expense_date" type="date" value={form.expense_date} onChange={handleChange} />

          <Input label="Vendor Name" name="vendor_name" value={form.vendor_name} onChange={handleChange} />

          <Input label="Invoice No" name="invoice_no" value={form.invoice_no} onChange={handleChange} />



          <div className="md:col-span-2">

            <label className="text-sm font-medium">Notes</label>

            <textarea

              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"

              rows={3}

              name="notes"

              value={form.notes}

              onChange={handleChange}

            />

          </div>



          <div className="md:col-span-2 flex justify-end">

            <button

              type="submit"

              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium"

            >

              Save Expense

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}



/* ------------------ Small Reusable Inputs ------------------ */



const Input = ({ label, ...props }) => (

  <div>

    <label className="text-sm font-medium">{label}</label>

    <input

      {...props}

      className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"

    />

  </div>

);



const Select = ({ label, options, ...props }) => (

  <div>

    <label className="text-sm font-medium">{label}</label>

    <select

      {...props}

      className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"

    >

      <option value="">Select</option>

      {options.map((opt) => (

        <option key={opt} value={opt}>

          {opt}

        </option>

      ))}

    </select>

  </div>

);

