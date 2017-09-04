package org.grozeille.bigdata.resources.user;

import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.grozeille.bigdata.repositories.jpa.UserRepository;
import org.grozeille.bigdata.resources.user.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import springfox.documentation.annotations.ApiIgnore;

import java.security.Principal;

@RestController
@Slf4j
@RequestMapping("/api/user")
public class UserResource {

    @Autowired
    private UserRepository userRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value = "", method = RequestMethod.GET)
    public Iterable<User> getAll() {
        return this.userRepository.findAll();
    }

    @RequestMapping(value = "/current",  method = RequestMethod.GET)
    public Principal user(@ApiIgnore @ApiParam(hidden = true) Principal principal) {
        return principal;
    }

}