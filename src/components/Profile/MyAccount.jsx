import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Card from "../common/Card/Card";
import { getProfile } from "../../services/authService";
import "./Profile.css";
import "./MyAccount.css";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  return initials || "?";
}

function formatJoinDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyAccount() {
  const sessionUser = useSelector((state) => state.auth.user);

  // check-auth's payload only carries name/email/id (see authSlice.js) —
  // authService.getProfile() hits GET /profile, which per its own comment
  // returns "full user object minus password". Nothing was calling it
  // before this. Fetch it once here for anything beyond what the session
  // already has (phone, PAN, join date, ...) without touching Redux —
  // this page is the only consumer right now, doesn't need to be global
  // state. Falls back to sessionUser on failure, so this can never show
  // LESS than the old version did, even if /profile isn't ready yet.
  const [profile, setProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState("loading"); // "loading" | "ok" | "failed"
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (cancelled) return;
        // Response shape isn't nailed down elsewhere in this file set —
        // handle both `{ user: {...} }` (matches signup/login's shape)
        // and a bare user object.
        setProfile(data?.user ?? data);
        setProfileStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setProfileStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const user = profile ?? sessionUser;
  const isLoading = profileStatus === "loading" && !sessionUser;
  const joinDate = formatJoinDate(user?.createdAt);

  const handleCopyId = () => {
    if (!user?.id || !navigator.clipboard) return;
    navigator.clipboard.writeText(user.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="profile-page">
      <h2 className="profile-page__title">My Account</h2>
      <p className="profile-page__subtitle">Your personal and account details at a glance.</p>

      <Card raised padded={false} className="my-account__header">
        {isLoading ? (
          <div className="my-account__header-skeleton">
            <span className="my-account__avatar-skeleton" />
            <div className="my-account__text-skeleton-group">
              <span className="my-account__text-skeleton" style={{ width: "40%" }} />
              <span className="my-account__text-skeleton" style={{ width: "60%" }} />
            </div>
          </div>
        ) : (
          <>
            <div className="my-account__avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </div>
            <div className="my-account__identity">
              <div className="my-account__name-row">
                <h3>{user?.name ?? "—"}</h3>
                <span className="profile-badge">Paper Trading</span>
              </div>
              <p className="my-account__email">{user?.email ?? "—"}</p>
            </div>
          </>
        )}
      </Card>

      <div className="profile-section">
        <span className="profile-section__title">Personal details</span>
        <Card raised>
          <div className="profile-field">
            <span className="profile-field__label">Full name</span>
            <span className="profile-field__value">{user?.name ?? "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field__label">Email address</span>
            <span className="profile-field__value">{user?.email ?? "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field__label">Mobile number</span>
            <span className="profile-field__value">{user?.phone ?? "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field__label">PAN</span>
            <span className="profile-field__value">{user?.pan ?? "—"}</span>
          </div>
        </Card>
        <p className="my-account__kyc-note">
          Personal details are linked to your KYC and can't be edited here directly.
        </p>
      </div>

      <div className="profile-section">
        <span className="profile-section__title">Account details</span>
        <Card raised>
          <div className="profile-field">
            <span className="profile-field__label">Client ID</span>
            <span className="profile-field__value my-account__id-value">
              {user?.id ?? "—"}
              {user?.id && (
                <button
                  type="button"
                  className="my-account__copy-btn"
                  onClick={handleCopyId}
                  aria-label="Copy client ID"
                  title="Copy client ID"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              )}
            </span>
          </div>
          <div className="profile-field">
            <span className="profile-field__label">Account type</span>
            <span className="profile-field__value">Paper Trading</span>
          </div>
          {joinDate && (
            <div className="profile-field">
              <span className="profile-field__label">Member since</span>
              <span className="profile-field__value">{joinDate}</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.5 10.5v-6a1 1 0 0 1 1-1h6" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}