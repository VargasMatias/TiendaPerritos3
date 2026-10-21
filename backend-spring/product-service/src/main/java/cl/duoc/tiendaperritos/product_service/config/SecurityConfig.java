package cl.duoc.tiendaperritos.product_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;


@Configuration
public class SecurityConfig {


    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

            .csrf(csrf ->
                csrf.disable()
            )

            .cors(
                Customizer.withDefaults()
            )

            .authorizeHttpRequests(auth -> auth

                // Permitir preflight CORS
                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                )
                .permitAll()

                // Health público
                .requestMatchers(
                    "/actuator/health"
                )
                .permitAll()

                // Cliente y Admin pueden leer productos
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/productos/**"
                )
                .authenticated()

                // Solo Admin puede crear
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/productos/**"
                )
                .hasRole("Admin")

                // Solo Admin puede modificar
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/productos/**"
                )
                .hasRole("Admin")

                // Solo Admin puede eliminar
                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/productos/**"
                )
                .hasRole("Admin")

                .anyRequest()
                .authenticated()
            )

            .oauth2ResourceServer(
                oauth2 ->
                    oauth2.jwt(
                        jwt ->
                            jwt.jwtAuthenticationConverter(
                                jwtAuthenticationConverter()
                            )
                    )
            );

        return http.build();
    }


    @Bean
    public JwtAuthenticationConverter
    jwtAuthenticationConverter() {

        JwtGrantedAuthoritiesConverter
            scopeConverter =
                new JwtGrantedAuthoritiesConverter();

        Converter<
            Jwt,
            Collection<GrantedAuthority>
        > authoritiesConverter =
            jwt -> {

                Collection<GrantedAuthority>
                    authorities =
                        new ArrayList<>();

                Collection<GrantedAuthority>
                    scopes =
                        scopeConverter.convert(jwt);

                if (scopes != null) {
                    authorities.addAll(scopes);
                }

                List<String> grupos =
                    jwt.getClaimAsStringList(
                        "cognito:groups"
                    );

                if (grupos != null) {

                    for (String grupo : grupos) {

                        authorities.add(
                            new SimpleGrantedAuthority(
                                "ROLE_" + grupo
                            )
                        );
                    }
                }

                return authorities;
            };


        JwtAuthenticationConverter converter =
            new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(
            authoritiesConverter
        );

        return converter;
    }


    @Bean
    public CorsConfigurationSource
    corsConfigurationSource() {

        CorsConfiguration configuration =
            new CorsConfiguration();

        configuration.setAllowedOrigins(
            List.of(
                "http://localhost:4200"
            )
        );

        configuration.setAllowedMethods(
            List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
            )
        );

        configuration.setAllowedHeaders(
            List.of(
                "Authorization",
                "Content-Type"
            )
        );

        configuration.setAllowCredentials(
            true
        );


        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            configuration
        );

        return source;
    }
}