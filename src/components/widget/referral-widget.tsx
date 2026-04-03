"use client";

import { useState, useEffect, useCallback } from "react";
import { ShareButtons } from "./share-buttons";
import { RewardDisplay } from "./reward-display";

interface WidgetConfig {
  campaignId: number;
  color?: string;
  headerTitle?: string;
  description?: string;
  buttonText?: string;
  buttonColor?: string;
  bannerImageUrl?: string;
  fieldLabel1?: string;
  fieldLabel2?: string;
  textColor?: string;
  backgroundColor?: string;
  backgroundType?: string;
  backgroundImage?: string;
  headerFontColor?: string;
  headerDescriptionColor?: string;
  successMessage?: string;
  bodyText?: string;
  allowedSocials?: number[];
  goalType?: string;
  goalNum?: number;
  shareText?: string;
  shareTitle?: string;
}

interface Participant {
  id: number;
  email: string;
  name: string;
  shareUrl: string;
  referralCount: number;
  clickCount: number;
  goalMet: boolean;
}

interface LeaderboardEntry {
  name: string;
  referrals: number;
}

interface RewardInfo {
  rewardType: number;
  couponCode?: string;
  redirectUrl?: string;
  customMessage?: string;
  cashValue?: number;
  worthValue?: number;
  tokenSymbol?: string;
  tokenAmount?: number;
}

interface ReferralWidgetProps {
  config: WidgetConfig;
  reward?: RewardInfo | null;
  leaderboard?: LeaderboardEntry[];
  isEmbed?: boolean;
}

export function ReferralWidget({
  config,
  reward = null,
  leaderboard = [],
  isEmbed = false,
}: ReferralWidgetProps) {
  const [step, setStep] = useState<"signup" | "share">("signup");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const accentColor = config.color ? `#${config.color.replace("#", "")}` : "#3B82F6";
  const btnColor = config.buttonColor ? `#${config.buttonColor.replace("#", "")}` : accentColor;
  const textColor = config.textColor ? `#${config.textColor.replace("#", "")}` : "#1F2937";
  const headerColor = config.headerFontColor ? `#${config.headerFontColor.replace("#", "")}` : textColor;
  const descColor = config.headerDescriptionColor ? `#${config.headerDescriptionColor.replace("#", "")}` : "#6B7280";

  // Track impression on mount
  useEffect(() => {
    fetch("/api/widget/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: config.campaignId }),
    }).catch(() => {});
  }, [config.campaignId]);

  // Check for returning participant in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`rw_participant_${config.campaignId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setParticipant(data);
        setStep("share");
      }
    } catch {
      // localStorage not available
    }
  }, [config.campaignId]);

  const saveParticipant = useCallback((p: Participant) => {
    try {
      localStorage.setItem(`rw_participant_${config.campaignId}`, JSON.stringify(p));
    } catch {
      // localStorage not available
    }
  }, [config.campaignId]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Check for referrer from URL
      const urlParams = new URLSearchParams(window.location.search);
      const referrerId = urlParams.get("ref") || urlParams.get("referrer");

      const res = await fetch("/api/widget/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: config.campaignId,
          email: email.trim(),
          name: name.trim() || email.split("@")[0],
          referrerId: referrerId ? parseInt(referrerId, 10) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      const p: Participant = {
        id: data.participantId,
        email: email.trim(),
        name: name.trim() || email.split("@")[0],
        shareUrl: data.shareUrl,
        referralCount: data.referralCount || 0,
        clickCount: data.clickCount || 0,
        goalMet: data.goalMet || false,
      };
      setParticipant(p);
      saveParticipant(p);
      setStep("share");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!participant?.shareUrl) return;
    navigator.clipboard.writeText(participant.shareUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  // Background style
  const bgStyle: React.CSSProperties = {};
  if (config.backgroundType === "color" && config.backgroundColor) {
    bgStyle.backgroundColor = `#${config.backgroundColor.replace("#", "")}`;
  } else if (config.backgroundImage) {
    bgStyle.backgroundImage = `url(${config.backgroundImage})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else {
    bgStyle.backgroundColor = "#ffffff";
  }

  return (
    <div
      className="rw-container"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: isEmbed ? "100%" : "480px",
        margin: isEmbed ? "0" : "0 auto",
        borderRadius: isEmbed ? "0" : "12px",
        overflow: "hidden",
        boxShadow: isEmbed ? "none" : "0 4px 24px rgba(0,0,0,0.12)",
        ...bgStyle,
      }}
    >
      {/* Banner image */}
      {config.bannerImageUrl && (
        <div
          style={{
            width: "100%",
            height: "160px",
            backgroundImage: `url(${config.bannerImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <div style={{ padding: "24px" }}>
        {/* Header */}
        {config.headerTitle && (
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "22px",
              fontWeight: 700,
              color: headerColor,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {config.headerTitle}
          </h2>
        )}
        {config.description && (
          <p
            style={{
              margin: "0 0 16px",
              fontSize: "14px",
              color: descColor,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {config.description}
          </p>
        )}

        {/* Body text */}
        {config.bodyText && step === "signup" && (
          <div
            style={{
              margin: "0 0 16px",
              fontSize: "14px",
              color: textColor,
              lineHeight: 1.6,
            }}
            dangerouslySetInnerHTML={{ __html: config.bodyText }}
          />
        )}

        {/* Success message after signup */}
        {step === "share" && config.successMessage && (
          <div
            style={{
              margin: "0 0 16px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#F0FDF4",
              border: "1px solid #BBF7D0",
              fontSize: "14px",
              color: "#166534",
              textAlign: "center",
              lineHeight: 1.5,
            }}
            dangerouslySetInnerHTML={{ __html: config.successMessage }}
          />
        )}

        {/* Step 1: Signup form */}
        {step === "signup" && (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label
                htmlFor="rw-name"
                style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 500, color: textColor }}
              >
                {config.fieldLabel2 || "Name"}
              </label>
              <input
                id="rw-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #D1D5DB",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="rw-email"
                style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 500, color: textColor }}
              >
                {config.fieldLabel1 || "Email"}
              </label>
              <input
                id="rw-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #D1D5DB",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <p style={{ margin: 0, fontSize: "13px", color: "#DC2626" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: btnColor,
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {loading ? "Joining..." : config.buttonText || "Join Now"}
            </button>
          </form>
        )}

        {/* Step 2: Share */}
        {step === "share" && participant && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Referral link display */}
            <div>
              <label
                style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 500, color: textColor }}
              >
                Your referral link
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "stretch",
                }}
              >
                <input
                  type="text"
                  readOnly
                  value={participant.shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #D1D5DB",
                    fontSize: "13px",
                    backgroundColor: "#F9FAFB",
                    outline: "none",
                    minWidth: 0,
                  }}
                />
                <button
                  onClick={copyLink}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "1px solid #D1D5DB",
                    backgroundColor: linkCopied ? "#10B981" : "#ffffff",
                    color: linkCopied ? "#ffffff" : "#374151",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  {linkCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Share buttons */}
            <div>
              <label
                style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 500, color: textColor, textAlign: "center" }}
              >
                Share with friends
              </label>
              <ShareButtons
                campaignId={config.campaignId}
                participantId={participant.id}
                shareUrl={participant.shareUrl}
                shareText={config.shareText}
                shareTitle={config.shareTitle}
                accentColor={accentColor}
                allowedSocials={config.allowedSocials}
              />
            </div>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "24px",
                padding: "12px 0",
                borderTop: "1px solid #E5E7EB",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: accentColor }}>
                  {participant.referralCount}
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>Referrals</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: accentColor }}>
                  {participant.clickCount}
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>Clicks</div>
              </div>
            </div>

            {/* Reward */}
            <RewardDisplay
              campaignId={config.campaignId}
              participantId={participant.id}
              reward={reward}
              goalMet={participant.goalMet}
              accentColor={accentColor}
            />
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: "14px",
                fontWeight: 600,
                color: textColor,
                textAlign: "center",
              }}
            >
              Top Referrers
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {leaderboard.slice(0, 10).map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    backgroundColor: idx === 0 ? "#FEF3C7" : idx % 2 === 0 ? "#F9FAFB" : "transparent",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: textColor }}>
                    <strong style={{ marginRight: "8px", color: "#9CA3AF" }}>#{idx + 1}</strong>
                    {entry.name}
                  </span>
                  <span style={{ fontWeight: 600, color: accentColor }}>
                    {entry.referrals} referral{entry.referrals !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Powered by */}
        <div
          style={{
            marginTop: "16px",
            textAlign: "center",
            fontSize: "11px",
            color: "#9CA3AF",
          }}
        >
          Powered by{" "}
          <a
            href="https://referrals.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#9CA3AF", textDecoration: "underline" }}
          >
            Referrals.com
          </a>
        </div>
      </div>
    </div>
  );
}
