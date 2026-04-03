"use client";

import { useState } from "react";

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

interface RewardDisplayProps {
  campaignId: number;
  participantId: number;
  reward: RewardInfo | null;
  goalMet: boolean;
  accentColor?: string;
}

export function RewardDisplay({
  campaignId,
  participantId,
  reward,
  goalMet,
  accentColor = "#3B82F6",
}: RewardDisplayProps) {
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<RewardInfo | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  async function handleClaim() {
    setClaiming(true);
    try {
      const res = await fetch("/api/widget/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, participantId }),
      });
      const data = await res.json();
      if (data.success && data.reward) {
        setClaimed(true);
        setClaimedReward(data.reward);
      }
    } catch {
      // silently fail
    } finally {
      setClaiming(false);
    }
  }

  function copyCoupon(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    });
  }

  if (!goalMet) return null;

  const displayReward = claimedReward || reward;

  return (
    <div
      className="rw-reward"
      style={{
        padding: "16px",
        borderRadius: "8px",
        backgroundColor: "#F0FDF4",
        border: "1px solid #BBF7D0",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>&#127881;</div>
      <h3
        style={{
          margin: "0 0 8px",
          fontSize: "16px",
          fontWeight: 600,
          color: "#166534",
        }}
      >
        {claimed ? "Reward Claimed!" : "You've earned a reward!"}
      </h3>

      {!claimed && !displayReward && (
        <button
          onClick={handleClaim}
          disabled={claiming}
          style={{
            padding: "10px 24px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: accentColor,
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
            cursor: claiming ? "wait" : "pointer",
            opacity: claiming ? 0.7 : 1,
          }}
        >
          {claiming ? "Claiming..." : "Claim Your Reward"}
        </button>
      )}

      {displayReward && (
        <div style={{ marginTop: "12px" }}>
          {/* Coupon code reward */}
          {displayReward.couponCode && (
            <div>
              <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#4B5563" }}>
                Your coupon code:
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: "#ffffff",
                  border: "2px dashed #10B981",
                  borderRadius: "6px",
                  fontSize: "18px",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: "#065F46",
                  letterSpacing: "2px",
                }}
              >
                {displayReward.couponCode}
                <button
                  onClick={() => copyCoupon(displayReward.couponCode!)}
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "4px",
                    backgroundColor: copiedCoupon ? "#10B981" : "#F9FAFB",
                    color: copiedCoupon ? "#ffffff" : "#374151",
                    cursor: "pointer",
                    fontFamily: "sans-serif",
                    fontWeight: 500,
                    letterSpacing: "normal",
                  }}
                >
                  {copiedCoupon ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Redirect URL reward */}
          {displayReward.redirectUrl && (
            <div style={{ marginTop: "8px" }}>
              <a
                href={displayReward.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "10px 24px",
                  borderRadius: "6px",
                  backgroundColor: accentColor,
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Claim Reward
              </a>
            </div>
          )}

          {/* Custom message reward */}
          {displayReward.customMessage && (
            <div
              style={{
                marginTop: "8px",
                padding: "12px",
                backgroundColor: "#ffffff",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#374151",
                lineHeight: 1.5,
              }}
              dangerouslySetInnerHTML={{ __html: displayReward.customMessage }}
            />
          )}

          {/* Cash value display */}
          {displayReward.cashValue && displayReward.cashValue > 0 && (
            <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#166534", fontWeight: 600 }}>
              Value: ${displayReward.cashValue.toFixed(2)}
            </p>
          )}

          {/* Token reward */}
          {displayReward.tokenSymbol && displayReward.tokenAmount && (
            <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#166534", fontWeight: 600 }}>
              {displayReward.tokenAmount} {displayReward.tokenSymbol}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
