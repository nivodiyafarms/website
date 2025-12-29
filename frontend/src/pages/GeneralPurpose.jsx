import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import BreadcrumbNav from "../components/BreadcrumbNav";

import api from "../services/api";

import { Edit, Trash2, Plus } from "lucide-react";



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

  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);



  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/general-expenses");
      setExpenses(response.data || []);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      alert("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((p) => ({ ...p, [name]: value }));

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await api.post("/api/general-expenses", {

        ...form,

        quantity: form.quantity ? Number(form.quantity) : null,

        rate: form.rate ? Number(form.rate) : null,

        total_amount: form.total_amount ? Number(form.total_amount) : null,

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

      setShowForm(false);

      loadExpenses();

    } catch (err) {

      console.error("Failed to save expense:", err);

      alert("Failed to save expense: " + (err.response?.data?.detail || err.message));

    }

  };

  const handleDelete = async (expenseId) => {

    if (!window.confirm("Are you sure you want to delete this expense?")) {

      return;

    }

    try {

      await api.delete(`/api/general-expenses/${expenseId}`);

      alert("Expense deleted successfully");

      loadExpenses();

    } catch (err) {

      console.error("Failed to delete expense:", err);

      alert("Failed to delete expense");

    }

  };

  const formatDate = (dateString) => {

    if (!dateString) return "-";

    try {

      return new Date(dateString).toLocaleDateString();

    } catch {

      return dateString;

    }

  };

  const formatCurrency = (amount) => {

    if (!amount) return "₹0";

    return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

        <button

          onClick={() => setShowForm(!showForm)}

          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition"

        >

          <Plus className="w-5 h-5" />

          <span>{showForm ? "Hide Form" : "Add New Expense"}</span>

        </button>

      </div>



      {/* FORM CARD */}

      {showForm && (

        <div className="bg-white rounded-xl shadow p-6 mb-6">

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

      )}



      {/* EXPENSES TABLE */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <div className="p-6 border-b border-gray-200">

          <h2 className="text-xl font-semibold text-gray-900">All Expenses</h2>

          <p className="text-sm text-gray-600 mt-1">Total: {expenses.length} expense(s)</p>

        </div>



        {loading ? (

          <div className="p-12 text-center">

            <p className="text-gray-500">Loading expenses...</p>

          </div>

        ) : expenses.length === 0 ? (

          <div className="p-12 text-center">

            <p className="text-gray-500">No expenses recorded yet. Add your first expense above.</p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>

                </tr>

              </thead>

              <tbody className="bg-white divide-y divide-gray-200">

                {expenses.map((expense) => (

                  <tr key={expense.id} className="hover:bg-gray-50">

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                      {formatDate(expense.date)}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                      {expense.category || "-"}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                      {expense.subcategory || "-"}

                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">

                      {expense.description || "-"}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                      {expense.qty || "-"}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                      {expense.unit || "-"}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                      {expense.unit_rate ? formatCurrency(expense.unit_rate) : "-"}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">

                      {formatCurrency(expense.total_cost)}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">

                      <div className="flex items-center space-x-2">

                        <button

                          onClick={() => handleDelete(expense.id)}

                          className="text-red-600 hover:text-red-900 transition"

                          title="Delete"

                        >

                          <Trash2 className="w-4 h-4" />

                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

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

