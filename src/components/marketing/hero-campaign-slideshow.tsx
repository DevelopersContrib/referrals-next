"use client";

import { useEffect, useState } from "react";

type CampaignMockup = {
  title: string;
  status: string;
  brands: string;
  participants: string;
  revenue: string;
  conversionRate: string;
  message: string;
};

const campaignMockups: CampaignMockup[] = [
  {
    title: "Contrib Launch Giveaway",
    status: "Live",
    brands: "1,204",
    participants: "8,944",
    revenue: "$31.7k",
    conversionRate: "13.6%",
    message: "Invite 3 friends and unlock contributor-only perks.",
  },
  {
    title: "VentureBuilder Referral Campaign",
    status: "Scaling",
    brands: "1,892",
    participants: "12,417",
    revenue: "$52.9k",
    conversionRate: "16.9%",
    message: "Founder network invites now drive our top acquisition channel.",
  },
  {
    title: "ContentAgent Referral Campaign",
    status: "Live",
    brands: "2,481",
    participants: "15,230",
    revenue: "$67.4k",
    conversionRate: "18.1%",
    message: "Share one workflow template, earn premium credits instantly.",
  },
];

export function HeroCampaignSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % campaignMockups.length);
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const activeMockup = campaignMockups[activeIndex];
  const progressWidth = `${Math.max(12, Math.min(95, Math.round(parseFloat(activeMockup.conversionRate) * 5)))}%`;

  return (
    <div className="rounded-3xl border border-rose-100 bg-white/95 p-5 shadow-2xl shadow-rose-100/70 backdrop-blur transition-all duration-700">
      <div className="rounded-2xl border border-rose-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Campaign</p>
            <h3 className="text-lg font-semibold text-gray-900 transition-all duration-700">
              {activeMockup.title}
            </h3>
          </div>
          <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-600">
            {activeMockup.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
            <p className="text-xs text-gray-500">Brands</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{activeMockup.brands}</p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
            <p className="text-xs text-gray-500">Participants</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{activeMockup.participants}</p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{activeMockup.revenue}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/40 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>Referral conversion rate</span>
            <span className="font-semibold text-green-600">{activeMockup.conversionRate}</span>
          </div>
          <div className="h-2 rounded-full bg-rose-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#FF5C62] to-[#926efb] transition-all duration-700"
              style={{ width: progressWidth }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
        <p className="text-xs text-gray-500">Top performing referral message</p>
        <p className="mt-2 text-sm text-gray-700 transition-all duration-700">
          "{activeMockup.message}"
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {campaignMockups.map((mockup, idx) => (
          <span
            key={mockup.title}
            className={`h-2 rounded-full transition-all duration-500 ${
              idx === activeIndex ? "w-8 bg-[#FF5C62]" : "w-2 bg-rose-200"
            }`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

