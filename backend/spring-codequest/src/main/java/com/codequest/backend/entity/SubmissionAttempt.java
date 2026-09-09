package com.codequest.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "apis_submissionattempt")
public class SubmissionAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "challenge_id")
    private Challenge challenge;
    @Column(name = "submitted_code", columnDefinition = "text")
    private String submittedCode;
    @Column(name = "is_passed")
    private boolean passed;
    @Column(name = "passed_count")
    private int passedCount;
    @Column(name = "total_count")
    private int totalCount;
    @Column(name = "awarded_xp")
    private int awardedXp;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode feedback;
    @Column(name = "submitted_at", updatable = false)
    private OffsetDateTime submittedAt;
    @PrePersist void prePersist() { if (submittedAt == null) submittedAt = OffsetDateTime.now(); }
    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Challenge getChallenge() { return challenge; }
    public void setChallenge(Challenge challenge) { this.challenge = challenge; }
    public String getSubmittedCode() { return submittedCode; }
    public void setSubmittedCode(String submittedCode) { this.submittedCode = submittedCode; }
    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }
    public int getPassedCount() { return passedCount; }
    public void setPassedCount(int passedCount) { this.passedCount = passedCount; }
    public int getTotalCount() { return totalCount; }
    public void setTotalCount(int totalCount) { this.totalCount = totalCount; }
    public int getAwardedXp() { return awardedXp; }
    public void setAwardedXp(int awardedXp) { this.awardedXp = awardedXp; }
    public JsonNode getFeedback() { return feedback; }
    public void setFeedback(JsonNode feedback) { this.feedback = feedback; }
    public OffsetDateTime getSubmittedAt() { return submittedAt; }
}
