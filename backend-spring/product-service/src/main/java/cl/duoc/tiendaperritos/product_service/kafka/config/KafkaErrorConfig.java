
package cl.duoc.tiendaperritos.product_service.kafka.config;

import cl.duoc.tiendaperritos.product_service.kafka.dto.ProductoEventoDto;

import org.apache.kafka.common.TopicPartition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaErrorConfig {

    private static final Logger log =
            LoggerFactory.getLogger(KafkaErrorConfig.class);

    @Bean
    public DefaultErrorHandler kafkaErrorHandler(
            KafkaTemplate<String, ProductoEventoDto> kafkaTemplate) {

        DeadLetterPublishingRecoverer recoverer =
                new DeadLetterPublishingRecoverer(
                        kafkaTemplate,
                        (record, exception) ->
                                new TopicPartition(
                                        record.topic() + ".dlt",
                                        record.partition()
                                )
                );

        recoverer.setFailIfSendResultIsError(true);

        return new DefaultErrorHandler(
                (record, exception) -> {

                    log.error(
                            "[KAFKA-DLT] Fallo definitivo. Topico={}, " +
                            "particion={}, offset={}. Enviando a DLT",
                            record.topic(),
                            record.partition(),
                            record.offset(),
                            exception
                    );

                    recoverer.accept(record, exception);
                },
                new FixedBackOff(1000L, 2L)
        );
    }
}
