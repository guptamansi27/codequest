package com.codequest.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "apis_challenge")
public class Challenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(columnDefinition = "text")
    private String description;
    private String difficulty;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private Module module;
    @Column(name = "challenge_type")
    private String challengeType;
    private String type = "challenge";
    private String technology = "html";
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "starter_code", columnDefinition = "jsonb")
    private JsonNode starterCode;
    @Column(name = "xp_points")
    private Integer xpPoints = 10;
    @Column(name = "chatbot_enabled")
    private boolean chatbotEnabled;
    @Column(name = "is_chatbot_enabled")
    private boolean chatbotEnabledAlias;
    @Column(name = "start_time")
    private OffsetDateTime startTime;
    @Column(name = "end_time")
    private OffsetDateTime endTime;
    @Column(name = "is_active")
    private boolean active = true;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestCase> testCases = new ArrayList<>();
    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChallengeAssignment> employeeAssignments = new ArrayList<>();

    @PrePersist
    @PreUpdate
    void normalizeAliases() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (challengeType == null && type != null) challengeType = switch (type) {
            case "test" -> "ASSESSMENT";
            case "code_of_the_day" -> "CODE_OF_DAY";
            default -> "CHALLENGE";
        };
        type = switch (challengeType == null ? "CHALLENGE" : challengeType) {
            case "ASSESSMENT" -> "test";
            case "CODE_OF_DAY" -> "code_of_the_day";
            default -> type == null ? "challenge" : type;
        };
        if (module != null && module.getName() != null) {
            technology = switch (module.getName()) {
                case "CSS" -> "css";
                case "JS" -> "js";
                case "REACT" -> "react";
                default -> "html";
            };
        }
        chatbotEnabledAlias = chatbotEnabled;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public Module getModule() { return module; }
    public void setModule(Module module) { this.module = module; }
    public String getChallengeType() { return challengeType; }
    public void setChallengeType(String challengeType) { this.challengeType = challengeType; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTechnology() { return technology; }
    public void setTechnology(String technology) { this.technology = technology; }
    public JsonNode getStarterCode() { return starterCode; }
    public void setStarterCode(JsonNode starterCode) { this.starterCode = starterCode; }
    public Integer getXpPoints() { return xpPoints; }
    public void setXpPoints(Integer xpPoints) { this.xpPoints = xpPoints; }
    public boolean isChatbotEnabled() { return chatbotEnabled; }
    public void setChatbotEnabled(boolean chatbotEnabled) { this.chatbotEnabled = chatbotEnabled; }
    public boolean isChatbotEnabledAlias() { return chatbotEnabledAlias; }
    public void setChatbotEnabledAlias(boolean chatbotEnabledAlias) { this.chatbotEnabledAlias = chatbotEnabledAlias; this.chatbotEnabled = chatbotEnabledAlias; }
    public OffsetDateTime getStartTime() { return startTime; }
    public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }
    public OffsetDateTime getEndTime() { return endTime; }
    public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public List<TestCase> getTestCases() { return testCases; }
    public List<ChallengeAssignment> getEmployeeAssignments() { return employeeAssignments; }
}
