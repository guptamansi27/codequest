import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Copy, Eye, Pencil, Plus, Power, RefreshCw, Trash2, Upload, X } from "lucide-react";
import api from "../../api/axiosInstance";
import Challenges from "./Challenges";
import ChallengeDetailModal from "./ChallengeDetailModal";
import ChallengeEditModal from "./ChallengeEditModal";
import ContentWrapper from "../layout/ContentWrapper";
import PageContainer from "../layout/PageContainer";
import SectionBlock from "../layout/SectionBlock";
import { ChallengeGridSkeleton } from "../ui/PremiumSkeleton";
import ProgramToggle from "../common/ProgramToggle";
import { notify } from "../../utils/notifications";
import "../../styles/admin/ChallengeDashboard.css";

const CHALLENGE_KIND_MODIFIERS = {
  challenge: "standard",
  assessment: "assessment",
  code_of_day: "code-of-day",
  code_of_the_day: "code-of-day",
};

const getModalTriggerPoint = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  return {
    x,
    y,
    shiftX: Math.round((x - window.innerWidth / 2) * 0.055),
    shiftY: Math.round((y - window.innerHeight / 2) * 0.055),
  };
};

const getModalMotionStyle = (point) => point
  ? {
      "--modal-origin-x": `${point.x}px`,
      "--modal-origin-y": `${point.y}px`,
      "--modal-shift-x": `${point.shiftX}px`,
      "--modal-shift-y": `${point.shiftY}px`,
    }
  : undefined;

function formatChallengeKindLabel(raw) {
  if (!raw) return "Challenge";
  return raw
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getChallengeKindModifier(challengeType) {
  const key = (challengeType || "challenge").toLowerCase();
  return CHALLENGE_KIND_MODIFIERS[key] || "standard";
}

const ChallengeDashboard = () => {
  const [challenges, setChallenges] = useState([]);
  const [viewState, setViewState] = useState(null);
  const [editState, setEditState] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("IGNITE");
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState({ open: false, clone: null, triggerPoint: null });
  const [bulkModal, setBulkModal] = useState({ open: false, triggerPoint: null });
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";
  const isSME = role === "sme";
  const canUsePortal = typeof document !== "undefined";

  /* =========================
     LOAD CHALLENGES
  ========================= */
  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (isAdmin) params.program_type = programFilter;
      const { data } = await api.get("/challenges/", { params });
      setChallenges(data);
    } catch (error) {
      notify.apiError(error, "Challenges could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, programFilter, isAdmin]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  useEffect(() => {
    if (!createModal.open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setCreateModal({ open: false, clone: null, triggerPoint: null });
    };
    document.body.classList.add("challenge-modal-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("challenge-modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [createModal.open]);

  useEffect(() => {
    if (!bulkModal.open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setBulkModal({ open: false, triggerPoint: null });
    };
    document.body.classList.add("challenge-modal-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("challenge-modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [bulkModal.open]);

  /* =========================
     STATUS CALCULATION
  ========================= */
  const getStatus = (c) => {
    if (!c.is_active) return "Inactive";

    const now = new Date();
    if (now < new Date(c.start_time)) return "Scheduled";
    if (now > new Date(c.end_time)) return "Expired";
    return "Active";
  };

  /* =========================
     FILTERING
  ========================= */
  const hasActiveFilters = Boolean(statusFilter || typeFilter);

  const clearFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
  };

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      if (!statusFilter) return true;
      return getStatus(c) === statusFilter;
    });
  }, [challenges, statusFilter]);

  /* =========================
     TOGGLES
  ========================= */
  const toggleField = async (id, payload) => {
    try {
      const { data } = await api.patch(`/challenges/${id}/toggle/`, payload);
      const isActivation = Object.prototype.hasOwnProperty.call(payload, "is_active");
      notify.success(
        isActivation
          ? `Challenge ${data.is_active ? "activated" : "deactivated"} successfully.`
          : `Challenge chatbot ${data.chatbot_enabled ? "enabled" : "disabled"} successfully.`
      );
      loadChallenges();
    } catch (error) {
      notify.apiError(error, "Challenge settings could not be updated.");
    }
  };

  const cloneChallenge = async (id, triggerPoint) => {
    try {
      const { data } = await api.get(`/challenges/${id}/`);
      notify.success("Challenge loaded for cloning. Review it before publishing.");
      setCreateModal({ open: true, clone: data, triggerPoint });
    } catch (error) {
      notify.apiError(error, "Challenge could not be loaded for cloning.");
    }
  };

  const removeChallenge = async (id) => {
    if (!isAdmin) return;
    try {
      await api.delete(`/challenges/${id}/`);
      notify.success("Challenge deleted successfully.");
      loadChallenges();
    } catch (error) {
      notify.apiError(error, "Challenge could not be deleted.");
    }
  };

  return (
    <PageContainer className="challenge-dashboard-page" maxWidth="var(--cq-content-max-width-wide)">
      <ContentWrapper>
        <div className="challenge-dashboard">
          <div className="challenge-dashboard-header">
            <div>
              <h1>{isSME ? "Manage Challenges" : "Challenges"}</h1>
              <p>{isAdmin ? "Manage visibility, chatbot availability, schedule, and platform status." : "Review, edit, clone, and analyze your challenge content."}</p>
            </div>
            <div className="challenge-dashboard-header-actions">
              {isSME && (
                <>
                  <button
                    type="button"
                    className="create-challenge-button create-challenge-button--header"
                    onClick={(event) => setCreateModal({ open: true, clone: null, triggerPoint: getModalTriggerPoint(event) })}
                  >
                    <Plus size={18} strokeWidth={2.4} />
                    Create Challenge
                  </button>
                  <button
                    type="button"
                    className="bulk-upload-dashboard-button"
                    onClick={(event) => setBulkModal({ open: true, triggerPoint: getModalTriggerPoint(event) })}
                  >
                    <Upload size={18} strokeWidth={2.4} />
                    Bulk Upload
                  </button>
                </>
              )}
              <button type="button" className="refresh-button" onClick={loadChallenges}>
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          <SectionBlock className="filter-bar">
            <div className="filter-controls">
             

              <div className="filter-group">
                <span className="filter-label">Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Scheduled</option>
                  <option>Expired</option>
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Type</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="challenge">Challenge</option>
                  <option value="assessment">Assessment</option>
                  <option value="code_of_the_day">Code of the Day</option>
                </select>
              </div>
            </div>

            <button type="button" className="filter-clear-button" onClick={clearFilters} disabled={!hasActiveFilters}>
              Clear Filters
            </button>
          </SectionBlock>

          {loading && <ChallengeGridSkeleton count={6} />}

          {!loading && filteredChallenges.length === 0 && (
            <SectionBlock className="empty-state">No challenges found for this filter.</SectionBlock>
          )}

          <div className="challenge-grid">
            {filteredChallenges.map((c) => {
              const status = getStatus(c);

              return (
                <div key={c.id} className="challenge-card">
                  <div className="card-head">
                    <div className="card-head-main">
                      <h3 className="challenge-card-title">{c.title}</h3>
                    </div>
                    <span className="xp">{c.xp_points} XP</span>
                  </div>

                  <div
                    className="challenge-card-meta"
                    role="group"
                    aria-label="Technology and challenge type"
                  >
                    {c.module_name ? (
                      <span className="challenge-card-module">{c.module_name}</span>
                    ) : null}
                    <span
                      className={`challenge-card-kind challenge-card-kind--${getChallengeKindModifier(c.challenge_type)}`}
                    >
                      {formatChallengeKindLabel(c.challenge_type)}
                    </span>
                  </div>

                  <div className="badge-row">
                    <span className={`badge ${status.toLowerCase()}`}>{status}</span>
                    <span className="badge muted">{c.difficulty}</span>
                  </div>

                  <div className="challenge-schedule">
                    <span>Starts: {new Date(c.start_time).toLocaleString()}</span>
                    <span>Ends: {new Date(c.end_time).toLocaleString()}</span>
                  </div>

                  {(isAdmin || isSME) && <div className="action-buttons">
                    <button
                      className={`toggle activation-toggle ${c.is_active ? "on" : "off"}`}
                      onClick={() =>
                        toggleField(c.id, { is_active: !c.is_active })
                      }
                    >
                      <Power size={15} />
                      {c.is_active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      className={`toggle chatbot-toggle ${c.chatbot_enabled ? "on" : "off"}`}
                      onClick={() =>
                        toggleField(c.id, {
                          chatbot_enabled: !c.chatbot_enabled,
                        })
                      }
                    >
                      <Bot size={15} />
                      {c.chatbot_enabled ? "Chatbot On" : "Chatbot Off"}
                    </button>
                  </div>}

                  <div className="icon-row">
                    <button type="button" title="View challenge" onClick={(event) => setViewState({ id: c.id, triggerPoint: getModalTriggerPoint(event) })}>
                      <Eye size={18} />
                    </button>
                    {isSME && <button type="button" title="Edit challenge" onClick={(event) => setEditState({ id: c.id, triggerPoint: getModalTriggerPoint(event) })}>
                      <Pencil size={18} />
                    </button>}
                    {isSME && <button type="button" title="Clone challenge" onClick={(event) => cloneChallenge(c.id, getModalTriggerPoint(event))}>
                      <Copy size={18} />
                    </button>}
                    {isAdmin && (
                      <button
                        type="button"
                        title="Delete challenge"
                        className="danger"
                        onClick={() => removeChallenge(c.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {viewState && (
          <ChallengeDetailModal
            id={viewState.id}
            triggerStyle={getModalMotionStyle(viewState.triggerPoint)}
            onClose={() => setViewState(null)}
            onChanged={loadChallenges}
          />
        )}

        {editState && (
          <ChallengeEditModal
            id={editState.id}
            triggerStyle={getModalMotionStyle(editState.triggerPoint)}
            onClose={() => setEditState(null)}
            refresh={loadChallenges}
          />
        )}

        {createModal.open && canUsePortal && createPortal(
          <div
            className="challenge-create-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-challenge-title"
            style={getModalMotionStyle(createModal.triggerPoint)}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setCreateModal({ open: false, clone: null, triggerPoint: null });
            }}
          >
            <div className="challenge-create-modal">
              <button
                type="button"
                className="challenge-create-modal-close"
                aria-label="Close create challenge modal"
                onClick={() => setCreateModal({ open: false, clone: null, triggerPoint: null })}
              >
                <X size={18} />
              </button>
              <div className="challenge-create-modal-body" id="create-challenge-title">
                <Challenges
                  embedded
                  initialClone={createModal.clone}
                  onSuccess={() => {
                    setCreateModal({ open: false, clone: null, triggerPoint: null });
                    loadChallenges();
                  }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

        {bulkModal.open && canUsePortal && createPortal(
          <div
            className="challenge-create-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-upload-title"
            style={getModalMotionStyle(bulkModal.triggerPoint)}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setBulkModal({ open: false, triggerPoint: null });
            }}
          >
            <div className="challenge-create-modal challenge-bulk-upload-shell">
              <button
                type="button"
                className="challenge-create-modal-close"
                aria-label="Close bulk upload modal"
                onClick={() => setBulkModal({ open: false, triggerPoint: null })}
              >
                <X size={18} />
              </button>
              <div className="challenge-create-modal-body" id="bulk-upload-title">
                <Challenges
                  embedded
                  bulkOnly
                  onSuccess={() => {
                    setBulkModal({ open: false, triggerPoint: null });
                    loadChallenges();
                  }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default ChallengeDashboard;
