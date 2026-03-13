import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BreadcrumbNav from "../components/BreadcrumbNav";
import api from "../services/api";
import NotesInterface from "../components/NotesInterface";

const unitMap = {
  labor: "दिन",
  fuel: "लीटर",
  material: "किलो",
  machine: "घंटा",
  water: "घंटा",
  service: "दिन",
  contract: "एकमुश्त",
  construction: "दिन",
};

const subcategoryMap = {
  fuel: [
    "डीजल",
    "पेट्रोल",
    "जनरेटर ईंधन",
    "पंप ईंधन"
  ],
  labor: [
    "स्थायी मजदूर",
    "दैनिक मजदूर",
    "कटाई मजदूरी",
    "बुवाई मजदूरी",
    "निराई / गुड़ाई मजदूरी",
    "सिंचाई मजदूरी",
    "लोडिंग / अनलोडिंग"
  ],
  material: [
    "बीज",
    "खाद",
    "कीटनाशक",
    "जैविक खाद",
    "सूक्ष्म पोषक तत्व",
    "मल्चिंग शीट",
    "पौध संरक्षण दवा"
  ],
  machine: [
    "Tractor – Deutz Fahr 55E",
    "Tractor – John Deere 5105",
    "Tractor – Sonalika DI 734",
    "Trolley – Big Size",
    "Trolley – Medium Size",
    "Thresher – Big Size",
    "Thresher – Medium Size",
    "Ridge Furrow Seed Drill",
    "Normal Seed Drill",
    "Maize Seed Drill",
    "पंजा",
    "सत्ता",
    "Grading Machine",
    "दुनाई वाला पंखा",
    "Alternator (अल्टीनेटर)",
    "Sprayer Tanker",
    "अन्य मशीन / उपकरण"
  ],
  water: [
    "सिंचाई पाइप",
    "बोरवेल मरम्मत",
    "मोटर / पंप मरम्मत",
    "बिजली खर्च (पंप)",
    "ड्रिप सिंचाई",
    "स्प्रिंकलर सिस्टम",
    "पानी टंकी",
    "सिंचाई पाइपलाइन"
  ],
  service: [
    "मशीन मरम्मत",
    "मोटर मरम्मत",
    "वाहन सर्विस",
    "इलेक्ट्रिकल सर्विस",
    "मशीन मेंटेनेंस"
  ],
  contract: [
    "परिवहन",
    "कटाई",
    "सिंचाई",
    "जुताई",
    "रोपाई",
    "फसल ढुलाई"
  ],
  construction: [
    "सीमेंट",
    "रेत",
    "गिट्टी",
    "ईंट",
    "स्टील / सरिया",
    "बजरी",
    "प्लास्टर सामग्री",
    "पानी टंकी",
    "पाइप फिटिंग",
    "इलेक्ट्रिकल वायर",
    "स्विच / बोर्ड",
    "टिन शेड",
    "दरवाजा",
    "खिड़की",
    "पेंट",
    "वॉटरप्रूफिंग",
    "कंक्रीट मिक्स",
    "टाइल्स",
    "पाइप लाइन",
    "अन्य निर्माण सामग्री"
  ]
};

const initialForm = {
  general_expense_id: null,
  category: "",
  subcategory: "",
  description: "",
  date: "",
  qty: "",
  unit: "",
  unit_rate: "",
  total_cost: "",
};

export default function GeneralPurpose() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseNotes, setShowExpenseNotes] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    if (form.qty && form.unit_rate) {
      setForm((prev) => ({
        ...prev,
        total_cost: String(Number(prev.qty) * Number(prev.unit_rate)),
      }));
    }
  }, [form.qty, form.unit_rate]);

  const loadExpenses = async () => {
    try {
      const response = await api.get("/general-expenses");
      setExpenses(response.data || []);
    } catch (err) {
      console.error("Failed to load expenses", err);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await api.delete(`/general-expenses/${id}`);
      await loadExpenses();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete expense");
    }
  };

  const handleEditExpense = (expense) => {
    setForm({
      general_expense_id: expense.general_expense_id,
      category: expense.category ?? "",
      subcategory: expense.subcategory ?? "",
      description: expense.description ?? "",
      date: expense.date ?? "",
      qty: expense.qty != null ? String(expense.qty) : "",
      unit: expense.unit ?? "",
      unit_rate: expense.unit_rate != null ? String(expense.unit_rate) : "",
      total_cost: expense.total_cost != null ? String(expense.total_cost) : "",
    });
    setShowExpenseModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subcategory || !form.subcategory.trim()) {
      alert("कृपया उप-श्रेणी चुनें");
      return;
    }
    if (
      !form.category ||
      !form.qty ||
      !form.unit ||
      !form.unit_rate
    ) {
      alert("कृपया सभी आवश्यक फ़ील्ड भरें");
      return;
    }
    try {
      const payload = {
        category: form.category,
        subcategory: form.subcategory.trim(),
        description: form.description,
        date: form.date || null,
        qty: Number(form.qty),
        unit: form.unit,
        unit_rate: Number(form.unit_rate),
        total_cost: Number(form.total_cost),
      };
      if (form.general_expense_id) {
        await api.put(`/general-expenses/${form.general_expense_id}`, payload);
      } else {
        await api.post("/general-expenses", payload);
      }
      alert("Expense saved successfully");
      await loadExpenses();
      setShowExpenseModal(false);
      setForm(initialForm);
    } catch (err) {
      alert("Failed to save expense");
    }
  };

  return (
    <div className="p-6">
      <BreadcrumbNav
        path={[
          { name: "Dashboard", id: "/dashboard" },
          { name: "General Expenses", id: null },
        ]}
        onNavigate={(path) => path && navigate(path)}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          General Expenses
        </h1>
        <button
          type="button"
          onClick={() => {
            setForm(initialForm);
            setShowExpenseModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Expense
        </button>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-4">Saved Expenses</h2>
        <table className="w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50 text-sm">
            <tr>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Subcategory</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="border-t">
                <td className="p-2">{exp.category}</td>
                <td className="p-2">{exp.subcategory ?? ""}</td>
                <td className="p-2">₹ {exp.total_cost != null ? Number(exp.total_cost).toLocaleString() : "0"}</td>
                <td className="p-2">{exp.date ?? ""}</td>
                <td className="p-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEditExpense(exp)}
                    className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 rounded"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(exp.general_expense_id)}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExpense(exp);
                      setShowExpenseNotes((prev) => !prev);
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    💬 Notes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showExpenseNotes && selectedExpense?.general_expense_id && (
        <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                Notes for: {selectedExpense.category}
                {selectedExpense.subcategory ? ` — ${selectedExpense.subcategory}` : ""}
              </h3>
              <p className="text-sm text-gray-600">
                ₹ {selectedExpense.total_cost != null
                  ? Number(selectedExpense.total_cost).toLocaleString()
                  : "0"}
                {selectedExpense.date ? ` • ${selectedExpense.date}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowExpenseNotes(false);
                setSelectedExpense(null);
              }}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Close
            </button>
          </div>
          <NotesInterface
            relatedType="expense"
            relatedId={selectedExpense.general_expense_id}
          />
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              {form.general_expense_id ? "Edit Expense" : "New Expense"}
            </h2>

            <form
              id="expense-form"
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="text-sm font-medium block mb-1">श्रेणी</label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setForm({
                      ...form,
                      category: selected,
                      unit: unitMap[selected] || "",
                      subcategory: "",
                    });
                  }}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">चुनें</option>
                  <option value="labor">मज़दूर</option>
                  <option value="material">सामग्री</option>
                  <option value="fuel">ईंधन</option>
                  <option value="machine">मशीन</option>
                  <option value="service">सेवा</option>
                  <option value="water">पानी</option>
                  <option value="contract">ठेका</option>
                  <option value="construction">निर्माण</option>
                  <option value="other">अन्य</option>
                </select>
              </div>

              {subcategoryMap[form.category] && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">उप-श्रेणी</label>
                  <select
                    value={form.subcategory}
                    onChange={(e) =>
                      setForm({ ...form, subcategory: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">चुनें</option>
                    {subcategoryMap[form.category].map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.category === "other" && (
                <div>
                  <label className="text-sm font-medium block mb-1">उप-श्रेणी</label>
                  <input
                    type="text"
                    value={form.subcategory}
                    onChange={(e) =>
                      setForm({ ...form, subcategory: e.target.value })
                    }
                    placeholder="विवरण दर्ज करें"
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1">विवरण</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="विवरण (वैकल्पिक)"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">तारीख</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">मात्रा</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">इकाई</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="दिन, किलो, लीटर..."
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">दर (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.unit_rate}
                  onChange={(e) =>
                    setForm({ ...form, unit_rate: e.target.value })
                  }
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">कुल लागत (₹)</label>
                <input
                  type="text"
                  value={form.total_cost}
                  readOnly
                  className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
                  placeholder="स्वचालित"
                />
              </div>
            </form>

            <div className="flex justify-end mt-4 gap-2">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="expense-form"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
