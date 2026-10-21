package cl.duoc.tiendaperritos.rabbit_admin_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ExchangeRequest(

        @NotBlank(message = "El nombre del exchange es obligatorio")
        String name,

        @NotBlank(message = "El tipo de exchange es obligatorio")
        @Pattern(
                regexp = "direct|topic|fanout",
                message = "El tipo debe ser direct, topic o fanout"
        )
        String type

) {
}