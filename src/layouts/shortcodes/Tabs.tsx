import { useState } from "react";
import React from "react";

const Tabs = ({
  tabs,
}: {
  tabs: { label: string; content: React.ReactNode }[];
}) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="">
      {/* Tab-Leiste */}
      <div className="flex gap-2">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`flex-1 py-2 px-4 text-center border border-gray-200 rounded-lg  ${
              activeTab === index
                ? "border-gray-500 font-bold"
                : "text-gray-400"
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab-Content */}
      <div className="mt-2">{tabs[activeTab].content}</div>
    </div>
  );
};

export default Tabs;
