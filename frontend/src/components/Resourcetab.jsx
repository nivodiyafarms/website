import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import WorkOrderModal from "./WorkOrderModal";

export default function WorkOrderPage({ cropCycleId, workers }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Example resources
  const [labour, setLabour] = useState([{ qty: 3, hours: 3, rate: 40 }]);
  const [material, setMaterial] = useState([{ qty: 6, rate: 32.22 }]);
  const [fuel, setFuel] = useState([{ qty: 6, rate: 90 }]);
  const [assets, setAssets] = useState([
    { name: "फावड़ा", issued: 6, returned: 5 },
    { name: "तसला", issued: 5, returned: 4 },
  ]);

  const total = (qty, rate, hours = 1) => qty * rate * hours;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Work Order Form Modal Trigger */}
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded-lg mb-6 hover:bg-blue-700 transition"
        onClick={() => setIsModalOpen(true)}
      >
        Create Work Order
      </button>

      {/* Work Order Modal */}
      <WorkOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => console.log("Submitted Work Order:", data)}
        cropCycleId={cropCycleId}
        workers={workers}
      />

      {/* Resources Section */}
      <Card className="mt-6">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">Resources (From Task)</h2>

          {/* Labour */}
          <section>
            <h3 className="font-medium mb-2">मजदूर</h3>
            {labour.map((l, i) => (
              <div key={i} className="grid grid-cols-5 gap-2">
                <input type="number" value={l.qty} className="border p-1" readOnly />
                <input type="number" value={l.hours} className="border p-1" readOnly />
                <input type="number" value={l.rate} className="border p-1" readOnly />
                <div className="col-span-2 font-medium">₹ {total(l.qty, l.rate, l.hours)}</div>
              </div>
            ))}
          </section>

          {/* Material */}
          <section>
            <h3 className="font-medium mb-2">सामग्री</h3>
            {material.map((m, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <input type="number" value={m.qty} className="border p-1" readOnly />
                <input type="number" value={m.rate} className="border p-1" readOnly />
                <div className="col-span-2 font-medium">₹ {total(m.qty, m.rate)}</div>
              </div>
            ))}
          </section>

          {/* Fuel */}
          <section>
            <h3 className="font-medium mb-2">ईंधन</h3>
            {fuel.map((f, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <input type="number" value={f.qty} className="border p-1" readOnly />
                <input type="number" value={f.rate} className="border p-1" readOnly />
                <div className="col-span-2 font-medium">₹ {total(f.qty, f.rate)}</div>
              </div>
            ))}
          </section>

          {/* Assets */}
          <section>
            <h3 className="font-medium mb-2">सामान</h3>
            {assets.map((a, i) => (
              <div key={i} className="grid grid-cols-5 gap-2">
                <div>{a.name}</div>
                <div>Issued: {a.issued}</div>
                <div>Returned: {a.returned}</div>
                <div className="col-span-2 text-red-600">Missing: {a.issued - a.returned}</div>
              </div>
            ))}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
