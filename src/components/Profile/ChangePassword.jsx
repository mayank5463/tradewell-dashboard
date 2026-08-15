import { useState } from "react";
import Card from "../common/Card/Card";
import Button from "../common/Button/Button";
import { changePassword } from "../../services/authService";
import "./Profile.css";
import "./ChangePassword.css";


function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return score; // 0-4
}

const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Good", "Strong"];

export default function ChangePassword() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSuccess(false);
  };

  const toggleVisible = (field) => () => {
    setVisible((v) => ({ ...v, [field]: !v[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    if (!form.current || !form.next || !form.confirm) {
      setError("Fill in all three fields.");
      return;
    }
    if (form.next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.next !== form.confirm) {
      setError("New password and confirmation don't match.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await changePassword({ currentPassword: form.current, newPassword: form.next });
      setSuccess(true);
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      // apiFetch throws a bare "Request failed: HTTP xxx" when the response
      // body has neither `message` nor `error` (route not implemented yet,
      // network hiccup, etc) — that's not something to show verbatim.
      // Anything else is a real server message (e.g. "Current password is
      // incorrect."), which gets shown exactly as sent.
      const isGenericFailure = /^Request failed: HTTP/.test(err.message);
      setError(
        isGenericFailure
          ? "Couldn't update your password right now. Please try again shortly."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const strength = getPasswordStrength(form.next);

  return (
    <div className="profile-page">
      <h2 className="profile-page__title">Change Password</h2>
      <p className="profile-page__subtitle">Use a strong password you don't reuse anywhere else.</p>

      <Card raised className="profile-page__card">
        <form className="profile-form" onSubmit={handleSubmit}>
          <label className="profile-form__field">
            <span>Current password</span>
            <div className="change-password__input-wrap">
              <input
                type={visible.current ? "text" : "password"}
                value={form.current}
                onChange={handleChange("current")}
                autoComplete="current-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="change-password__eye-btn"
                onClick={toggleVisible("current")}
                aria-label={visible.current ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {visible.current ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>

          <label className="profile-form__field">
            <span>New password</span>
            <div className="change-password__input-wrap">
              <input
                type={visible.next ? "text" : "password"}
                value={form.next}
                onChange={handleChange("next")}
                autoComplete="new-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="change-password__eye-btn"
                onClick={toggleVisible("next")}
                aria-label={visible.next ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {visible.next ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {form.next && (
              <div className={`change-password__strength strength-${strength}`}>
                <div className="change-password__strength-bars">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={i < strength ? "is-filled" : ""} />
                  ))}
                </div>
                <span className="change-password__strength-label">{STRENGTH_LABEL[strength]}</span>
              </div>
            )}
          </label>

          <label className="profile-form__field">
            <span>Confirm new password</span>
            <div className="change-password__input-wrap">
              <input
                type={visible.confirm ? "text" : "password"}
                value={form.confirm}
                onChange={handleChange("confirm")}
                autoComplete="new-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="change-password__eye-btn"
                onClick={toggleVisible("confirm")}
                aria-label={visible.confirm ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {visible.confirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>

          {error && (
            <p className="profile-banner profile-banner--error">
              <AlertIcon /> {error}
            </p>
          )}
          {success && (
            <p className="profile-banner profile-banner--success">
              <CheckIcon /> Password updated.
            </p>
          )}

          <Button type="submit" variant="gradient" fullWidth loading={submitting}>
            {submitting ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 17L17 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.8" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 8.2l2 2 4-4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}