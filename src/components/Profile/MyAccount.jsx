

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Card from "../common/Card/Card";
import Button from "../common/Button/Button";
import { getProfile, updateProfile } from "../../services/authService";
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
  const [profile, setProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState("loading");
  const [copied, setCopied] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    pan: "",
    gender: "",
    dob: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (cancelled) return;
        const userData = data?.user ?? data;
        setProfile(userData);
        setProfileStatus("ok");
        // Populate edit form
        setEditForm({
          name: userData?.name || "",
          phone: userData?.phone || "",
          pan: userData?.pan || "",
          gender: userData?.gender || "",
          dob: userData?.dob || "",
          address: userData?.address || "",
          city: userData?.city || "",
          state: userData?.state || "",
          pincode: userData?.pincode || "",
        });
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

  const handleEditChange = (field) => (e) => {
    setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSaveSuccess(false);
    setSaveError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateProfile(editForm);
      setProfile((prev) => ({ ...prev, ...editForm }));
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError("");
    setSaveSuccess(false);
  };

  return (
    <div className="profile-page">
      <h2 className="profile-page__title">My Account</h2>
      <p className="profile-page__subtitle">Your personal and account details at a glance.</p>

      {/* Profile Header Card */}
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

      {/* Success/Error Banners */}
      {saveSuccess && (
        <div className="profile-banner profile-banner--success">
          <CheckIcon /> Profile updated successfully!
        </div>
      )}
      {saveError && (
        <div className="profile-banner profile-banner--error">
          ⚠ {saveError}
        </div>
      )}

      {/* Personal Details */}
      <div className="profile-section">
        <div className="profile-section__header">
          <span className="profile-section__title">Personal details</span>
          {!isEditing ? (
            <button className="my-account__edit-btn" onClick={() => setIsEditing(true)}>
              <EditIcon /> Edit
            </button>
          ) : (
            <div className="my-account__edit-actions">
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" onClick={handleSave} loading={saving}>
                Save
              </Button>
            </div>
          )}
        </div>

        <Card raised>
          {!isEditing ? (
            <>
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
                <span className="profile-field__value">{user?.phone || "Not added"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">PAN</span>
                <span className="profile-field__value">{user?.pan || "Not added"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">Gender</span>
                <span className="profile-field__value">{user?.gender || "Not added"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">Date of birth</span>
                <span className="profile-field__value">{user?.dob || "Not added"}</span>
              </div>
            </>
          ) : (
            <div className="profile-form">
              <div className="profile-form__field">
                <label>Full name</label>
                <input type="text" value={editForm.name} onChange={handleEditChange("name")} placeholder="Enter your full name" />
              </div>
              <div className="profile-form__field">
                <label>Mobile number</label>
                <input type="tel" value={editForm.phone} onChange={handleEditChange("phone")} placeholder="10-digit mobile number" />
              </div>
              <div className="profile-form__field">
                <label>PAN</label>
                <input type="text" value={editForm.pan} onChange={handleEditChange("pan")} placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: "uppercase" }} />
              </div>
              <div className="profile-form__field">
                <label>Gender</label>
                <select value={editForm.gender} onChange={handleEditChange("gender")}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="profile-form__field">
                <label>Date of birth</label>
                <input type="date" value={editForm.dob} onChange={handleEditChange("dob")} />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Address Section */}
      <div className="profile-section">
        <span className="profile-section__title">Address</span>
        <Card raised>
          {!isEditing ? (
            <>
              <div className="profile-field">
                <span className="profile-field__label">Address</span>
                <span className="profile-field__value">{user?.address || "Not added"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">City</span>
                <span className="profile-field__value">{user?.city || "Not added"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">State</span>
                <span className="profile-field__value">{user?.state || "Not added"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">Pincode</span>
                <span className="profile-field__value">{user?.pincode || "Not added"}</span>
              </div>
            </>
          ) : (
            <div className="profile-form">
              <div className="profile-form__field">
                <label>Address</label>
                <input type="text" value={editForm.address} onChange={handleEditChange("address")} placeholder="Street, area" />
              </div>
              <div className="profile-form__field">
                <label>City</label>
                <input type="text" value={editForm.city} onChange={handleEditChange("city")} placeholder="City" />
              </div>
              <div className="profile-form__field">
                <label>State</label>
                <input type="text" value={editForm.state} onChange={handleEditChange("state")} placeholder="State" />
              </div>
              <div className="profile-form__field">
                <label>Pincode</label>
                <input type="text" value={editForm.pincode} onChange={handleEditChange("pincode")} placeholder="6-digit pincode" maxLength={6} />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Account Details */}
      <div className="profile-section">
        <span className="profile-section__title">Account details</span>
        <Card raised>
          <div className="profile-field">
            <span className="profile-field__label">Client ID</span>
            <span className="profile-field__value my-account__id-value">
              {user?.id ?? "—"}
              {user?.id && (
                <button type="button" className="my-account__copy-btn" onClick={handleCopyId} aria-label="Copy client ID" title="Copy client ID">
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              )}
            </span>
          </div>
          <div className="profile-field">
            <span className="profile-field__label">Account type</span>
            <span className="profile-field__value">
              <span className="profile-badge">Paper Trading</span>
            </span>
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

function EditIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}




