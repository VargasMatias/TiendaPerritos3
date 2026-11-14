package cl.duoc.tiendaperritos.product_service.kafka.consumer;

import cl.duoc.tiendaperritos.product_service.kafka.dto.ProductoEventoDto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaProductoConsumer {

    private static final Logger log =
            LoggerFactory.getLogger(KafkaProductoConsumer.class);

    @KafkaListener(
        topics = "${app.kafka.topics.eventos}",
        groupId = "tiendaperritos-productos"
    )
    public void consumirEvento(ProductoEventoDto evento) {

        validar(evento);

        log.info(
            "[KAFKA-EVENTOS] Procesado: tipo={}, id={}, nombre={}",
            evento.tipoEvento(),
            evento.productoId(),
            evento.nombre()
        );
    }

    @KafkaListener(
        topics = "${app.kafka.topics.auditoria}",
        groupId = "tiendaperritos-auditoria"
    )
    public void consumirAuditoria(ProductoEventoDto evento) {

        validar(evento);

        log.info(
            "[KAFKA-AUDITORIA] Registrado: tipo={}, id={}, fecha={}",
            evento.tipoEvento(),
            evento.productoId(),
            evento.fecha()
        );
    }

    private void validar(ProductoEventoDto evento) {

        if (evento == null
                || evento.productoId() == null
                || evento.tipoEvento() == null
                || evento.tipoEvento().isBlank()) {

            log.error("[KAFKA] Evento inválido recibido");
            throw new IllegalArgumentException(
                "Evento Kafka inválido"
            );
        }
    }
}