package com.codequest.backend.entity;

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

@Entity
@Table(name = "apis_challengeattempt")
public class ChallengeAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "challenge_id")
    private Challenge challenge;
    @Column(name = "started_at", updatable = false)
    private OffsetDateTime startedAt;
    @Column(name = "last_opened_at")
    private OffsetDateTime lastOpenedAt;
    @Column(name = "total_time_seconds")
    private int totalTimeSeconds;
    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
    @Column(name = "is_completed")
    private boolean completed;
    @PrePersist void prePersist() { if (startedAt == null) startedAt = OffsetDateTime.now(); }
    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Challenge getChallenge() { return challenge; }
    public void setChallenge(Challenge challenge) { this.challenge = challenge; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public OffsetDateTime getLastOpenedAt() { return lastOpenedAt; }
    public void setLastOpenedAt(OffsetDateTime lastOpenedAt) { this.lastOpenedAt = lastOpenedAt; }
    public int getTotalTimeSeconds() { return totalTimeSeconds; }
    public void setTotalTimeSeconds(int totalTimeSeconds) { this.totalTimeSeconds = totalTimeSeconds; }
    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
}
