package cl.duoc.tiendaperritos.product_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .csrf(AbstractHttpConfigurer::disable)

            .authorizeHttpRequests(auth -> auth

                // Health check público
                .requestMatchers("/actuator/health").permitAll()

                // Lectura: cualquier usuario autenticado
                .requestMatchers(
                        org.springframework.http.HttpMethod.GET,
                        "/api/productos/**"
                ).authenticated()

                // Escritura: solamente Admin
                .requestMatchers(
                        org.springframework.http.HttpMethod.POST,
                        "/api/productos/**"
                ).hasRole("Admin")

                .requestMatchers(
                        org.springframework.http.HttpMethod.PUT,
                        "/api/productos/**"
                ).hasRole("Admin")

                .requestMatchers(
                        org.springframework.http.HttpMethod.DELETE,
                        "/api/productos/**"
                ).hasRole("Admin")

                .anyRequest().authenticated()
            )

            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(cognitoJwtConverter())
                )
            )

            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public Converter<Jwt, AbstractAuthenticationToken> cognitoJwtConverter() {

        return jwt -> {

            Collection<GrantedAuthority> authorities = new ArrayList<>();

            List<String> groups = jwt.getClaimAsStringList("cognito:groups");

            if (groups != null) {
                for (String group : groups) {
                    authorities.add(
                        new SimpleGrantedAuthority("ROLE_" + group)
                    );
                }
            }

            return new JwtAuthenticationToken(
                    jwt,
                    authorities,
                    jwt.getSubject()
            );
        };
    }
}