package com.codequest.backend.security;

import com.codequest.backend.entity.User;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class CodeQuestUserDetails implements UserDetails {
    private final User user;
    public CodeQuestUserDetails(User user) { this.user = user; }
    public User user() { return user; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        String role = user.getRole() == null ? "USER" : user.getRole();
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
    @Override public String getPassword() { return user.getPassword() == null ? "" : user.getPassword(); }
    @Override public String getUsername() { return user.getEmail(); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return user.isActive(); }
}
