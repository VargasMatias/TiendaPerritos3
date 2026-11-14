package cl.duoc.tiendaperritos.product_service.kafka.producer;

import cl.duoc.tiendaperritos.product_service.kafka.dto.ProductoEventoDto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProductoProducer {

    private static final Logger log =
            LoggerFactory.getLogger(KafkaProductoProducer.class);

    private final KafkaTemplate<String, ProductoEventoDto> kafkaTemplate;

    @Value("${app.kafka.topics.eventos}")
    private String topicoEventos;

    @Value("${app.kafka.topics.auditoria}")
    private String topicoAuditoria;

    public KafkaProductoProducer(
            KafkaTemplate<String, ProductoEventoDto> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publicarEvento(ProductoEventoDto evento) {
        enviar(topicoEventos, evento);
    }

    public void publicarAuditoria(ProductoEventoDto evento) {
        enviar(topicoAuditoria, evento);
    }

    private void enviar(String topico, ProductoEventoDto evento) {

        String clave = String.valueOf(evento.productoId());

        kafkaTemplate.send(topico, clave, evento)
                .whenComplete((resultado, error) -> {

                    if (error != null) {
                        log.error(
                                "[KAFKA] Error publicando en {}",
                                topico,
                                error
                        );
                    } else {
                        log.info(
                                "[KAFKA] Evento {} publicado en {} particion {} offset {}",
                                evento.tipoEvento(),
                                topico,
                                resultado.getRecordMetadata().partition(),
                                resultado.getRecordMetadata().offset()
                        );
                    }
                });
    }
}