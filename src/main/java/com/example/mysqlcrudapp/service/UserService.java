package com.example.mysqlcrudapp.service;

import com.example.mysqlcrudapp.entity.User;
import com.example.mysqlcrudapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository userRepository;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByLogin(String login) {
        return userRepository.findByLogin(login);
    }

    @Transactional
    public User create(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public Optional<User> update(Long id, User userDetails) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setLogin(userDetails.getLogin());
                    user.setEmail(userDetails.getEmail());
                    user.setPasswordHash(userDetails.getPasswordHash());
                    user.setFullName(userDetails.getFullName());
                    user.setUserType(userDetails.getUserType());
                    return userRepository.save(user);
                });
    }

    public boolean existsById(Long id) {
        return userRepository.existsById(id);
    }

    @Transactional
    public boolean deleteById(Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public void updateLastLogin(Long id) {
        userRepository.findById(id)
                .ifPresent(user -> {
                    user.setLastLogin(LocalDateTime.now());
                    userRepository.save(user);
                });
    }
}
