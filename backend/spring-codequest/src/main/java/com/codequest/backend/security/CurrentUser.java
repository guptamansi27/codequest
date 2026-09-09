package com.codequest.backend.security;

import com.codequest.backend.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    public User get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CodeQuestUserDetails details)) {
            throw new IllegalStateException("Authenticated user required");
        }
        return details.user();
    }
    public boolean isAdmin(User user) { return user.isStaff() || "ADMIN".equals(user.getRole()); }
    public boolean isSme(User user) { return "SME".equals(user.getRole()); }
}
