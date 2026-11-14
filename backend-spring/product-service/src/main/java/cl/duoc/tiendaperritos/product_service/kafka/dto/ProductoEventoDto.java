package cl.duoc.tiendaperritos.product_service.kafka.dto;

import java.math.BigDecimal;

public record ProductoEventoDto(
        String tipoEvento,
        Long productoId,
        String nombre,
        String descripcion,
        BigDecimal precio,
        Integer stock,
        String fecha
) {
}