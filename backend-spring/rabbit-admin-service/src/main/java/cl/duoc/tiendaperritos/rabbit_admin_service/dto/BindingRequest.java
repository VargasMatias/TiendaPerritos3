package cl.duoc.tiendaperritos.rabbit_admin_service.dto;

import jakarta.validation.constraints.NotBlank;

public record BindingRequest(

        @NotBlank(message = "El nombre del exchange es obligatorio")
        String exchange,

        @NotBlank(message = "El nombre de la cola es obligatorio")
        String queue,

        @NotBlank(message = "La routing key es obligatoria")
        String routingKey

) {
}