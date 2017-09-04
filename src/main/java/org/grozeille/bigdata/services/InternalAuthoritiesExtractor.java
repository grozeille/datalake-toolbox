package org.grozeille.bigdata.services;

import lombok.extern.slf4j.Slf4j;
import org.grozeille.bigdata.repositories.jpa.AdminUserRepository;
import org.grozeille.bigdata.resources.admin.model.AdminUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.resource.AuthoritiesExtractor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class InternalAuthoritiesExtractor implements AuthoritiesExtractor {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Override
    public List<GrantedAuthority> extractAuthorities(Map<String, Object> map) {
        // by default, all authenticated users are USER
        List<GrantedAuthority> roles = Arrays.asList(new SimpleGrantedAuthority("ROLE_USER"));

        // retrieve from the list of admins the ADMIN role
        AdminUser adminUser = adminUserRepository.findOne(map.get("login").toString());
        if (adminUser != null) {
            roles = new ArrayList<GrantedAuthority>(roles);
            roles.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        return roles;
    }
}
