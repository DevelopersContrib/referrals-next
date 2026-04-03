"use client";

import { useState, useEffect } from "react";

interface MailchimpList {
  id: string;
  name: string;
  member_count: number;
}

export default function MailchimpIntegrationPage() {
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [lists, setLists] = useState<MailchimpList[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const resp = await fetch("/api/integrations/mailchimp");
      if (resp.ok) {
        const data = await resp.json();
        setConnected(data.connected);
        setLists(data.lists || []);
      }
    } catch {
      // Not connected
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const resp = await fetch("/api/integrations/mailchimp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });

      const data = await resp.json();

      if (resp.ok) {
        setConnected(true);
        setLists(data.lists || []);
        setMessage({ type: "success", text: "MailChimp connected successfully!" });
        setApiKey("");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to connect" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900">MailChimp Integration</h1>
      <p className="mt-2 text-gray-600">
        Connect your MailChimp account to sync referral participants with your
        email lists.
      </p>

      {/* Status Badge */}
      <div className="mt-6 flex items-center gap-2">
        <span
          className={`inline-block w-3 h-3 rounded-full ${
            connected ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        <span className="text-sm font-medium text-gray-700">
          {connected ? "Connected" : "Not Connected"}
        </span>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Connect Form */}
      <form onSubmit={handleConnect} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="mailchimp-api-key"
            className="block text-sm font-medium text-gray-700"
          >
            MailChimp API Key
          </label>
          <input
            id="mailchimp-api-key"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Find your API key in MailChimp under Account &gt; Extras &gt; API keys
          </p>
        </div>
        <button
          type="submit"
          disabled={!apiKey || saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Connecting..." : connected ? "Update API Key" : "Connect MailChimp"}
        </button>
      </form>

      {/* Lists */}
      {connected && lists.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Your Audiences</h2>
          <div className="mt-3 space-y-2">
            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between p-3 bg-white border rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{list.name}</p>
                  <p className="text-xs text-gray-500">ID: {list.id}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {list.member_count.toLocaleString()} subscribers
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-10 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900">How It Works</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>1. Enter your MailChimp API key above</li>
          <li>2. Select which audience list to sync in your campaign settings</li>
          <li>
            3. New referral participants are automatically added to your
            MailChimp audience
          </li>
        </ul>
      </div>
    </div>
  );
}
