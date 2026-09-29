package com.chulhachauka.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Loads a {@link User} by phone number.
     * Spring Security calls this during authentication.
     *
     * @param phone the phone number used as the username
     * @return the matching {@link UserDetails}
     * @throws UsernameNotFoundException if no user with the given phone exists
     */
    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No user found with phone: " + phone));
    }
}
