package com.LuxMart.security;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.LuxMart.repository.StoreRepository;
import com.LuxMart.repository.UserRepository;
import com.LuxMart.security.store.StorePrincipal;
import com.LuxMart.security.user.UserPrincipal;

@RequiredArgsConstructor
@Slf4j
@Service
public class MyUserServiceDetails implements UserDetailsService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username)
                .<UserDetails>map(UserPrincipal::new)
                .orElseGet(() ->
                        storeRepository.findStoreEntitiesByEmail(username)
                                .<UserDetails>map(StorePrincipal::new)
                                .orElseThrow(() ->
                                        new UsernameNotFoundException("User or Store not found: " + username))
                );
    }
}
