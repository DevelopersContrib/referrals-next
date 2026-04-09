"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FacebookPage {
  id: string;
  name: string;
  connected: boolean;
}

export default function FacebookToolPage() {
  const [connected, setConnected] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/integrations/facebook/status");
        if (res.ok) {
          const data = await res.json();
          setConnected(data.connected);
          setPages(data.pages || []);
        }
      } catch {
        // Not connected
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  function handleConnect() {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";
    const redirectUri = `${window.location.origin}/api/integrations/facebook/callback`;
    const scope = "pages_show_list,pages_read_engagement";
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    window.location.href = authUrl;
  }

  function handleDisconnect() {
    fetch("/api/integrations/facebook/disconnect", { method: "POST" }).then(
      () => {
        setConnected(false);
        setPages([]);
      }
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Facebook Integration</h1>
        <p className="mt-1 text-muted-foreground">
          Connect your Facebook pages to share referral campaigns and track
          engagement.
        </p>
      </div>

      {/* Connection Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Connection Status
            {!loading && (
              <Badge variant={connected ? "default" : "secondary"}>
                {connected ? "Connected" : "Not Connected"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {connected
              ? "Your Facebook account is connected. You can manage your pages below."
              : "Connect your Facebook account to get started with social sharing features."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Checking connection status...</p>
          ) : connected ? (
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect Facebook
            </Button>
          ) : (
            <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
              <svg
                className="mr-2 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Connect with Facebook
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Connected Pages */}
      {connected && pages.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Connected Pages ({pages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 3h18v18H3V3zm16.525 13.707c-.131-.821-.666-1.511-2.252-2.155-.554-.262-.867-.482-.958-.715-.046-.119-.061-.355.033-.473.127-.206.484-.24.812-.174.267.055.52.199.716.397l.794-.737a2.53 2.53 0 00-.948-.593v-.793h-.794v.662c-.843.195-1.4.799-1.465 1.383-.093.832.365 1.357 1.43 1.716.549.2.876.468.932.713.065.367-.256.684-.672.684a1.23 1.23 0 01-.853-.382l-.718.849a2.34 2.34 0 001.075.567v.72h.793v-.7c.875-.207 1.459-.798 1.569-1.475z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Page ID: {page.id}
                      </p>
                    </div>
                  </div>
                  <Badge variant={page.connected ? "default" : "secondary"}>
                    {page.connected ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {connected && pages.length === 0 && (
        <Card className="mt-6">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No Facebook pages found. Make sure you have admin access to at
              least one Facebook page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
